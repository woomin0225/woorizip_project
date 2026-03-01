// src/features/facility/components/detail/ReservationDetail.jsx
import React from 'react';
import { useReservationDetail } from '../../hooks/reservation/useReservationDetail';
import styles from './Detail.module.css';

export default function ReservationDetail({ reservationNo, onClose }) {
  const { reservationDetails, loading, error } =
    useReservationDetail(reservationNo);

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>예약 정보 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            <p>{error.message}</p>
            <button className={styles.inlineBtn} onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          <div className={styles.imageSection}>
            {facilityImages && facilityImages.length > 0 ? (
              facilityImages.map((img) => (
                <img
                  key={img.facilityImageNo}
                  src={img.imagePath}
                  alt={`${reservationName}님의 예약 시설 이미지`}
                  className={styles.facilityImg}
                />
              ))
            ) : (
              <div className={styles.noImage}>시설 이미지가 없습니다.</div>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.headerRow}>
              <h2 className={styles.title}>예약 상세 내역</h2>
              <p className={styles.subTitle}>
                상태: <strong>{reservationStatus}</strong>
              </p>
            </div>

            <div className={styles.descBox}>
              <dl className={styles.infoGrid}>
                <dt>예약자명</dt>
                <dd>{reservationName}</dd>
                <dt>연락처</dt>
                <dd>{reservationPhone}</dd>
                <dt>예약일자</dt>
                <dd>{reservationDate}</dd>
                <dt>이용시간</dt>
                <dd>
                  {reservationStartTime?.slice(0, 5)} ~{' '}
                  {reservationEndTime?.slice(0, 5)}
                </dd>
              </dl>
            </div>

            <div className={styles.btnGroup}>
              <button className={styles.inlineBtn} onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
