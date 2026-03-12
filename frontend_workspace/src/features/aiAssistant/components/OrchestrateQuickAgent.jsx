import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import { synthesizeTts } from '../api/ttsApi';
import botIcon from '../../../assets/images/ai_bot.png';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseJwt } from '../../../app/providers/utils/jwt';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ACTIONS = [
  { id: 'reserve', label: '공용시설 예약' },
  { id: 'summary', label: '요약' },
  { id: 'popularRooms', label: '인기 있는 방 보기' },
  { id: 'facilityHours', label: '공용시설 이용시간' },
  { id: 'facilityCancel', label: '공용시설 취소' },
];

const STARTER_ACTION_IDS = ['reserve', 'summary', 'popularRooms'];

const ACTION_MAP = ACTIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

const uniqActionIds = (ids) => {
  const seen = new Set();
  return ids.filter((id) => ACTION_MAP[id] && !seen.has(id) && seen.add(id));
};

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');

const suggestActionsFromText = (value) => {
  const text = normalizeText(value);
  const picked = [];
  const add = (id) => {
    if (ACTION_MAP[id] && !picked.includes(id)) picked.push(id);
  };

  const hasFacilityWord =
    text.includes('공용시설') || text.includes('시설') || text.includes('헬스장');
  const hasTimeWord = text.includes('이용시간') || text.includes('운영시간') || text.includes('몇시');
  const hasReserveWord = text.includes('예약');
  const hasCancelWord = text.includes('취소');

  if (hasFacilityWord && hasTimeWord) {
    add('facilityHours');
    add('reserve');
    add('facilityCancel');
  }
  if (hasReserveWord) {
    add('reserve');
    add('facilityHours');
    add('facilityCancel');
  }
  if (hasCancelWord) {
    add('facilityCancel');
    add('reserve');
    add('facilityHours');
  }
  if (text.includes('요약')) add('summary');
  if (text.includes('인기있는방보기') || text.includes('인기방') || text.includes('인기매물')) {
    add('popularRooms');
  }

  return picked;
};

const detectQuickAction = (value) => {
  const text = normalizeText(value);
  if (!text) return null;

  if (text.includes('공용시설이용시간') || text.includes('헬스장몇시') || text.includes('이용시간') || text.includes('운영시간')) {
    return 'facilityHours';
  }
  if (text.includes('공용시설취소') || text.includes('예약취소')) {
    return 'facilityCancel';
  }
  if (text.includes('공용시설예약') || text.includes('시설예약') || text === '예약') {
    return 'reserve';
  }
  if (text.includes('요약')) return 'summary';
  if (text.includes('인기있는방보기') || text.includes('인기방')) {
    return 'popularRooms';
  }
  return null;
};

