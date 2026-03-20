import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { synthesizeTts } from '../api/ttsApi';

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

const clampScale = (value, min = 1, max = 1.5) =>
  Math.min(max, Math.max(min, Number(value) || 1));

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
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState({ recognition: false, synthesis: false });
  const recognitionRef = useRef(null);
  const recognitionHandlerRef = useRef({});
  const speechUtteranceRef = useRef(null);
  const audioRef = useRef(null);
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

    const fontScale = clampScale(settings.fontScale, 1, 1.25);
    const pageZoom = clampScale(settings.pageZoom, 1, 1.3);
    const buttonScale = clampScale(settings.buttonScale, 1, 1.3);
    const textScale = clampScale(
      1 + (fontScale - 1) * 0.82 + (pageZoom - 1) * 0.9,
      1,
      1.45
    );
    const controlScale = clampScale(
      1 + (buttonScale - 1) * 0.9 + (pageZoom - 1) * 0.72,
      1,
      1.42
    );
    const spaceScale = clampScale(
      1 + (fontScale - 1) * 0.28 + (buttonScale - 1) * 0.2 + (pageZoom - 1) * 0.55,
      1,
      1.28
    );
    const lineHeight = Math.min(1.8, 1.52 + (textScale - 1) * 0.52);

    document.documentElement.style.setProperty('--app-font-scale', String(textScale));
    document.documentElement.style.setProperty('--app-button-scale', String(controlScale));
    document.documentElement.style.setProperty('--app-space-scale', String(spaceScale));
    document.documentElement.style.setProperty('--app-line-height', String(lineHeight));

    document.body.style.transformOrigin = '';
    document.body.style.transform = '';
    document.body.style.width = '';
    document.body.style.minHeight = '';

    const largeView = textScale > 1 || controlScale > 1 || spaceScale > 1;
    document.body.classList.toggle('large-view', largeView);
    localStorage.setItem('ui-large-view', largeView ? '1' : '0');
  }, [settings]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speechUtteranceRef.current) {
      speechUtteranceRef.current.onend = null;
      speechUtteranceRef.current.onerror = null;
      speechUtteranceRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const playBrowserSpeech = useCallback((text, options = {}) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const utterance = new window.SpeechSynthesisUtterance(String(text));
      speechUtteranceRef.current = utterance;
      utterance.lang = options.lang || 'ko-KR';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.onend = () => {
        if (speechUtteranceRef.current === utterance) {
          speechUtteranceRef.current = null;
        }
        setSpeaking(false);
        resolve(true);
      };
      utterance.onerror = () => {
        if (speechUtteranceRef.current === utterance) {
          speechUtteranceRef.current = null;
        }
        setSpeaking(false);
        resolve(false);
      };
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const playServerSpeech = useCallback(async (text, options = {}) => {
    const { audioBytes, mimeType } = await synthesizeTts({
      text: String(text),
      voiceName: options.voiceName,
    });

    return new Promise((resolve, reject) => {
      const blob = new Blob([audioBytes], { type: mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setSpeaking(true);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeaking(false);
        resolve(true);
      };

      audio.onerror = (event) => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeaking(false);
        reject(event);
      };

      audio.play().catch((error) => {
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeaking(false);
        reject(error);
      });
    });
  }, []);

  const speak = useCallback(
    async (text, options = {}) => {
      if (!text) return false;

      stopSpeaking();

      if (options.preferBrowser !== true) {
        try {
          await playServerSpeech(text, options);
          return true;
        } catch {
          return playBrowserSpeech(text, options);
        }
      }

      return playBrowserSpeech(text, options);
    },
    [playBrowserSpeech, playServerSpeech, stopSpeaking]
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
      stopSpeaking();

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
    [stopListening, stopSpeaking]
  );

  const enableVoiceMode = useCallback(
    ({ speakWelcome = true } = {}) => {
      setVoiceModeEnabled(true);
      setPromptDismissed(true);
      if (speakWelcome) {
        window.setTimeout(() => {
          speak('음성 모드가 켜졌습니다. 약 2초 정도 멈추면 자동으로 듣기를 마치고 안내를 이어갑니다.');
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
    setSettings((prev) => ({ ...prev, autoReadPageSummary: false }));
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
      speaking,
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
      speaking,
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



