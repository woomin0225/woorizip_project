import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import { synthesizeTts } from '../api/ttsApi';
import botIcon from '../../../assets/images/ai_bot.png';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseJwt } from '../../../app/providers/utils/jwt';
import { useVoiceMode } from '../context/VoiceModeContext';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ACTIONS = [
  { id: 'reserve', label: '예약', prompt: '공용시설 예약', aliases: ['시설예약', '공용시설예약', '예약하기'], related: ['facilityHours', 'reservationStatus', 'facilityCancel'], mode: 'direct' },
  { id: 'summary', label: '요약', prompt: '현재 페이지 요약', aliases: ['페이지요약', '내용요약', '설명요약'], related: ['roomRecommend', 'facilityInfo', 'reviews'], mode: 'direct' },
  { id: 'roomRecommend', label: '방 추천', prompt: '방 추천', aliases: ['방추천', '추천방', '인기방', '인기있는방보기'], related: ['availableRooms', 'deposit', 'monthlyRent'], mode: 'direct' },
  { id: 'facilityHours', label: '이용시간', prompt: '공용시설 이용시간', aliases: ['운영시간', '몇시까지', '시설시간'], related: ['reserve', 'facilityInfo', 'facilityCancel'], mode: 'direct' },
  { id: 'facilityCancel', label: '예약취소', prompt: '공용시설 예약 취소', aliases: ['취소', '예약취소', '시설취소'], related: ['reservationStatus', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'facilityInfo', label: '시설안내', prompt: '공용시설 안내', aliases: ['시설정보', '시설안내', '공용시설'], related: ['reserve', 'facilityHours', 'gym'], mode: 'agent' },
  { id: 'gym', label: '헬스장', prompt: '헬스장 이용 안내', aliases: ['운동', '피트니스'], related: ['facilityInfo', 'reserve', 'facilityHours'], mode: 'agent' },
  { id: 'laundry', label: '세탁실', prompt: '세탁실 이용 안내', aliases: ['빨래', '세탁'], related: ['facilityInfo', 'facilityHours', 'reserve'], mode: 'agent' },
  { id: 'lounge', label: '라운지', prompt: '라운지 이용 안내', aliases: ['공용라운지', '휴게실'], related: ['facilityInfo', 'facilityHours', 'reserve'], mode: 'agent' },
  { id: 'studyRoom', label: '스터디룸', prompt: '스터디룸 이용 안내', aliases: ['공부방', '스터디'], related: ['reserve', 'facilityHours', 'facilityInfo'], mode: 'agent' },
  { id: 'reservationStatus', label: '예약내역', prompt: '예약 내역 확인', aliases: ['예약현황', '내예약', '예약목록'], related: ['facilityCancel', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'availableRooms', label: '빈방', prompt: '현재 빈방 안내', aliases: ['공실', '입주가능방', '남은방'], related: ['roomRecommend', 'deposit', 'monthlyRent'], mode: 'agent' },
  { id: 'moveIn', label: '입주', prompt: '입주 절차 안내', aliases: ['입주절차', '체크인'], related: ['contract', 'deposit', 'tour'], mode: 'agent' },
  { id: 'moveOut', label: '퇴실', prompt: '퇴실 절차 안내', aliases: ['퇴거', '체크아웃'], related: ['contract', 'rules', 'contact'], mode: 'agent' },
  { id: 'deposit', label: '보증금', prompt: '보증금 안내', aliases: ['디파짓', '계약금'], related: ['monthlyRent', 'contract', 'roomRecommend'], mode: 'agent' },
  { id: 'monthlyRent', label: '월세', prompt: '월세 안내', aliases: ['임대료', '관리비'], related: ['deposit', 'roomRecommend', 'availableRooms'], mode: 'agent' },
  { id: 'wishlist', label: '찜', prompt: '찜한 방 확인', aliases: ['위시리스트', '좋아요'], related: ['roomRecommend', 'availableRooms', 'reviews'], mode: 'agent' },
  { id: 'contract', label: '계약', prompt: '계약 관련 안내', aliases: ['전자계약', '계약서'], related: ['deposit', 'moveIn', 'moveOut'], mode: 'agent' },
  { id: 'tour', label: '투어', prompt: '투어 신청 안내', aliases: ['방보러가기', '방투어'], related: ['roomRecommend', 'availableRooms', 'moveIn'], mode: 'agent' },
  { id: 'reviews', label: '후기', prompt: '후기 요약 안내', aliases: ['리뷰', '평가'], related: ['roomRecommend', 'summary', 'facilityInfo'], mode: 'agent' },
  { id: 'roomOptions', label: '옵션', prompt: '방 옵션 안내', aliases: ['옵션정보', '가구', '가전'], related: ['roomRecommend', 'availableRooms', 'deposit'], mode: 'agent' },
  { id: 'location', label: '위치', prompt: '위치 안내', aliases: ['주소', '교통', '주변'], related: ['roomRecommend', 'tour', 'facilityInfo'], mode: 'agent' },
  { id: 'contact', label: '문의', prompt: '문의 방법 안내', aliases: ['연락', '문의하기', '상담'], related: ['contract', 'moveIn', 'moveOut'], mode: 'agent' },
  { id: 'rules', label: '규정', prompt: '이용 규정 안내', aliases: ['정책', '규칙', '유의사항'], related: ['facilityInfo', 'moveOut', 'contract'], mode: 'agent' },
];

const STARTER_ACTION_IDS = ['reserve', 'summary', 'roomRecommend'];
const VOICE_CONFIRM_ACTIONS = new Set(['reserve', 'facilityCancel']);
const YES_TOKENS = ['예', '네', '응', '맞아', '좋아', '확인', '진행'];
const NO_TOKENS = ['아니오', '아니', '취소', '중지', '그만', '싫어'];

const ACTION_MAP = ACTIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

const uniqActionIds = (ids) => {
  const seen = new Set();
  return ids.filter((id) => ACTION_MAP[id] && !seen.has(id) && seen.add(id));
};

const normalizeText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');
const getActionTokens = (action) => [action.label, action.prompt, ...(action.aliases || [])].map(normalizeText).filter(Boolean);
const getDirectTriggerTokens = (action) => [action.label, ...(action.aliases || [])].map(normalizeText).filter(Boolean);

const matchActionIds = (value, options = {}) => {
  const text = normalizeText(value);
  if (!text) return [];

  return ACTIONS.map((action) => {
    if (options.directOnly && action.mode !== 'direct') return { id: action.id, score: 0 };
    const score = getActionTokens(action).reduce((max, token) => {
      if (!token || !text.includes(token)) return max;
      return Math.max(max, token.length);
    }, 0);
    return { id: action.id, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id);
};

const detectQuickAction = (value) => {
  const text = normalizeText(value);
  if (!text) return null;

  return (
    ACTIONS.find((action) =>
      getDirectTriggerTokens(action).some((token) => token === text)
    )?.id || null
  );
};
const suggestActionsFromText = (value) => matchActionIds(value);

const expandRelatedActionIds = (ids, limit = 3) => {
  const selected = uniqActionIds(ids);
  const result = [...selected];

  for (let i = 0; i < selected.length && result.length < limit; i += 1) {
    const current = ACTION_MAP[selected[i]];
    (current?.related || []).forEach((relatedId) => {
      if (result.length < limit && ACTION_MAP[relatedId] && !result.includes(relatedId)) {
        result.push(relatedId);
      }
    });
  }

  return result.slice(0, limit);
};

const isYes = (value) => YES_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));
const isNo = (value) => NO_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));

