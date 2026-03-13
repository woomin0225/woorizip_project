import React, { useEffect } from 'react';
import { useVoiceMode } from '../context/VoiceModeContext';
import styles from './ScreenReaderVoicePrompt.module.css';

export default function ScreenReaderVoicePrompt() {
  const {
    voiceModeEnabled,
    promptDismissed,
    enableVoiceMode,
    dismissPrompt,
  } = useVoiceMode();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!promptDismissed || voiceModeEnabled) {
        if (event.altKey && event.shiftKey && event.code === 'KeyV') {
          event.preventDefault();
          enableVoiceMode();
        }
        if (event.altKey && event.shiftKey && event.code === 'KeyN') {
          event.preventDefault();
          dismissPrompt();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dismissPrompt, enableVoiceMode, promptDismissed, voiceModeEnabled]);

  if (voiceModeEnabled || promptDismissed) {
    return null;
  }

  return (
    <section
      className={styles.srOnly}
      aria-live="assertive"
      aria-atomic="true"
      role="dialog"
      aria-label="음성 모드 안내"
    >
      <h2>음성 모드 안내</h2>
      <p>
        음성 모드로 변경하시겠습니까? 음성 모드를 사용하면 우리봇이 페이지 내용을 읽어주고,
        음성 입력과 재확인 안내를 통해 페이지를 조작할 수 있습니다.
      </p>
      <p>
        음성 모드를 켜려면 아래 버튼을 선택하거나 Alt Shift V를 누르세요. 나중에 하려면 Alt Shift N을 누르세요.
      </p>
      <div>
        <button type="button" onClick={() => enableVoiceMode()}>
          음성 모드 사용
        </button>
        <button type="button" onClick={dismissPrompt}>
          나중에 하기
        </button>
      </div>
    </section>
  );
}
