// src/features/facility/components/list/ReservationList.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReservationList } from '../../hooks/reservation/useReservationList';
import ReservationDetail from '../detail/ReservationDetail';
import styles from './List.module.css';

export default function ReservationList() {
  const { facilityNo } = useParams();

  const { reservationList, loading, error, setPage, query, pageResponse } =
    useReservationList(facilityNo || '');

  const [selectedResNo, setSelectedResNo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isOwner = !!facilityNo;

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>예약 목록 로딩 중...</div>
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
            <button
              className={styles.secondaryBtn}
              onClick={() => setPage(query.page)}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            {isOwner ? '시설 예약 목록' : '내 예약 내역'}
          </h2>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.facilityHeader}>
            <span>{isOwner ? '이용 일정' : '시설명 / 이용 일정'}</span>
            <span className={styles.textMuted}>상세보기</span>
          </div>

          {reservationList.length === 0 ? (
            <div className={styles.facilityEmpty}>예약 내역이 없습니다.</div>
          ) : (
            <>
              {reservationList.map((r) => (
                <div
                  key={r.reservationNo}
                  className={styles.facilityRow}
                  onClick={() => {
                    setSelectedResNo(r.reservationNo);
                    setModalOpen(true);
                  }}
                >
                  <div>
                    <div className={styles.oneLine}>
                      {!isOwner && `${r.facilityName} | `}
                      {r.reservationDate} ({r.reservationStartTime.slice(0, 5)}{' '}
                      ~ {r.reservationEndTime.slice(0, 5)})
                    </div>
                    <div className={styles.textMuted}>
                      상태: {r.reservationStatus}
                    </div>
                  </div>
                  <button className={styles.inlineBtn}>조회</button>
                </div>
              ))}

              {pageResponse && pageResponse.totalPages > 1 && (
                <div className={styles.pager}>
                  {Array.from(
                    { length: pageResponse.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={
                        query.page === pageNum
                          ? `${styles.inlineBtn} ${styles.inlineBtnActive}`
                          : styles.inlineBtn
                      }
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <ReservationDetail
          reservationNo={selectedResNo}
          owner={isOwner}
          onClose={() => {
            setModalOpen(false);
            setPage(query.page);
          }}
        />
      )}
    </div>
  );
}
