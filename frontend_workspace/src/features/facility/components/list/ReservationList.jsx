import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReservationList } from '../../hooks/reservation/useReservationList';
import Modal from '../../../../shared/components/Modal/Modal';
import ReservationDetail from '../detail/ReservationDetail';
import styles from './List.module.css';

export default function ReservationList() {
  const { facilityNo } = useParams();
  const { reservationList, loading, error, setPage, query, pageResponse } =
    useReservationList(facilityNo || '');

  const [selectedResNo, setSelectedResNo] = useState(null);
  const isOwner = !!facilityNo;

  if (loading) return <div className={styles.facilityEmpty}>로딩 중...</div>;
  if (error)
    return (
      <div className={styles.facilityEmpty}>에러 발생: {error.message}</div>
    );

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {isOwner ? '시설 예약 관리' : '내 예약 내역'}
        </h2>
      </div>

      <div className={styles.facilityContainer}>
        <div className={styles.facilityHeader}>
          <span>{isOwner ? '예약 정보' : '시설 및 일정'}</span>
        </div>

        {reservationList.length > 0 ? (
          reservationList.map((r) => (
            <div
              key={r.reservationNo}
              className={styles.facilityRow}
              onClick={() => setSelectedResNo(r.reservationNo)}
            >
              <div className={styles.oneLine}>
                {!isOwner && <strong>[{r.facilityName}] </strong>}
                {r.reservationDate} ({r.reservationStartTime.slice(0, 5)} ~{' '}
                {r.reservationEndTime.slice(0, 5)})
                <span className={styles.textMuted}>
                  {' '}
                  | {r.reservationStatus}
                </span>
              </div>
              <span className={styles.textMuted}>조회 &gt;</span>
            </div>
          ))
        ) : (
          <div className={styles.facilityEmpty}>예약 내역이 없습니다.</div>
        )}
      </div>

      {pageResponse && pageResponse.totalPages > 1 && (
        <div className={styles.pager}>
          {Array.from({ length: pageResponse.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                className={
                  query.page === p
                    ? `${styles.inlineBtn} ${styles.inlineBtnActive}`
                    : styles.inlineBtn
                }
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}

      {selectedResNo && (
        <Modal onClose={() => setSelectedResNo(null)}>
          <ReservationDetail
            reservationNo={selectedResNo}
            onClose={() => {
              setSelectedResNo(null);
              setPage(query.page);
            }}
            facilityNo={facilityNo}
            isOwner={isOwner}
          />
        </Modal>
      )}
    </div>
  );
}
