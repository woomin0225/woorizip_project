import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runOrchestrateCommand } from '../api/orchestrateApi';
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

const formatAssistantReply = (value) => {
  const source = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (!source) return '';

  let formatted = source.replace(/\s*(\d+\.)\s*/g, '\n$1 ');
  formatted = formatted.replace(/\n{2,}/g, '\n').trim();

  if (!formatted.includes('\n')) {
    formatted = formatted.replace(/([.!?]|\uB2C8\uB2E4\.|\uC138\uC694\.|\uD574\uC8FC\uC138\uC694\.|\uB429\uB2C8\uB2E4\.)\s+(?=[^\n])/g, '$1\n');
    formatted = formatted.replace(/\n{2,}/g, '\n').trim();
  }

  return formatted;
};

const SETTINGS_GUIDE = '접근성 설정에서는 음성 모드, 페이지 진입 시 자동 요약 읽기, 현재 포커스 요소 읽기, 우리봇 답변 자동 읽기, 음성 명령 사용, 글자 크기, 페이지 배율, 버튼 크기를 조정할 수 있습니다.';

export default function OrchestrateQuickAgent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, userId } = useAuth();
  const {
    voiceModeEnabled,
    listening,
    speaking,
    settings,
    isSpeechRecognitionSupported,
    enableVoiceMode,
    disableVoiceMode,
    speak,
    startListening,
    stopListening,
    updateSetting,
  } = useVoiceMode();

  const bottomRef = useRef(null);
  const lastSpokenMessageRef = useRef('');
  const voiceGuideShownRef = useRef(false);
  const voiceLoopStateRef = useRef({ voiceModeEnabled, settings, loading: false, speaking: false });
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
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: greetingText, actionIds: STARTER_ACTION_IDS },
  ]);
  const [sessionId] = useState(newSessionId);

  useEffect(() => {
    voiceLoopStateRef.current = {
      voiceModeEnabled,
      settings,
      loading,
      speaking,
    };
  }, [voiceModeEnabled, settings, loading, speaking]);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistant = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === 'assistant') || null,
    [messages]
  );
  const latestAssistantMessage = latestAssistant?.text || '';
  const voiceStatusText = listening
    ? '듣는 중입니다. 약 2초 정도 멈추면 자동으로 처리합니다.'
    : speaking
      ? '답변을 읽는 중입니다.'
      : loading
        ? '요청을 처리하고 있습니다.'
        : '대기 중입니다. 음성 모드에서는 자동으로 다시 듣기를 시작합니다.';

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  useEffect(() => {
    if (voiceModeEnabled) {
      setOpen(true);
      if (!voiceGuideShownRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: '?? ??? ?????. ?? ????? ???? ???? ?? ?????. ???? ?? ????? ? ? ? ??? ?? ?? ????.',
            actionIds: ['summary', 'roomRecommend', 'reserve'],
          },
        ]);
        voiceGuideShownRef.current = true;
      }
      return;
    }

    voiceGuideShownRef.current = false;
  }, [voiceModeEnabled]);

  useEffect(() => {
    if (!voiceModeEnabled || !settings.autoReadBotReplies || !latestAssistant) return;
    const suggestionText = Array.isArray(latestAssistant.actionIds) && latestAssistant.actionIds.length > 0
      ? ` 추천 명령은 ${latestAssistant.actionIds.map((id) => ACTION_MAP[id]?.label).filter(Boolean).join(', ')} 입니다.`
      : '';
    const speechText = `${latestAssistant.text.replace(/\n/g, ' ')}${suggestionText}`.trim();
    if (!speechText || speechText === lastSpokenMessageRef.current) return;
    lastSpokenMessageRef.current = speechText;
    speak(speechText);
  }, [voiceModeEnabled, settings.autoReadBotReplies, latestAssistant, speak]);

  const getRoomContext = () => {
    const pathname = location.pathname || '';
    const isRoomDetailPage = /^\/rooms\/[^/]+$/.test(pathname);
    if (!isRoomDetailPage) return {};

    const tourLink = document.querySelector('a[href^="/rooms/"][href$="/tour"]');
    const href = tourLink?.getAttribute('href') || '';
    const hrefMatch = href.match(/^\/rooms\/([^/]+)\/tour$/);
    const pathMatch = pathname.match(/^\/rooms\/([^/]+)$/);
    const roomNo = hrefMatch?.[1] || pathMatch?.[1] || '';

    const titleCandidates = Array.from(document.querySelectorAll('main h3, main h2'))
      .map((node) => String(node.textContent || '').replace(/^[^\p{L}\p{N}]+/gu, '').trim())
      .filter(Boolean);
    const roomName =
      titleCandidates.find(
        (text) =>
          !text.includes('위치') &&
          !text.includes('공용시설') &&
          !text.includes('방 옵션')
      ) || '';

    if (!roomNo) return {};

    return {
      roomNo,
      roomName,
    };
  };

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

  const openAccessibilitySettings = () => {
    window.dispatchEvent(new Event('woorizip:open-accessibility-settings'));
  };

  const goToPage = (path, message, actionIds = []) => {
    navigate(path);
    appendAssistantMessage(message, actionIds);
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
      goToPage('/reservation/view', '예약 페이지로 이동했습니다. 원하시는 시설과 시간을 선택해주세요.', ['facilityHours', 'reservationStatus', 'facilityCancel']);
      return;
    }

    if (actionId === 'roomRecommend') {
      goToPage('/rooms', '방 추천을 확인할 수 있도록 방 목록 페이지로 이동했습니다.', ['availableRooms', 'deposit', 'monthlyRent']);
      return;
    }

    if (actionId === 'summary') {
      const page = getPageContext();
      const excerpt = (page.contentExcerpt || '').slice(0, 220);
      appendAssistantMessage(`현재 페이지 요약입니다.\n제목: ${page.title || '-'}\n요약: ${excerpt || '요약할 본문을 찾지 못했습니다.'}`, ['roomRecommend', 'reviews', 'facilityInfo']);
      return;
    }

    if (actionId === 'facilityHours') {
      goToPage('/facility/view', '이용시간 확인을 위해 시설 페이지로 이동했습니다. 시설을 선택하면 운영시간을 확인할 수 있습니다.', ['reserve', 'facilityInfo', 'facilityCancel']);
      return;
    }

    if (actionId === 'facilityCancel') {
      goToPage('/reservation/view', '예약 내역 페이지로 이동했습니다. 취소할 예약을 선택해 진행해주세요.', ['reservationStatus', 'reserve', 'facilityHours']);
      return;
    }

    if (actionId === 'reservationStatus') {
      goToPage('/reservation/view', '예약 내역 페이지로 이동했습니다. 현재 예약 상태를 확인해보세요.', ['facilityCancel', 'reserve', 'facilityHours']);
    }
  };

  const handleLocalSystemCommand = (text) => {
    const normalized = normalizeText(text);
    if (!normalized) return false;

    if (normalized.includes('접근성설정') || normalized.includes('설정바꾸고싶') || normalized.includes('설정열어') || normalized.includes('설정설명')) {
      openAccessibilitySettings();
      appendAssistantMessage(`접근성 설정을 열었습니다.\n${SETTINGS_GUIDE}`);
      return true;
    }

    if ((normalized.includes('페이지요약') || normalized.includes('자동요약')) && (normalized.includes('켜') || normalized.includes('on') || normalized.includes('활성화'))) {
      updateSetting('autoReadPageSummary', true);
      appendAssistantMessage('페이지 진입 시 자동 요약 읽기를 켰습니다. 이제 페이지를 이동할 때마다 핵심 내용을 먼저 읽어드립니다.');
      return true;
    }

    if ((normalized.includes('페이지요약') || normalized.includes('자동요약')) && (normalized.includes('꺼') || normalized.includes('off') || normalized.includes('비활성화'))) {
      updateSetting('autoReadPageSummary', false);
      appendAssistantMessage('페이지 진입 시 자동 요약 읽기를 껐습니다. 필요할 때만 요약을 요청해 주세요.');
      return true;
    }

    if (normalized.includes('공지사항') || normalized === '공지' || normalized.includes('공지페이지')) {
      goToPage('/notices', '공지사항 페이지로 이동했습니다. 최신 공지와 운영 안내를 확인할 수 있습니다.', ['summary']);
      return true;
    }

    if (normalized.includes('방찾기') || normalized.includes('방보여줘') || normalized.includes('방목록')) {
      goToPage('/rooms', '방 목록 페이지로 이동했습니다. 원하는 방을 고른 뒤 투어나 상세 정보를 확인하실 수 있습니다.', ['roomRecommend', 'summary']);
      return true;
    }

    if (normalized.includes('공용시설') || normalized.includes('시설페이지') || normalized === '시설안내') {
      goToPage('/facility/view', '공용시설 페이지로 이동했습니다. 시설 안내와 예약 정보를 확인하실 수 있습니다.', ['facilityHours', 'reserve']);
      return true;
    }

    if (normalized.includes('예약내역') || normalized.includes('예약페이지') || normalized.includes('예약확인')) {
      goToPage('/reservation/view', '예약 페이지로 이동했습니다. 현재 예약 상태를 확인하거나 예약을 진행할 수 있습니다.', ['reserve', 'facilityCancel']);
      return true;
    }

    if (normalized === '홈' || normalized.includes('홈으로가')) {
      goToPage('/', '홈으로 이동했습니다. 주요 메뉴와 서비스 안내를 확인할 수 있습니다.', ['summary']);
      return true;
    }

    if (normalized.includes('현재페이지요약') || normalized === '요약해줘' || normalized === '요약') {
      runQuickAction('summary', { skipConfirm: true });
      return true;
    }

    return false;
  };

  const extractSuggestedActions = (result) => {
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

    if (handleLocalSystemCommand(text)) {
      return;
    }

    const quickAction = options.skipQuickAction ? null : detectQuickAction(text);
    if (quickAction) {
      runQuickAction(quickAction);
      return;
    }

    setLoading(true);

    try {
      const roomContext = getRoomContext();
      const result = await runOrchestrateCommand({
        text,
        sessionId,
        context: {
          path: window.location.pathname,
          ...roomContext,
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
      const shouldShowIntent = result?.intent && String(result.intent).toLowerCase() !== 'fallback' && !voiceModeEnabled;
      const intent = shouldShowIntent ? `\n(intent: ${result.intent})` : '';
      const actionIds = extractSuggestedActions(result);
      const formattedReply = formatAssistantReply(String(reply));

      appendAssistantMessage(`${formattedReply}${intent}`, actionIds);

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
    if (!sourceText) return;
    await speak(sourceText);
  };

  const startVoiceCommand = (options = {}) => {
    const { quiet = false, retryOnEmpty = false } = options;

    if (!voiceModeEnabled) {
      enableVoiceMode();
      return;
    }

    if (!settings.voiceCommandEnabled) {
      appendAssistantMessage('음성 명령이 꺼져 있습니다. 접근성 설정에서 음성 명령 사용을 켜 주세요.');
      return;
    }

    if (!isSpeechRecognitionSupported) {
      appendAssistantMessage('이 브라우저에서는 음성 인식을 지원하지 않습니다. 텍스트 입력을 사용해 주세요.');
      return;
    }

    if (!quiet) {
      speak('말씀해 주세요. 약 2초 정도 멈추면 자동으로 처리합니다.');
    }

    let hasResult = false;

    startListening({
      onResult: (transcript) => {
        hasResult = true;
        if (!transcript) {
          if (!retryOnEmpty) {
            appendAssistantMessage('음성 입력을 인식하지 못했습니다. 다시 말씀해 주세요.', ['summary', 'roomRecommend', 'reserve']);
          }
          return;
        }
        sendMessage(transcript, { displayText: `음성: ${transcript}` });
      },
      onError: (event) => {
        const errorType = event?.error || event?.message || '';
        if (errorType === 'no-speech' || errorType === 'aborted') {
          return;
        }
        appendAssistantMessage('음성 입력 중 문제가 발생했습니다. 다시 시도해 주세요.', ['summary', 'roomRecommend', 'reserve']);
      },
      onEnd: () => {
        const current = voiceLoopStateRef.current;
        if (!retryOnEmpty || hasResult || !current.voiceModeEnabled || !current.settings.voiceCommandEnabled || current.loading || current.speaking) {
          return;
        }
        window.setTimeout(() => {
          const latest = voiceLoopStateRef.current;
          if (latest.voiceModeEnabled && latest.settings.voiceCommandEnabled && !latest.loading && !latest.speaking) {
            startVoiceCommand({ quiet: true, retryOnEmpty: true });
          }
        }, 700);
      },
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!voiceModeEnabled || !settings.voiceCommandEnabled || listening || loading || speaking) return undefined;
    const timer = window.setTimeout(() => {
      startVoiceCommand({ quiet: true, retryOnEmpty: true });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [voiceModeEnabled, settings.voiceCommandEnabled, listening, loading, speaking]);

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
              <button type="button" className={styles.settingBtn} onClick={openAccessibilitySettings}>
                설정
              </button>
              <button type="button" className={styles.voiceBtn} onClick={playLatestVoice} disabled={!latestAssistantMessage}>
                다시 읽기
              </button>
              {voiceModeEnabled && (
                <button type="button" className={styles.micBtn} onClick={listening ? stopListening : () => startVoiceCommand({ quiet: false, retryOnEmpty: true })}>
                  {listening ? '듣는 중' : '말하기'}
                </button>
              )}
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="닫기">
                ×
              </button>
            </div>
          </header>

          {voiceModeEnabled ? (
            <div className={styles.voiceConsole}>
              <div className={styles.voiceStatusCard}>
                <h3 className={styles.voiceStatusTitle}>음성 전용 안내</h3>
                <p className={styles.voiceStatusText}>{voiceStatusText}</p>
                <ul className={styles.voiceHintList}>
                  <li>말씀하신 뒤 잠시 멈추면 우리봇이 자동으로 처리합니다.</li>
                  <li>페이지 이동, 예약, 접근성 설정 설명, 자동 요약 켜기 같은 명령을 바로 말할 수 있습니다.</li>
                  <li>페이지 자동 요약이 켜져 있으면 이동할 때마다 핵심 내용을 먼저 읽어드립니다.</li>
                </ul>
              </div>

              <div className={styles.voiceActionGrid}>
                <div className={styles.voiceActionCard}>
                  <strong>예시 명령</strong>
                  <span>공지사항으로 이동해줘</span>
                  <span>현재 페이지 요약해줘</span>
                </div>
                <div className={styles.voiceActionCard}>
                  <strong>접근성 제어</strong>
                  <span>접근성 설정 열어줘</span>
                  <span>페이지 요약 자동 읽기 켜줘</span>
                </div>
                <div className={styles.voiceActionCard}>
                  <strong>시설/예약</strong>
                  <span>예약 페이지로 이동해줘</span>
                  <span>공용시설 안내해줘</span>
                </div>
                <div className={styles.voiceActionCard}>
                  <strong>방 찾기</strong>
                  <span>방 목록 보여줘</span>
                  <span>이 방 투어 신청 도와줘</span>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                <input className={styles.input} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="내용을 입력해주세요" />
                <button type="submit" className={styles.sendBtn} disabled={disabled}>
                  {loading ? '대기중' : '전송'}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
