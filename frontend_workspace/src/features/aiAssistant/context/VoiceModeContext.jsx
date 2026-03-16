import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const STORAGE_KEY_ENABLED = 'woorizip.voiceModeEnabled';
const STORAGE_KEY_DISMISSED = 'woorizip.voicePromptDismissed';
const STORAGE_KEY_SETTINGS = 'woorizip.accessibilitySettings';

const DEFAULT_SETTINGS = {
  autoReadPageSummary: false,
  readFocusedElement: false,
  autoReadBotReplies: true,
  voiceCommandEnabled: true,
  fontScale: 1,
  pageZoom: 1,
  buttonScale: 1,
};

const VoiceModeContext = createContext(null);

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const readStoredSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const normalizeSpeakableText = (node) => {
  if (!node) return '';
  const ariaLabel = node.getAttribute?.('aria-label');
  const labelledBy = node.getAttribute?.('aria-labelledby');
  const placeholder = node.getAttribute?.('placeholder');
  const text = node.innerText || node.textContent || '';

  if (ariaLabel) return ariaLabel.trim();
  if (labelledBy && typeof document !== 'undefined') {
    const labelNode = document.getElementById(labelledBy);
    if (labelNode?.textContent) return labelNode.textContent.trim();
  }
  if (placeholder) return placeholder.trim();
  return String(text).replace(/\s+/g, ' ').trim();
};

export function VoiceModeProvider({ children }) {
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });
  const [promptDismissed, setPromptDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
  });
  const [settings, setSettings] = useState(readStoredSettings);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({ recognition: false, synthesis: false });
  const recognitionRef = useRef(null);
  const recognitionHandlerRef = useRef({});
  const lastFocusAnnouncementRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported({
      recognition: Boolean(getSpeechRecognitionCtor()),
      synthesis: Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance),
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_ENABLED, String(voiceModeEnabled));
  }, [voiceModeEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_DISMISSED, String(promptDismissed));
  }, [promptDismissed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

    document.documentElement.style.setProperty('--app-font-scale', String(settings.fontScale));
    document.documentElement.style.setProperty('--app-button-scale', String(settings.buttonScale));
    document.documentElement.style.zoom = String(settings.pageZoom);

    const largeView = settings.fontScale > 1 || settings.pageZoom > 1 || settings.buttonScale > 1;
    document.body.classList.toggle('large-view', largeView);
    localStorage.setItem('ui-large-view', largeView ? '1' : '0');
  }, [settings]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        return false;
      }

      stopSpeaking();
      const utterance = new window.SpeechSynthesisUtterance(String(text));
      utterance.lang = options.lang || 'ko-KR';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [stopSpeaking]
  );

  const stopListening = useCallback(() => {
    recognitionHandlerRef.current = {};
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const startListening = useCallback(
    ({ onResult, onError, onEnd } = {}) => {
      const RecognitionCtor = getSpeechRecognitionCtor();
      if (!RecognitionCtor) {
        onError?.(new Error('이 브라우저는 음성 인식을 지원하지 않습니다.'));
        return false;
      }

      stopListening();
      const recognition = new RecognitionCtor();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognitionHandlerRef.current = { onResult, onError, onEnd };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results || [])
          .map((result) => result?.[0]?.transcript || '')
          .join(' ')
          .trim();
        recognitionHandlerRef.current.onResult?.(transcript);
      };

      recognition.onerror = (event) => {
        recognitionHandlerRef.current.onError?.(event);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
        recognitionHandlerRef.current.onEnd?.();
      };

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
      return true;
    },
    [stopListening]
  );

  const enableVoiceMode = useCallback(
    ({ speakWelcome = true } = {}) => {
      setVoiceModeEnabled(true);
      setPromptDismissed(true);
      if (speakWelcome) {
        setTimeout(() => {
          speak('음성 모드가 켜졌습니다. 이제 우리봇과 음성으로 대화하고 페이지 안내를 들을 수 있습니다.');
        }, 150);
      }
    },
    [speak]
  );

  const disableVoiceMode = useCallback(() => {
    stopListening();
    stopSpeaking();
    setVoiceModeEnabled(false);
    setPromptDismissed(true);
  }, [stopListening, stopSpeaking]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
  }, []);

  const resetPrompt = useCallback(() => {
    setPromptDismissed(false);
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (!voiceModeEnabled || !settings.readFocusedElement) return undefined;

    const onFocusIn = (event) => {
      const target = event.target;
      const text = normalizeSpeakableText(target);
      if (!text || text === lastFocusAnnouncementRef.current) return;
      lastFocusAnnouncementRef.current = text;
      speak(`현재 포커스: ${text}`);
    };

    window.addEventListener('focusin', onFocusIn);
    return () => window.removeEventListener('focusin', onFocusIn);
  }, [voiceModeEnabled, settings.readFocusedElement, speak]);

  const value = useMemo(
    () => ({
      voiceModeEnabled,
      promptDismissed,
      listening,
      settings,
      isSpeechRecognitionSupported: supported.recognition,
      isSpeechSynthesisSupported: supported.synthesis,
      enableVoiceMode,
      disableVoiceMode,
      dismissPrompt,
      resetPrompt,
      updateSetting,
      speak,
      stopSpeaking,
      startListening,
      stopListening,
    }),
    [
      voiceModeEnabled,
      promptDismissed,
      listening,
      settings,
      supported,
      enableVoiceMode,
      disableVoiceMode,
      dismissPrompt,
      resetPrompt,
      updateSetting,
      speak,
      stopSpeaking,
      startListening,
      stopListening,
    ]
  );

  return <VoiceModeContext.Provider value={value}>{children}</VoiceModeContext.Provider>;
}

export function useVoiceMode() {
  const value = useContext(VoiceModeContext);
  if (!value) throw new Error('useVoiceMode must be used within VoiceModeProvider');
  return value;
}
