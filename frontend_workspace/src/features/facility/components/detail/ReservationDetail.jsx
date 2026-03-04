import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReservationDetail } from '../../hooks/reservation/useReservationDetail';
import styles from './Detail.module.css';

export default function ReservationDetail({ reservationNo, onClose, facilityNo, isOwner }) {
  const nav = useNavigate();
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
      <div className={styles.imageSection}>
        {facilityImages && facilityImages.length > 0 ? (
          facilityImages.map((img) => (
            <img
              key={img.facilityImageNo}
              src={img.imagePath}
              alt="시설 이미지"
              className={styles.facilityImg}
            />
          ))
        ) : (
          <div className={styles.noImage}>이미지 없음</div>
        )}
      </div>

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
          {isOwner ? (
            <>
              <button
                className={styles.primaryBtn}
                onClick={onClose}
              >
                확인
              </button>
            </>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={() => nav(`/reservation/form/${facilityNo}/${reservationNo}`)}
            >
              수정하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
