import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReservationForm } from '../../hooks/reservation/useReservationForm';
import styles from './Form.module.css';

export default function ReservationForm({
  facilityNo,
  reservationNo,
  onCancel,
}) {
  const navigate = useNavigate();
  const { values, handleChange, loading, submitting, onSubmit } = useReservationForm(
    facilityNo,
    reservationNo
  );

  const updateMode = !!reservationNo;

  if (loading) return <div className={styles.facilityEmpty}>데이터를 불러오는 중...</div>;

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          <div className={styles.infoSection}>
            
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.title}>
                  {updateMode ? '예약 정보 수정' : '시설 이용 예약'}
                </h2>
                <p className={styles.subTitle}>예약에 필요한 정보를 입력해주세요.</p>
              </div>
            </div>

            <form 
              onSubmit={(e) => onSubmit(e, navigate)} 
              className={styles.formBody}
            >
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>예약자 정보</h4>
                <div className={styles.surveyBox}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>예약자명</div>
                    <div className={styles.fieldControl}>
                      <input
                        type="text"
                        name="reservationName"
                        className={styles.input}
                        value={values.reservationName || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>연락처</div>
                    <div className={styles.fieldControl}>
                      <input
                        type="tel"
                        name="reservationPhone"
                        className={styles.input}
                        value={values.reservationPhone || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>일정 선택</h4>
                <div className={styles.surveyBox}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>예약 날짜</div>
                    <div className={styles.fieldControl}>
                      <input
                        type="date"
                        name="reservationDate"
                        className={styles.input}
                        value={values.reservationDate || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.grid2}>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>시작 시간</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="time"
                          name="reservationStartTime"
                          className={styles.input}
                          value={values.reservationStartTime || ''}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>종료 시간</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="time"
                          name="reservationEndTime"
                          className={styles.input}
                          value={values.reservationEndTime || ''}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.btnGroup}>
                <button 
                  type="button" 
                  className={styles.secondaryBtn} 
                  onClick={onCancel || (() => navigate(-1))}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryBtn} 
                  disabled={submitting}
                >
                  {submitting ? '저장 중...' : updateMode ? '수정' : '예약'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}