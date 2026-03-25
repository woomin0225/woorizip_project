import React from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReservationForm } from '../../hooks/reservation/useReservationForm';
import styles from './Form.module.css';
import { useFacilityDetail } from './../../hooks/facility/useFacilityDetail';

export default function ReservationForm({
  facilityNo,
  reservationNo,
  onCancel,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    values,
    reservedList,
    handleChange,
    loading: resLoading,
    submitting,
    onSubmit,
    phoneError,
  } = useReservationForm(facilityNo, reservationNo);
  const { facilityDetails, loading: facLoading } =
    useFacilityDetail(facilityNo);

  const updateMode = !!reservationNo;

  const generateTimeOptions = (selectedDate, open, close, unit) => {
    // 1. 값 존재 여부 체크
    if (!selectedDate || !open || !close || !unit) return [];

    const options = [];

    // 2. 시간 형식이 "09:00:00"처럼 초 단위가 있으면 "09:00"으로 자르기
    const safeOpen = open.substring(0, 5);
    const safeClose = close.substring(0, 5);
    // 날짜 형식이 ISO 포맷일 경우를 대비해 순수 날짜만 추출
    const safeDate = selectedDate.includes('T')
      ? selectedDate.split('T')[0]
      : selectedDate;

    try {
      // 3. 브라우저 호환성을 위해 "YYYY/MM/DD HH:mm" 형식으로 생성
      const baseDate = safeDate.replace(/-/g, '/');
      let current = new Date(`${baseDate} ${safeOpen}`);
      const end = new Date(`${baseDate} ${safeClose}`);

      // 유효하지 않은 날짜면 빈 배열 반환
      if (isNaN(current.getTime())) return [];

      while (current <= end) {
        const hh = String(current.getHours()).padStart(2, '0');
        const mm = String(current.getMinutes()).padStart(2, '0');
        options.push(`${hh}:${mm}`);

        current.setMinutes(current.getMinutes() + unit);
        if (options.length > 100) break; // 무한루프 방지
      }
    } catch (e) {
      return [];
    }
    return options;
  };

  const timeOptions = useMemo(() => {
    // facilityDetails가 다 들어왔는지 확인
    if (!values.reservationDate || !facilityDetails?.facilityOpenTime)
      return [];

    return generateTimeOptions(
      values.reservationDate,
      facilityDetails.facilityOpenTime,
      facilityDetails.facilityCloseTime,
      facilityDetails.facilityRsvnUnitMinutes
    );
  }, [values.reservationDate, facilityDetails]);

  const finalTimeOptions = useMemo(() => {
    if (!timeOptions.length) return [];

    return timeOptions.filter((time) => {
      const isOverlapped = reservedList?.some((res) => {
        if (updateMode && String(res.reservationNo) === String(reservationNo))
          return false;

        const start = res.reservationStartTime.substring(0, 5);
        const end = res.reservationEndTime.substring(0, 5);

        return time >= start && time < end;
      });

      return !isOverlapped;
    });
  }, [timeOptions, reservedList, updateMode, reservationNo]);

  const endTimeOptions = useMemo(() => {
    // 1. 필요한 값이 없으면 빈 배열
    if (!values.reservationStartTime || !facilityDetails) return [];

    const options = [];
    const unit = facilityDetails.facilityRsvnUnitMinutes;
    const maxDuration = facilityDetails.facilityMaxDurationMinutes;
    const closeTime = facilityDetails.facilityCloseTime;

    const selectedDate = values.reservationDate;
    // 시작 시간에서 초 단위 제거 ("14:00:00" -> "14:00")
    const startTimeStr = values.reservationStartTime.substring(0, 5);

    // 날짜 형식 안전하게 처리
    const safeDate = selectedDate.includes('T')
      ? selectedDate.split('T')[0]
      : selectedDate;
    const baseDate = safeDate.replace(/-/g, '/');

    let current = new Date(`${baseDate} ${startTimeStr}`);
    const startTimestamp = current.getTime();
    const endLimit = new Date(`${baseDate} ${closeTime.substring(0, 5)}`);

    while (true) {
      current.setMinutes(current.getMinutes() + unit);

      const duration = (current.getTime() - startTimestamp) / (1000 * 60);
      if (duration > maxDuration || current > endLimit) break;

      const currentTimeStr =
        String(current.getHours()).padStart(2, '0') +
        ':' +
        String(current.getMinutes()).padStart(2, '0');

      // 2. 다른 예약과 겹치는지 체크 (내 예약은 제외!)
      const isBlocked = reservedList?.some((res) => {
        if (updateMode && String(res.reservationNo) === String(reservationNo))
          return false;

        const resStart = res.reservationStartTime.substring(0, 5);
        const resEnd = res.reservationEndTime.substring(0, 5);
        return currentTimeStr > resStart && currentTimeStr <= resEnd;
      });

      if (isBlocked) break;
      options.push(currentTimeStr);
    }

    return options;
  }, [
    values.reservationStartTime,
    values.reservationDate,
    facilityDetails,
    reservedList,
    updateMode,
    reservationNo,
  ]);

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
              onSubmit={(e) => onSubmit(e, navigate, undefined, location.state)}
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
                        inputMode="numeric"
                        placeholder="01011111111"
                        aria-invalid={!!phoneError}
                        required
                      />
                      <small className={styles.fieldHelp}>
                        ※ 연락처는 숫자만 입력해주세요
                      </small>
                      {phoneError && (
                        <small className={styles.fieldError}>
                          {phoneError}
                        </small>
                      )}
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
                          value={
                            values.reservationStartTime?.substring(0, 5) || ''
                          }
                          onChange={handleChange}
                          required
                        >
                          <option value="">시작 시간 선택</option>
                          {finalTimeOptions.map((time) => (
                            <option key={time} value={time}>
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
                          value={
                            values.reservationEndTime?.substring(0, 5) || ''
                          }
                          onChange={handleChange}
                          required
                        >
                          <option value="">
                            {!values.reservationStartTime
                              ? '시작 시간을 먼저 선택하세요'
                              : '종료 시간 선택'}
                          </option>
                          {endTimeOptions.map((time) => (
                            <option key={time} value={time}>
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
                        await onSubmit(
                          null,
                          navigate,
                          {
                            ...values,
                            reservationStatus: 'CANCELED',
                          },
                          location.state
                        );
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
