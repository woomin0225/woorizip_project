import React, { useMemo, useState } from 'react';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function OrchestrateQuickAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'watsonx Orchestrate 테스트용입니다. 명령을 입력해보세요.',
    },
  ]);
  const [sessionId] = useState(newSessionId);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);

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
      const intent = result?.intent ? `\n(intent: ${result.intent})` : '';

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
        'Orchestrate 호출 중 오류가 발생했습니다.';

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
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              x
            </button>
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
