import React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReservationForm } from '../../hooks/reservation/useReservationForm';
import styles from './Form.module.css';
import { useFacilityDetail } from './../../hooks/facility/useFacilityDetail';

export default function ReservationForm({
  facilityNo,
  reservationNo,
  onCancel,
}) {
  const navigate = useNavigate();
  const {
    values,
    reservedList,
    handleChange,
    loading: resLoading,
    submitting,
    onSubmit,
  } = useReservationForm(facilityNo, reservationNo);
  const { facilityDetails, loading: facLoading } =
    useFacilityDetail(facilityNo);

  const updateMode = !!reservationNo;

  const generateTimeOptions = (selectedDate, open, close, unit) => {
    if (!selectedDate || !open || !close || !unit) return [];

    const options = [];

    let current = new Date(`${selectedDate}T${open}`);
    const end = new Date(`${selectedDate}T${close}`);

    while (current <= end) {
      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      options.push(`${hh}:${mm}`);

      current.setMinutes(current.getMinutes() + unit);
    }
    return options;
  };

  const timeOptions = useMemo(() => {
    return generateTimeOptions(
      values.reservationDate,
      facilityDetails?.facilityOpenTime,
      facilityDetails?.facilityCloseTime,
      facilityDetails?.facilityRsvnUnitMinutes
    );
  }, [values.reservationDate, facilityDetails]);

  const finalTimeOptions = useMemo(() => {
  if (!timeOptions.length) return [];

  return timeOptions.filter(time => {
    const isOverlapped = reservedList?.some(res => {
      const start = res.reservationStartTime.substring(0, 5);
      const end = res.reservationEndTime.substring(0, 5);
      
      return time >= start && time < end;
    });

    return !isOverlapped;
  });
}, [timeOptions, reservedList]);

 const endTimeOptions = useMemo(() => {
  if (!values.reservationStartTime || !facilityDetails) return [];

  const options = [];
  const unit = facilityDetails.facilityRsvnUnitMinutes;
  const maxDuration = facilityDetails.facilityMaxDurationMinutes;
  const closeTime = facilityDetails.facilityCloseTime;

  const selectedDate = values.reservationDate;
  const startTimeStr = values.reservationStartTime.substring(0, 5);
  let current = new Date(`${selectedDate}T${startTimeStr}`);
  const startTimestamp = current.getTime();
  
  const endLimit = new Date(`${selectedDate}T${closeTime}`);

  while (true) {
    current.setMinutes(current.getMinutes() + unit);
    
    const duration = (current.getTime() - startTimestamp) / (1000 * 60);
    if (duration > maxDuration) break;

    if (current > endLimit) break;

    const currentTimeStr = current.toTimeString().substring(0, 5);
    const isBlocked = reservedList?.some(res => {
      const resStart = res.reservationStartTime.substring(0, 5);
      const resEnd = res.reservationEndTime.substring(0, 5);
      return currentTimeStr > resStart && currentTimeStr <= resEnd;
    });
    
    if (isBlocked) break;

    options.push(currentTimeStr);
  }

  return options;
}, [values.reservationStartTime, values.reservationDate, facilityDetails, reservedList]);

  if (facLoading || resLoading)
    return <div className={styles.facilityEmpty}>데이터를 불러오는 중...</div>;

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
                <p className={styles.subTitle}>
                  예약에 필요한 정보를 입력해주세요.
                </p>
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
                        <select
                          name="reservationStartTime"
                          className={styles.input}
                          value={values.reservationStartTime || ''}
                          onChange={handleChange}
                          required
                        >
                          <option value="">시작 시간 선택</option>
                          {finalTimeOptions.map((time) => (
                            <option key={time} value={`${time}:00`}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>종료 시간</div>
                      <div className={styles.fieldControl}>
                        <select
                          name="reservationEndTime"
                          className={styles.input}
                          value={values.reservationEndTime || ''}
                          onChange={handleChange}
                          disabled={!values.reservationStartTime}
                          required
                        >
                          <option value="">
                            {!values.reservationStartTime
                              ? '시작 시간을 먼저 선택하세요'
                              : '종료 시간 선택'}
                          </option>
                          {endTimeOptions.map((time) => (
                            <option key={time} value={`${time}:00`}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.btnGroup}>
                {!!updateMode && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={async () => {
                      if (window.confirm('해당 예약을 취소하시겠습니까?')) {
                        await onSubmit(null, navigate, {
                          ...values,
                          reservationStatus: 'CANCELED',
                        });
                      }
                    }}
                  >
                    예약 취소
                  </button>
                )}
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={onCancel || (() => navigate('/facility/view'))}
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
