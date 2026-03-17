import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceMode } from '../context/VoiceModeContext';

export default function VoicePageAnnouncer() {
  const location = useLocation();
  const { voiceModeEnabled, settings, speak, listening, speaking } = useVoiceMode();

  useEffect(() => {
    if (!voiceModeEnabled || !settings.autoReadPageSummary || listening || speaking) return undefined;

    const timer = window.setTimeout(() => {
      const sourceNode = document.querySelector('main') || document.body;
      const raw = sourceNode?.innerText || '';
      const summary = raw.replace(/\s+/g, ' ').trim().slice(0, 260);
      const title = document.title || '현재 페이지';
      speak(`${title} 페이지입니다. ${summary || '읽을 수 있는 본문이 아직 없습니다.'}`);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [location.pathname, voiceModeEnabled, settings.autoReadPageSummary, speak, listening, speaking]);

  return null;
}
