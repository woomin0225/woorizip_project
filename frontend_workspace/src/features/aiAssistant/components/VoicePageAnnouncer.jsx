import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { summarizePageForVoice } from '../api/pageSummaryApi';
import { useVoiceMode } from '../context/VoiceModeContext';

const MIN_SUMMARY_SOURCE_LENGTH = 80;
const MAX_SUMMARY_SOURCE_LENGTH = 5000;

function buildPageSource() {
  const sourceNode = document.querySelector('main') || document.body;
  const raw = String(sourceNode?.innerText || '')
    .replace(/\s+/g, ' ')
    .trim();

  return raw.slice(0, MAX_SUMMARY_SOURCE_LENGTH);
}

function buildSpeechText(title, summary) {
  const safeTitle = String(title || '현재 페이지').trim();
  const safeSummary = String(summary || '').replace(/\s+/g, ' ').trim();
  if (!safeSummary) {
    return `${safeTitle} 페이지입니다. 요약할 본문을 찾지 못했습니다.`;
  }
  return `${safeTitle} 페이지 요약입니다. ${safeSummary}`;
}

export default function VoicePageAnnouncer() {
  const location = useLocation();
  const { voiceModeEnabled, settings, speak, listening, speaking } = useVoiceMode();
  const lastSignatureRef = useRef('');

  useEffect(() => {
    if (!voiceModeEnabled || !settings.autoReadPageSummary || listening || speaking) return undefined;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      const title = document.title || '현재 페이지';
      const text = buildPageSource();
      const signature = `${location.pathname}::${title}::${text.slice(0, 400)}`;

      if (!text || text.length < MIN_SUMMARY_SOURCE_LENGTH) {
        if (signature !== lastSignatureRef.current) {
          lastSignatureRef.current = signature;
          await speak(`${title} 페이지입니다. 읽을 수 있는 본문이 아직 없습니다.`);
        }
        return;
      }

      if (signature === lastSignatureRef.current) {
        return;
      }

      try {
        const result = await summarizePageForVoice({ title, text, bullets: 3 });
        if (cancelled) return;

        const summary =
          result?.summary ||
          result?.conclusion ||
          (Array.isArray(result?.keyPoints) ? result.keyPoints.join('. ') : '');

        lastSignatureRef.current = signature;
        await speak(buildSpeechText(title, summary));
      } catch {
        if (cancelled) return;
        const fallback = text.slice(0, 180);
        lastSignatureRef.current = signature;
        await speak(buildSpeechText(title, fallback));
      }
    }, 550);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, voiceModeEnabled, settings.autoReadPageSummary, speak, listening, speaking]);

  return null;
}
