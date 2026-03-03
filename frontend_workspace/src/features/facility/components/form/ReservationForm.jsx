// src/features/facility/components/form/ReservationForm.jsx
import React from 'react';
import { useReservationForm } from '../../hooks/reservation/useReservationForm';
import styles from './Form.module.css';

export default function ReservationForm({
  facilityNo,
  reservationNo,
  onSubmit: pageSubmit,
  onCancel,
  submitText,
}) {
  const { values, handleChange, loading, submitting } = useReservationForm(
    facilityNo,
    reservationNo
  );

  if (loading) return <div className={styles.loading}>정보 로딩 중...</div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    pageSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.descBox}>
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>예약자 정보</h4>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>예약자명</label>
          <input
            type="text"
            name="reservationName"
            className={styles.input}
            value={values.reservationName}
            onChange={handleChange}
          />
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>연락처</label>
          <input
            type="tel"
            name="reservationPhone"
            className={styles.input}
            value={values.reservationPhone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitle}>일정 선택</h4>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>예약 날짜</label>
          <input
            type="date"
            name="reservationDate"
            className={styles.input}
            value={values.reservationDate}
            onChange={handleChange}
          />
        </div>
        <div className={styles.grid2}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>이용 시작 시간</label>
            <input
              type="time"
              name="reservationStartTime"
              className={styles.input}
              value={values.reservationStartTime}
              onChange={handleChange}
            />
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>이용 종료 시간</label>
            <input
              type="time"
              name="reservationEndTime"
              className={styles.input}
              value={values.reservationEndTime}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button type="button" className={styles.inlineBtn} onClick={onCancel}>
          취소
        </button>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={submitting}
        >
          {submitText}
        </button>
      </div>
    </form>
  );
}
