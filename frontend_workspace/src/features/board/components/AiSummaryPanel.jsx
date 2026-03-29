import React, { useEffect, useMemo, useRef, useState } from 'react';
import botIcon from '../../../assets/images/ai_bot.png';

const BOT_HELLO = '안녕하세요, 무엇을 도와드릴까요?';
const BOT_HELP =
  '현재는 게시글/첨부파일 요약 요청만 처리할 수 있습니다. 예: "이 글과 첨부된 파일을 요약해줘"';
const BOT_WORKING = '작업 중입니다...';

const LARGE_VIEW_KEY = 'ui-large-view';

function launcherStyle(opened, isLargeView) {
  return {
    position: 'fixed',
    right: isLargeView ? 32 : 24,
    bottom: isLargeView ? 32 : 24,
    width: isLargeView ? 96 : 64,
    height: isLargeView ? 96 : 64,
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    display: opened ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    boxShadow: 'none',
  };
}

function overlayStyle(opened) {
  return {
    position: 'fixed',
    inset: 0,
    background: 'rgba(17, 24, 39, 0.18)',
    opacity: opened ? 1 : 0,
    pointerEvents: opened ? 'auto' : 'none',
    transition: 'opacity 0.25s ease',
    zIndex: 999,
  };
}

function bubbleStyle(role, isLargeView) {
  return {
    maxWidth: isLargeView ? '86%' : '82%',
    padding: isLargeView ? '16px 18px' : '10px 12px',
    borderRadius: isLargeView ? 18 : 14,
    lineHeight: isLargeView ? 1.7 : 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: isLargeView ? 24 : 13,
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? '#d17a42' : '#f5f6f8',
    color: role === 'user' ? '#ffffff' : '#222222',
    boxShadow:
      role === 'user'
        ? '0 4px 10px rgba(209, 122, 66, 0.18)'
        : '0 4px 10px rgba(15, 23, 42, 0.06)',
  };
}

function panelStyle(opened, isLargeView) {
  return {
    position: 'fixed',
    right: isLargeView ? 32 : 24,
    bottom: isLargeView ? 32 : 24,
    width: isLargeView
      ? 'min(520px, calc(100vw - 32px))'
      : 'min(360px, calc(100vw - 32px))',
    height: isLargeView
      ? 'min(760px, calc(100vh - 80px))'
      : 'min(560px, calc(100vh - 120px))',
    background: '#ffffff',
    borderRadius: isLargeView ? 30 : 26,
    border: '1px solid rgba(229, 231, 235, 0.9)',
    boxShadow:
      '0 22px 50px rgba(15, 23, 42, 0.16), 0 8px 20px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    transform: opened
      ? 'translateY(0) scale(1)'
      : 'translateY(14px) scale(0.96)',
    opacity: opened ? 1 : 0,
    pointerEvents: opened ? 'auto' : 'none',
    transition: 'transform 0.22s ease, opacity 0.22s ease',
    zIndex: 1001,
    overflow: 'hidden',
  };
}

function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function buildSummaryMessages(summaryData) {
  if (!summaryData) return [];

  const summary = String(summaryData.summary ?? '').trim();
  const keyPoints = normalizeItems(summaryData.keyPoints);
  const schedules = normalizeItems(summaryData.schedules);
  const warnings = normalizeItems(summaryData.warnings);
  const conclusion = String(summaryData.conclusion ?? '').trim();

  const now = Date.now();
  const result = [
    {
      id: `summary-intro-${now}`,
      role: 'assistant',
      text: '요약이 완료되었습니다. 아래 내용을 확인해주세요.',
    },
  ];

  if (summary) {
    result.push({
      id: `summary-main-${now}`,
      role: 'assistant',
      text: `핵심 요약\n${summary}`,
    });
  }

  if (keyPoints.length > 0) {
    result.push({
      id: `summary-points-${now}`,
      role: 'assistant',
      text: `핵심 내용\n${keyPoints.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`,
    });
  }

  if (schedules.length > 0) {
    result.push({
      id: `summary-schedules-${now}`,
      role: 'assistant',
      text: `일정\n${schedules.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`,
    });
  }

  if (conclusion) {
    result.push({
      id: `summary-conclusion-${now}`,
      role: 'assistant',
      text: `결론\n${conclusion}`,
    });
  }

  if (warnings.length > 0) {
    result.push({
      id: `summary-warnings-${now}`,
      role: 'assistant',
      text: `주의사항\n${warnings.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`,
    });
  }

  if (result.length === 1) {
    result.push({
      id: `summary-empty-${now}`,
      role: 'assistant',
      text: '요약 결과가 없습니다.',
    });
  }

  return result;
}

