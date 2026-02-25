import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { createTour } from '../api/tourAPI';
import styles from './TourApply.module.css';

export default function TourApply() {
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ roomNo: '', tourDate: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTour(form.roomNo, { tourDate: form.tourDate });
      setMessage('투어 신청이 완료되었습니다.');
    } catch (e2) {
      setMessage(e2.message || '투어 신청 실패');
    }
  };

  return (
    <section className={styles.page}><Container><Row className="justify-content-center"><Col lg="8"><Card className="shadow border-0"><CardBody>
      <h2 className={styles.title}>투어 신청</h2>
      <form onSubmit={onSubmit}>
        <input className={styles.input} placeholder="방 번호" value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} />
        <input className={styles.input} placeholder="희망 일정 (예: 2026-03-10 14:00)" value={form.tourDate} onChange={(e) => setForm({ ...form, tourDate: e.target.value })} />
        <button className={styles.btn} type="submit">신청하기</button>
      </form>
      {message && <p className={styles.msg}>{message}</p>}
    </CardBody></Card></Col></Row></Container></section>
  );
}
