import React, { useEffect } from 'react';
import { useVoiceMode } from '../../context/VoiceModeContext';
import styles from './AccessibilitySettingsModal.module.css';

const FONT_OPTIONS = [
  { value: 1, label: '기본' },
  { value: 1.08, label: '조금 크게' },
  { value: 1.16, label: '크게' },
  { value: 1.24, label: '매우 크게' },
];

const SETTINGS_SUMMARY =
  '접근성 설정에서는 음성 모드, 페이지 진입 시 자동 요약 읽기, 우리봇 답변 자동 읽기, 글자 크기를 조정할 수 있습니다.';

export default function AccessibilitySettingsModal({ open, onClose }) {
  const {
    voiceModeEnabled,
    settings,
    enableVoiceMode,
    disableVoiceMode,
    updateSetting,
    speak,
  } = useVoiceMode();

  useEffect(() => {
    if (!open) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !voiceModeEnabled) return;
    speak(SETTINGS_SUMMARY);
  }, [open, voiceModeEnabled, speak]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="접근성 설정"
    >
      <div className={styles.panel}>
        <div className={styles.scrollArea}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>접근성 설정</h2>
              <p className={styles.description}>
                편의성을 위한 음성 지원과 글자 크기 설정입니다.
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="접근성 설정 닫기"
            >
              ×
            </button>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>음성 지원</h3>
            <div className={styles.optionRow}>
              <div>
                <strong>음성 모드</strong>
                <p>우리봇 음성 읽기와 음성 명령 기능을 켜거나 끕니다.</p>
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${
                  voiceModeEnabled ? styles.toggleOn : ''
                }`}
                onClick={
                  voiceModeEnabled ? disableVoiceMode : () => enableVoiceMode()
                }
              >
                {voiceModeEnabled ? '켜짐' : '꺼짐'}
              </button>
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={settings.autoReadPageSummary}
                onChange={(e) =>
                  updateSetting('autoReadPageSummary', e.target.checked)
                }
              />
              페이지 진입 시 자동 요약 읽기
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={settings.autoReadBotReplies}
                onChange={(e) =>
                  updateSetting('autoReadBotReplies', e.target.checked)
                }
              />
              우리봇 답변 자동 읽기
            </label>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>화면 보기</h3>
            <div className={styles.controlBlock}>
              <span className={styles.controlLabel}>글자 크기</span>
              <div className={styles.choiceRow}>
                {FONT_OPTIONS.map((option) => (
                  <button
                    key={`font-${option.value}`}
                    type="button"
                    className={`${styles.choiceBtn} ${
                      settings.fontScale === option.value
                        ? styles.choiceActive
                        : ''
                    }`}
                    onClick={() => updateSetting('fontScale', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
