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
  autoReadBotReplies: true,
  voiceCommandEnabled: true,
  fontScale: 1,
};
const DEFAULT_SERVER_VOICE_NAME = 'ko-KR-Neural2-A';

const VoiceModeContext = createContext(null);

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const clampScale = (value, min = 1, max = 1.5) =>
  Math.min(max, Math.max(min, Number(value) || 1));

const normalizeSettings = (raw = {}) => ({
  autoReadPageSummary: Boolean(raw.autoReadPageSummary),
  autoReadBotReplies:
    raw.autoReadBotReplies === undefined
      ? DEFAULT_SETTINGS.autoReadBotReplies
      : Boolean(raw.autoReadBotReplies),
  voiceCommandEnabled:
    raw.voiceCommandEnabled === undefined
      ? DEFAULT_SETTINGS.voiceCommandEnabled
      : Boolean(raw.voiceCommandEnabled),
  fontScale: clampScale(raw.fontScale, 1, 1.24),
});

const readStoredSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
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
  const [supported, setSupported] = useState({
    recognition: false,
    synthesis: false,
  });
  const recognitionRef = useRef(null);
  const recognitionHandlerRef = useRef({});
  const speechUtteranceRef = useRef(null);
  const audioRef = useRef(null);

  const stopListeningInternal = useCallback(() => {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported({
      recognition: Boolean(getSpeechRecognitionCtor()),
      synthesis: Boolean(
        window.speechSynthesis && window.SpeechSynthesisUtterance
      ),
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

    const normalizedSettings = normalizeSettings(settings);
    window.localStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify(normalizedSettings)
    );

    const fontScale = clampScale(normalizedSettings.fontScale, 1, 1.24);
    const textScale = clampScale(1 + (fontScale - 1) * 0.92, 1, 1.22);
    const fontAdjust = clampScale(1 + (fontScale - 1) * 0.78, 1, 1.2);
    const controlScale = clampScale(1 + (fontScale - 1) * 0.2, 1, 1.08);
    const spaceScale = clampScale(1 + (fontScale - 1) * 0.16, 1, 1.06);
    const lineHeight = Math.min(1.82, 1.56 + (fontScale - 1) * 0.56);

    document.documentElement.style.setProperty(
      '--app-font-scale',
      String(textScale)
    );
    document.documentElement.style.setProperty(
      '--app-font-adjust',
      String(fontAdjust)
    );
    document.documentElement.style.setProperty(
      '--app-button-scale',
      String(controlScale)
    );
    document.documentElement.style.setProperty(
      '--app-space-scale',
      String(spaceScale)
    );
    document.documentElement.style.setProperty(
      '--app-line-height',
      String(lineHeight)
    );

    const largeTextMode = fontScale > 1.001;
    document.body.classList.toggle('large-view', largeTextMode);
    document.body.classList.toggle('accessibility-text-resize', largeTextMode);
    localStorage.setItem('ui-large-view', largeTextMode ? '1' : '0');
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
    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      !window.SpeechSynthesisUtterance
    ) {
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
      voiceName: options.voiceName || DEFAULT_SERVER_VOICE_NAME,
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

      stopListeningInternal();
      stopSpeaking();

      if (options.preferBrowser !== true) {
        try {
          await playServerSpeech(text, options);
          return true;
        } catch (error) {
          if (options.allowBrowserFallback === true) {
            return playBrowserSpeech(text, options);
          }
          console.warn('Server TTS playback failed.', error);
          return false;
        }
      }

      return playBrowserSpeech(text, options);
    },
    [playBrowserSpeech, playServerSpeech, stopListeningInternal, stopSpeaking]
  );

  const stopListening = useCallback(() => {
    stopListeningInternal();
  }, [stopListeningInternal]);

  const startListening = useCallback(
    ({
      onResult,
      onError,
      onEnd,
      lang = 'ko-KR',
      interimResults = false,
      continuous = false,
      maxAlternatives = 1,
    } = {}) => {
      const RecognitionCtor = getSpeechRecognitionCtor();
      if (!RecognitionCtor) {
        onError?.(new Error('이 브라우저는 음성 인식을 지원하지 않습니다.'));
        return false;
      }

      stopListening();

      const recognition = new RecognitionCtor();
      recognition.lang = lang;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;
      recognition.continuous = continuous;
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
      try {
        recognition.start();
        return true;
      } catch (error) {
        recognitionRef.current = null;
        setListening(false);
        recognitionHandlerRef.current.onError?.(error);
        recognitionHandlerRef.current.onEnd?.();
        return false;
      }
    },
    [stopListening]
  );

  const enableVoiceMode = useCallback(
    ({ speakWelcome = false } = {}) => {
      setVoiceModeEnabled(true);
      setPromptDismissed(true);
      if (speakWelcome) {
        window.setTimeout(() => {
          speak('음성 모드가 켜졌습니다.');
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
    setSettings((prev) => normalizeSettings({ ...prev, [key]: value }));
  }, []);

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

  return (
    <VoiceModeContext.Provider value={value}>
      {children}
    </VoiceModeContext.Provider>
  );
}

export function useVoiceMode() {
  const value = useContext(VoiceModeContext);
  if (!value) {
    throw new Error('useVoiceMode must be used within VoiceModeProvider');
  }
  return value;
}