export default function AiSummaryPanel({
  opened,
  hasLoaded,
  summaryLoading,
  summaryError,
  summaryData,
  onLoad,
  onToggle,
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 'hello', role: 'assistant', text: BOT_HELLO },
  ]);
  const [isLargeView, setIsLargeView] = useState(() => {
    if (typeof document === 'undefined') return false;
    return (
      document.body.classList.contains('large-view') ||
      localStorage.getItem(LARGE_VIEW_KEY) === '1'
    );
  });

  const scrollRef = useRef(null);
  const lastSummarySignatureRef = useRef('');
  const lastErrorRef = useRef('');

  const summarySignature = useMemo(() => {
    if (!summaryData) return '';
    return JSON.stringify({
      summary: summaryData.summary ?? '',
      keyPoints: summaryData.keyPoints ?? [],
      schedules: summaryData.schedules ?? [],
      conclusion: summaryData.conclusion ?? '',
      warnings: summaryData.warnings ?? [],
    });
  }, [summaryData]);

  useEffect(() => {
    const syncLargeView = () => {
      setIsLargeView(
        document.body.classList.contains('large-view') ||
          localStorage.getItem(LARGE_VIEW_KEY) === '1'
      );
    };

    syncLargeView();

    window.addEventListener('storage', syncLargeView);

    const observer = new MutationObserver(syncLargeView);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('storage', syncLargeView);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!summarySignature || !opened || !hasLoaded) return;
    if (lastSummarySignatureRef.current === summarySignature) return;

    lastSummarySignatureRef.current = summarySignature;

    setMessages((prev) => {
      const withoutWorking = prev.filter((msg) => msg.id !== 'working');
      return [...withoutWorking, ...buildSummaryMessages(summaryData)];
    });
  }, [summaryData, summarySignature, opened, hasLoaded]);

  useEffect(() => {
    if (!summaryError || !opened) return;
    if (lastErrorRef.current === summaryError) return;

    lastErrorRef.current = summaryError;

    setMessages((prev) => {
      const withoutWorking = prev.filter((msg) => msg.id !== 'working');
      return [
        ...withoutWorking,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: summaryError,
        },
      ];
    });
  }, [summaryError, opened]);

  useEffect(() => {
    if (!opened) return;
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, summaryLoading, opened]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && opened && onToggle) {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opened, onToggle]);

  const isSummaryRequest = (text) => {
    const normalized = String(text ?? '').replace(/\s+/g, '');
    return (
      normalized.includes('요약') ||
      normalized.includes('정리해줘') ||
      normalized.includes('첨부된파일') ||
      normalized.includes('첨부파일') ||
      normalized.includes('이글')
    );
  };

  const closePanel = () => {
    if (opened && onToggle) onToggle();
  };

  const openPanel = () => {
    if (!opened && onToggle) onToggle();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || summaryLoading) return;

    if (!opened) {
      openPanel();
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
      },
    ]);
    setInput('');

    if (!isSummaryRequest(text)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-help-${Date.now()}`,
          role: 'assistant',
          text: BOT_HELP,
        },
      ]);
      return;
    }

    setMessages((prev) => {
      const next = prev.filter((msg) => msg.id !== 'working');
      return [
        ...next,
        {
          id: 'working',
          role: 'assistant',
          text: BOT_WORKING,
        },
      ];
    });

    try {
      await onLoad?.();
    } catch (error) {
      setMessages((prev) => {
        const withoutWorking = prev.filter((msg) => msg.id !== 'working');
        return [
          ...withoutWorking,
          {
            id: `load-failed-${Date.now()}`,
            role: 'assistant',
            text: 'AI 요약을 불러오지 못했습니다.',
          },
        ];
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label="AI 채팅 열기"
        style={launcherStyle(opened, isLargeView)}
      >
        <img
          src={botIcon}
          alt="AI 챗봇"
          style={{
            width: isLargeView ? 96 : 64,
            height: isLargeView ? 96 : 64,
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      </button>

      <div style={overlayStyle(opened)} onClick={closePanel} />

      <aside style={panelStyle(opened, isLargeView)}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isLargeView ? '24px 24px 20px' : '18px 18px 14px',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              width: isLargeView ? 64 : 48,
              height: isLargeView ? 64 : 48,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 8px 18px rgba(37, 99, 235, 0.22)',
              flexShrink: 0,
            }}
          >
            <img
              src={botIcon}
              alt="AI 챗봇"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          <button
            type="button"
            onClick={closePanel}
            aria-label="AI 채팅 닫기"
            style={{
              width: isLargeView ? 44 : 36,
              height: isLargeView ? 44 : 36,
              border: 'none',
              borderRadius: 10,
              background: '#f3f4f6',
              color: '#374151',
              fontSize: isLargeView ? 24 : 18,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isLargeView ? 24 : 18,
            display: 'flex',
            flexDirection: 'column',
            gap: isLargeView ? 18 : 12,
            background: '#f8fafc',
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={bubbleStyle(message.role, isLargeView)}
            >
              {message.text}
            </div>
          ))}

          {summaryLoading && !messages.some((msg) => msg.id === 'working') && (
            <div style={bubbleStyle('assistant', isLargeView)}>
              {BOT_WORKING}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: isLargeView ? 14 : 10,
            padding: isLargeView ? 22 : 16,
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 이 글과 첨부된 파일을 요약해줘"
            disabled={summaryLoading}
            style={{
              flex: 1,
              height: isLargeView ? 64 : 44,
              borderRadius: isLargeView ? 16 : 12,
              border: '1px solid #d1d5db',
              padding: isLargeView ? '0 18px' : '0 14px',
              outline: 'none',
              fontSize: isLargeView ? 24 : 14,
            }}
          />

          <button
            type="submit"
            disabled={summaryLoading || !input.trim()}
            style={{
              minWidth: isLargeView ? 120 : 80,
              height: isLargeView ? 64 : 44,
              border: 'none',
              borderRadius: isLargeView ? 16 : 12,
              background: summaryLoading ? '#cbd5e1' : '#c9713f',
              color: '#ffffff',
              fontWeight: 700,
              cursor: summaryLoading ? 'default' : 'pointer',
            }}
          >
            전송
          </button>
        </form>
      </aside>
    </>
  );
}
