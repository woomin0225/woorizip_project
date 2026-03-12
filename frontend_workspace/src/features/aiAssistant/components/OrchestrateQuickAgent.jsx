import React, { useMemo, useState } from 'react';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import { synthesizeTts } from '../api/ttsApi';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function OrchestrateQuickAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'AI Agent 테스트용입니다. 명령을 입력해보세요.',
    },
  ]);
  const [sessionId] = useState(newSessionId);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === 'assistant')?.text || '',
    [messages]
  );

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
      setMessages((prev) => [...prev, { role: 'assistant', text: `오류: ${apiMessage}` }]);
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
    setLoading(true);

    try {
      const result = await runOrchestrateCommand({
        text,
        sessionId,
        context: {
          path: window.location.pathname,
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

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `${String(reply)}${intent}` },
      ]);
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage =
        errorBody?.data ||
        errorBody?.message ||
        errorBody?.error ||
        error?.message ||
        'Agent 호출 중 오류가 발생했습니다.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `오류: ${apiMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="AI Agent Panel">
          <header className={styles.header}>
            <strong>AI Agent</strong>
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
                x
              </button>
            </div>
          </header>

          <div className={styles.body}>
            {messages.map((msg, idx) => (
              <p
                key={`${msg.role}-${idx}`}
                className={msg.role === 'user' ? styles.userMsg : styles.botMsg}
              >
                {msg.text}
              </p>
            ))}
          </div>

          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="도와드릴 내용을 입력해주세요"
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={disabled}
            >
              {loading ? '전송중...' : '전송'}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="AI Agent 열기"
      >
        AI
      </button>
    </div>
  );
}