export default function OrchestrateQuickAgent() {
  const navigate = useNavigate();
  const { accessToken, userId } = useAuth();
  const {
    voiceModeEnabled,
    listening,
    settings,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    enableVoiceMode,
    disableVoiceMode,
    speak,
    startListening,
    stopListening,
  } = useVoiceMode();

  const bottomRef = useRef(null);
  const lastSpokenMessageRef = useRef('');
  const userDisplayName = useMemo(() => {
    const payload = parseJwt(accessToken);
    const rawName = payload?.name || payload?.userName || payload?.nickname || payload?.preferred_username;
    if (rawName) return String(rawName).trim();
    if (userId) return String(userId).split('@')[0].trim();
    return '고객';
  }, [accessToken, userId]);

  const greetingText = useMemo(
    () => `안녕하세요! 저는 ${userDisplayName} 님만을 위한 비서 우리봇이에요! 도움이 필요하거나 궁금한 것이 있다면 아래 대화창에 입력해주세요!`,
    [userDisplayName]
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: greetingText, actionIds: STARTER_ACTION_IDS },
  ]);
  const [sessionId] = useState(newSessionId);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistant = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === 'assistant') || null,
    [messages]
  );
  const latestAssistantMessage = latestAssistant?.text || '';

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  useEffect(() => {
    if (voiceModeEnabled) {
      setOpen(true);
    }
  }, [voiceModeEnabled]);

  useEffect(() => {
    if (!voiceModeEnabled || !settings.autoReadBotReplies || !isSpeechSynthesisSupported || !latestAssistant) return;
    const suggestionText = Array.isArray(latestAssistant.actionIds) && latestAssistant.actionIds.length > 0
      ? ` 추천 명령은 ${latestAssistant.actionIds.map((id) => ACTION_MAP[id]?.label).filter(Boolean).join(', ')} 입니다.`
      : '';
    const speechText = `${latestAssistant.text.replace(/\n/g, ' ')}${suggestionText}`.trim();
    if (!speechText || speechText === lastSpokenMessageRef.current) return;
    lastSpokenMessageRef.current = speechText;
    speak(speechText);
  }, [voiceModeEnabled, settings.autoReadBotReplies, isSpeechSynthesisSupported, latestAssistant, speak]);

  const getPageContext = () => {
    const sourceNode = document.querySelector('main') || document.body;
    const raw = sourceNode?.innerText || '';
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const contentExcerpt = normalized.slice(0, 2200);

    return {
      url: window.location.href,
      title: document.title || '',
      contentExcerpt,
    };
  };

  const appendAssistantMessage = (text, actionIds = []) => {
    setMessages((prev) => [...prev, { role: 'assistant', text, actionIds: uniqActionIds(actionIds) }]);
  };

  const runQuickAction = (actionId, options = {}) => {
    const action = ACTION_MAP[actionId];
    if (!action) return;

    if (voiceModeEnabled && !options.skipConfirm && VOICE_CONFIRM_ACTIONS.has(actionId)) {
      setPendingConfirmation({ actionId, label: action.label });
      appendAssistantMessage(`${action.label}을 진행할까요? 예 또는 아니오로 말씀해 주세요.`, expandRelatedActionIds(action.related || [], 3));
      return;
    }

    if (actionId === 'reserve') {
      navigate('/reservation/view');
      appendAssistantMessage('예약 페이지로 이동했습니다. 원하시는 시설과 시간을 선택해주세요.', ['facilityHours', 'reservationStatus', 'facilityCancel']);
      return;
    }

    if (actionId === 'roomRecommend') {
      navigate('/rooms');
      appendAssistantMessage('방 추천을 확인할 수 있도록 방 목록 페이지로 이동했습니다.', ['availableRooms', 'deposit', 'monthlyRent']);
      return;
    }

    if (actionId === 'summary') {
      const page = getPageContext();
      const excerpt = (page.contentExcerpt || '').slice(0, 220);
      appendAssistantMessage(`현재 페이지 요약입니다.\n제목: ${page.title || '-'}\n요약: ${excerpt || '요약할 본문을 찾지 못했습니다.'}`, ['roomRecommend', 'reviews', 'facilityInfo']);
      return;
    }

    if (actionId === 'facilityHours') {
      navigate('/facility/view');
      appendAssistantMessage('이용시간 확인을 위해 시설 페이지로 이동했습니다. 시설을 선택하면 운영시간을 확인할 수 있습니다.', ['reserve', 'facilityInfo', 'facilityCancel']);
      return;
    }

    if (actionId === 'facilityCancel') {
      navigate('/reservation/view');
      appendAssistantMessage('예약 내역 페이지로 이동했습니다. 취소할 예약을 선택해 진행해주세요.', ['reservationStatus', 'reserve', 'facilityHours']);
      return;
    }

    if (actionId === 'reservationStatus') {
      navigate('/reservation/view');
      appendAssistantMessage('예약 내역 페이지로 이동했습니다. 현재 예약 상태를 확인해보세요.', ['facilityCancel', 'reserve', 'facilityHours']);
    }
  };

  const extractSuggestedActions = (result, replyText) => {
    const picked = [];
    const add = (id) => {
      if (ACTION_MAP[id] && !picked.includes(id)) picked.push(id);
    };
    const addMatches = (value) => {
      suggestActionsFromText(value).forEach(add);
    };

    const fromResponse = result?.suggestedActions;
    if (Array.isArray(fromResponse)) {
      fromResponse.forEach((item) => addMatches(item?.id || item?.label || item));
    }

    addMatches(result?.intent || '');
    addMatches(result?.action?.name || '');
    addMatches(replyText);

    if (picked.length === 0) {
      return ['summary', 'roomRecommend', 'reserve'];
    }

    return expandRelatedActionIds(picked, 3);
  };

  const resolveConfirmation = async (text) => {
    if (!pendingConfirmation) return false;

    if (isYes(text)) {
      const actionId = pendingConfirmation.actionId;
      setPendingConfirmation(null);
      appendAssistantMessage(`${ACTION_MAP[actionId]?.label || '요청'}을 계속 진행합니다.`, expandRelatedActionIds([actionId], 3));
      runQuickAction(actionId, { skipConfirm: true });
      return true;
    }

    if (isNo(text)) {
      const actionId = pendingConfirmation.actionId;
      setPendingConfirmation(null);
      appendAssistantMessage(`${ACTION_MAP[actionId]?.label || '요청'}을 취소했습니다. 다른 명령을 말씀해 주세요.`, ['summary', 'roomRecommend', 'reserve']);
      return true;
    }

    appendAssistantMessage('재확인이 필요합니다. 예 또는 아니오로 말씀해 주세요.', ['reserve', 'facilityCancel', 'summary']);
    return true;
  };

  const sendMessage = async (rawText, options = {}) => {
    const text = String(rawText || '').trim();
    if (!text || loading) return;

    const displayText = options.displayText || text;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: displayText }]);

    if (await resolveConfirmation(text)) {
      return;
    }

    const quickAction = options.skipQuickAction ? null : detectQuickAction(text);
    if (quickAction) {
      runQuickAction(quickAction);
      return;
    }

    setLoading(true);

    try {
      const result = await runOrchestrateCommand({
        text,
        sessionId,
        context: {
          path: window.location.pathname,
          pageSnapshot: getPageContext(),
          siteProfile: {
            serviceName: '우리집',
            channel: 'web',
            language: 'ko-KR',
            voiceMode: voiceModeEnabled,
          },
        },
      });

      const reply = result?.reply || result?.outputText || result?.message || result?.result || '응답은 받았지만 표시 가능한 메시지 필드가 없습니다.';
      const shouldShowIntent = result?.intent && String(result.intent).toLowerCase() !== 'fallback';
      const intent = shouldShowIntent ? `\n(intent: ${result.intent})` : '';
      const actionIds = extractSuggestedActions(result, String(reply));

      appendAssistantMessage(`${String(reply)}${intent}`, actionIds);

      if (voiceModeEnabled && result?.requiresConfirm && actionIds.length > 0) {
        setPendingConfirmation({ actionId: actionIds[0], label: ACTION_MAP[actionIds[0]]?.label });
        appendAssistantMessage(`${ACTION_MAP[actionIds[0]]?.label || '다음 작업'}을 이어서 진행할까요? 예 또는 아니오로 말씀해 주세요.`, actionIds);
      }
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage = errorBody?.data || errorBody?.message || errorBody?.error || error?.message || 'Agent 호출 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const onQuickActionClick = (actionId) => {
    const action = ACTION_MAP[actionId];
    if (!action || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: action.label }]);
    runQuickAction(actionId);
  };

  const playLatestVoice = async () => {
    const sourceText = (latestAssistantMessage || '').split('\n(intent:')[0].trim();
    if (!sourceText || ttsLoading) return;

    try {
      setTtsLoading(true);
      const audioBytes = await synthesizeTts({ text: sourceText });
      const blob = new Blob([audioBytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage = errorBody?.data || errorBody?.message || errorBody?.error || error?.message || 'TTS 호출 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`);
    } finally {
      setTtsLoading(false);
    }
  };

  const startVoiceCommand = () => {
    if (!voiceModeEnabled) {
      enableVoiceMode();
      return;
    }

    if (!settings.voiceCommandEnabled) {
      appendAssistantMessage('??? ???? ?? ?? ??? ?? ????. ??? ??? ???.');
      return;
    }

    if (!isSpeechRecognitionSupported) {
      appendAssistantMessage('이 브라우저에서는 음성 인식을 지원하지 않습니다. 텍스트 입력을 사용해 주세요.');
      return;
    }

    speak('말씀해 주세요.');
    startListening({
      onResult: (transcript) => {
        if (!transcript) {
          appendAssistantMessage('음성 입력을 인식하지 못했습니다. 다시 말씀해 주세요.', ['summary', 'roomRecommend', 'reserve']);
          return;
        }
        sendMessage(transcript, { displayText: `음성: ${transcript}` });
      },
      onError: () => {
        appendAssistantMessage('음성 입력 중 문제가 발생했습니다. 다시 시도해 주세요.', ['summary', 'roomRecommend', 'reserve']);
      },
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.launcher} onClick={() => setOpen((prev) => !prev)} aria-label="AI Agent 열기">
        <img src={botIcon} alt="AI 챗봇" className={styles.launcherIcon} />
      </button>

      {open && (
        <section className={styles.panel} aria-label="AI Agent Panel">
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <img src={botIcon} alt="AI 챗봇" className={styles.headerIcon} />
              <div className={styles.headerTitleWrap}>
                <strong>우리봇</strong>
                {voiceModeEnabled && <span className={styles.voiceModeBadge}>음성 모드</span>}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button type="button" className={styles.modeBtn} onClick={voiceModeEnabled ? disableVoiceMode : () => enableVoiceMode()}>
                {voiceModeEnabled ? '음성 끄기' : '음성 켜기'}
              </button>
              <button type="button" className={styles.voiceBtn} onClick={playLatestVoice} disabled={ttsLoading || !latestAssistantMessage}>
                {ttsLoading ? 'TTS...' : '다시 읽기'}
              </button>
              {voiceModeEnabled && (
                <button type="button" className={styles.micBtn} onClick={listening ? stopListening : startVoiceCommand}>
                  {listening ? '듣는 중' : '말하기'}
                </button>
              )}
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="닫기">
                ×
              </button>
            </div>
          </header>

          {voiceModeEnabled && (
            <div className={styles.voiceGuide}>
              {pendingConfirmation
                ? `${pendingConfirmation.label} 진행 전 재확인 대기 중입니다. 예 또는 아니오로 말씀해 주세요.`
                : '음성 모드에서는 말하기 버튼으로 명령을 입력하고, 우리봇이 답변과 추천 행동을 읽어드립니다.'}
            </div>
          )}

          <div className={styles.body}>
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
                <div>{msg.text}</div>
                {msg.role === 'assistant' && Array.isArray(msg.actionIds) && msg.actionIds.length > 0 && (
                  <div className={styles.bubbleActions}>
                    {msg.actionIds.map((id) => (
                      <button key={`bubble-action-${idx}-${id}`} type="button" className={styles.bubbleActionBtn} onClick={() => onQuickActionClick(id)} disabled={loading}>
                        {ACTION_MAP[id].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className={styles.form} onSubmit={submit}>
            <input className={styles.input} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={voiceModeEnabled ? '말하거나 입력해주세요' : '내용을 입력해주세요'} />
            {voiceModeEnabled && (
              <button type="button" className={styles.micBtn} onClick={listening ? stopListening : startVoiceCommand}>
                {listening ? '중지' : '음성'}
              </button>
            )}
            <button type="submit" className={styles.sendBtn} disabled={disabled}>
              {loading ? '대기중' : '전송'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
