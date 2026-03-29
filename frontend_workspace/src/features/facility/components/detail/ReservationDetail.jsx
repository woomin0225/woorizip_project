import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReservationDetail } from '../../hooks/reservation/useReservationDetail';
import styles from './Detail.module.css';

export default function ReservationDetail({
  reservationNo,
  onClose,
  facilityNo,
  isOwner,
}) {
  const nav = useNavigate();
  const location = useLocation();
  const { reservationDetails, loading, error } =
    useReservationDetail(reservationNo);

  if (!reservationNo) return null;

  if (loading) return <div className={styles.loaderBox}>로딩 중...</div>;
  if (error) return <div className={styles.errorBox}>데이터 로드 실패</div>;
  if (!reservationDetails) return null;

  const {
    reservationName,
    reservationPhone,
    reservationDate,
    reservationStartTime,
    reservationEndTime,
    reservationStatus,
    facilityImages,
  } = reservationDetails;

  return (
    <div className={styles.detailContainer}>
      <div className={styles.infoSection}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>예약 상세 정보</h2>
          <span className={styles.optionBadge}>{reservationStatus}</span>
        </div>

        <div className={styles.descBox}>
          <strong>예약자명:</strong> {reservationName} <br />
          <strong>연락처:</strong> {reservationPhone} <br />
          <strong>예약 일자:</strong> {reservationDate} <br />
          <strong>이용 시간:</strong> {reservationStartTime?.slice(0, 5)} ~{' '}
          {reservationEndTime?.slice(0, 5)}
        </div>

        <div className={styles.btnGroup}>
          {isOwner || reservationStatus === 'CANCELED' ? (
            <>
              <button className={styles.primaryBtn} onClick={onClose}>
                확인
              </button>
            </>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={() =>
                nav(
                  `/reservation/form/${reservationDetails.facilityNo}/${reservationNo}`,
                  { state: location.state }
                )
              }
            >
              수정하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
