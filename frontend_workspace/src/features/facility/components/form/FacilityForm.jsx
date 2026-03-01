// src/features/facility/components/form/FacilityForm.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacilityForm } from '../../hooks/facility/useFacilityForm';
import styles from './Form.module.css';

export default function FacilityForm() {
  const { houseNo, facilityNo } = useParams();
  const navigate = useNavigate();

  const {
    values,
    categories,
    defaultOptions,
    handleChange,
    handleOptionChange,
    addCustomOption,
    loading,
    submitting,
    onSubmit,
    updateMode,
  } = useFacilityForm(facilityNo);

  const [customInputs, setCustomInputs] = useState(['', '', '', '', '']);

  const handleCustomBlur = (index) => {
    const text = customInputs[index].trim();
    if (text) {
      addCustomOption(text);
    }
  };

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>시설 정보 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          <div className={styles.infoSection}>
            <h2 className={styles.title}>
              {updateMode ? '시설 정보 수정' : '신규 시설 등록'}
            </h2>

            <form
              onSubmit={(e) => onSubmit(e, navigate)}
              className={styles.descBox}
            >
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>기본 정보</h4>
                <div className={styles.menuList}>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>카테고리</label>
                    <select
                      name="facilityCode"
                      className={styles.input}
                      value={values.facilityCode}
                      onChange={handleChange}
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((cat) => (
                        <option key={cat.facilityCode} value={cat.facilityCode}>
                          {cat.facilityType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>시설 이름</label>
                    <input
                      type="text"
                      name="facilityName"
                      className={styles.input}
                      value={values.facilityName}
                      onChange={handleChange}
                      placeholder="시설 이름을 입력해주세요"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>운영 정보</h4>
                <div className={styles.grid2}>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>위치(층)</label>
                    <input
                      type="number"
                      name="facilityLocation"
                      className={styles.input}
                      value={values.facilityLocation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>수용 인원</label>
                    <input
                      type="number"
                      name="facilityCapacity"
                      className={styles.input}
                      value={values.facilityCapacity}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>여는 시간</label>
                    <input
                      type="time"
                      name="facilityOpenTime"
                      className={styles.input}
                      value={values.facilityOpenTime}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>닫는 시간</label>
                    <input
                      type="time"
                      name="facilityCloseTime"
                      className={styles.input}
                      value={values.facilityCloseTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>시설 옵션</h4>
                <div className={styles.reasonGroup}>
                  {defaultOptions.map((opt) => (
                    <label key={opt} className={styles.reasonItem}>
                      <input
                        type="checkbox"
                        checked={!!values.facilityOptionInfo[opt]}
                        onChange={(e) =>
                          handleOptionChange(opt, e.target.checked)
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                <div className={styles.menuList}>
                  {customInputs.map((val, idx) => (
                    <div key={idx} className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>
                        기타 옵션 {idx + 1}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="옵션을 입력해주세요"
                        value={val}
                        onChange={(e) => {
                          const next = [...customInputs];
                          next[idx] = e.target.value;
                          setCustomInputs(next);
                        }}
                        onBlur={() => handleCustomBlur(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <label className={styles.confirmCheck}>
                  <input
                    type="checkbox"
                    name="facilityRsvnRequiredYn"
                    checked={values.facilityRsvnRequiredYn}
                    onChange={handleChange}
                  />
                  <span>시설 예약 시스템을 사용합니다.</span>
                </label>

                {values.facilityRsvnRequiredYn && (
                  <div className={styles.surveyBox}>
                    <div className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>
                        일일 최대 예약
                      </label>
                      <input
                        type="number"
                        name="maxRsvnPerDay"
                        className={styles.input}
                        value={values.maxRsvnPerDay}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>예약 단위</label>
                      <select
                        name="facilityRsvnUnitMinutes"
                        className={styles.input}
                        value={values.facilityRsvnUnitMinutes}
                        onChange={handleChange}
                      >
                        <option value="">단위 시간 선택</option>
                        <option value="15">15분</option>
                        <option value="30">30분</option>
                        <option value="45">45분</option>
                        <option value="60">60분</option>
                      </select>
                    </div>
                    <div className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>
                        최대 이용 시간
                      </label>
                      <select
                        name="facilityMaxDurationMinutes"
                        className={styles.input}
                        value={values.facilityMaxDurationMinutes}
                        onChange={handleChange}
                      >
                        <option value="">시간 선택</option>
                        <option value="30">30분</option>
                        <option value="60">60분(1시간)</option>
                        <option value="90">90분(1.5시간)</option>
                        <option value="120">120분(2시간)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={styles.inlineBtn}
                  onClick={() => navigate('/facility/view')}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submitting}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