export default function OrchestrateQuickAgent() {
  const navigate = useNavigate();
  const { accessToken, userId } = useAuth();
  const userDisplayName = useMemo(() => {
    const payload = parseJwt(accessToken);
    const rawName =
      payload?.name ||
      payload?.userName ||
      payload?.nickname ||
      payload?.preferred_username;
    if (rawName) return String(rawName).trim();
    if (userId) return String(userId).split('@')[0].trim();
    return '고객';
  }, [accessToken, userId]);

  const greetingText = useMemo(
    () =>
      `안녕하세요! 저는 ${userDisplayName} 님만을 위한 비서 우리봇이에요! 도움이 필요하거나 궁금한 것이 있다면 아래 대화창에 입력해주세요!`,
    [userDisplayName]
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: greetingText,
      actionIds: STARTER_ACTION_IDS,
    },
  ]);
  const [sessionId] = useState(newSessionId);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === 'assistant')?.text || '',
    [messages]
  );

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

  const runQuickAction = (actionId) => {
    if (actionId === 'reserve') {
      navigate('/reservation/view');
      appendAssistantMessage(
        '공용시설 예약 페이지로 이동했습니다. 원하시는 시설과 시간을 선택해주세요.',
        ['facilityHours', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'popularRooms') {
      navigate('/rooms');
      appendAssistantMessage('인기 있는 방을 보실 수 있도록 방 목록 페이지로 이동했습니다.');
      return;
    }

    if (actionId === 'summary') {
      const page = getPageContext();
      const excerpt = (page.contentExcerpt || '').slice(0, 220);
      appendAssistantMessage(
        `현재 페이지 요약입니다.\n제목: ${page.title || '-'}\n요약: ${excerpt || '요약할 본문을 찾지 못했습니다.'}`,
        ['popularRooms']
      );
      return;
    }

    if (actionId === 'facilityHours') {
      navigate('/facility/view');
      appendAssistantMessage(
        '공용시설 이용시간 확인을 위해 시설 페이지로 이동했습니다. 시설을 선택하면 운영시간을 확인할 수 있습니다.',
        ['reserve', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'facilityCancel') {
      navigate('/reservation/view');
      appendAssistantMessage(
        '예약 내역 페이지로 이동했습니다. 취소할 예약을 선택해 진행해주세요.',
        ['facilityHours', 'reserve']
      );
    }
  };

  const onQuickActionClick = (actionId, label) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: label }]);
    runQuickAction(actionId);
  };

  const extractSuggestedActions = (result, replyText) => {
    const picked = [];
    const add = (id) => {
      if (ACTION_MAP[id] && !picked.includes(id)) picked.push(id);
    };

    const fromResponse = result?.suggestedActions;
    if (Array.isArray(fromResponse)) {
      fromResponse.forEach((item) => {
        const id = detectQuickAction(item?.id || item?.label || item);
        if (id) add(id);
      });
    }

    const fromIntent = detectQuickAction(result?.intent || '');
    if (fromIntent) add(fromIntent);

    const fromActionName = detectQuickAction(result?.action?.name || '');
    if (fromActionName) add(fromActionName);

    suggestActionsFromText(replyText).forEach(add);
    return picked;
  };

  const playLatestVoice = async () => {
    const sourceText = (latestAssistantMessage || '').split('\n(intent:')[0].trim();
    if (!sourceText || ttsLoading) return;

    try {
      setTtsLoading(true);
      const audioBytes = await synthesizeTts({ text: sourceText });
      const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage =
        errorBody?.data ||
        errorBody?.message ||
        errorBody?.error ||
        error?.message ||
        'TTS 호출 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`);
    } finally {
      setTtsLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);

    const quickAction = detectQuickAction(text);
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
          },
        },
      });

      const reply =
        result?.reply ||
        result?.outputText ||
        result?.message ||
        result?.result ||
        '응답은 받았지만 표시 가능한 메시지 필드가 없습니다.';
      const shouldShowIntent =
        result?.intent && String(result.intent).toLowerCase() !== 'fallback';
      const intent = shouldShowIntent ? `\n(intent: ${result.intent})` : '';
      const actionIds = extractSuggestedActions(result, String(reply));

      appendAssistantMessage(`${String(reply)}${intent}`, actionIds);
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage =
        errorBody?.data ||
        errorBody?.message ||
        errorBody?.error ||
        error?.message ||
        'Agent 호출 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="AI Agent 열기"
      >
        <img src={botIcon} alt="AI 챗봇" className={styles.launcherIcon} />
      </button>

      {open && (
        <section className={styles.panel} aria-label="AI Agent Panel">
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <img src={botIcon} alt="AI 챗봇" className={styles.headerIcon} />
              <strong>우리봇</strong>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.voiceBtn}
                onClick={playLatestVoice}
                disabled={ttsLoading || !latestAssistantMessage}
              >
                {ttsLoading ? 'TTS...' : '음성 재생'}
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
          </header>

          <div className={styles.body}>
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={msg.role === 'user' ? styles.userMsg : styles.botMsg}
              >
                <div>{msg.text}</div>
                {msg.role === 'assistant' && Array.isArray(msg.actionIds) && msg.actionIds.length > 0 && (
                  <div className={styles.bubbleActions}>
                    {msg.actionIds.map((id) => (
                      <button
                        key={`bubble-action-${idx}-${id}`}
                        type="button"
                        className={styles.bubbleActionBtn}
                        onClick={() => onQuickActionClick(id, ACTION_MAP[id].label)}
                        disabled={loading}
                      >
                        {ACTION_MAP[id].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="내용을 입력해주세요"
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={disabled}
            >
              {loading ? '대기중' : '전송'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
