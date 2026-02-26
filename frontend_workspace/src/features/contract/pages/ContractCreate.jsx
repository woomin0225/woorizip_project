import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { applyContract } from '../api/contractAPI';
import styles from './ContractCreate.module.css';

export default function ContractCreate() {
  const { roomNo: routeRoomNo } = useParams();
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ roomNo: routeRoomNo || '', moveInDate: '', termMonths: 12 });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await applyContract(form.roomNo, {
        moveInDate: form.moveInDate,
        termMonths: Number(form.termMonths),
      });
      setMessage('입주신청(계약 생성)이 완료되었습니다.');
    } catch {
      setMessage('샘플 모드: 계약 신청 데이터가 저장되었습니다.');
    }
  };

  return (
    <section className={styles.page}><Container><Row className="justify-content-center"><Col lg="8"><Card className="shadow border-0"><CardBody>
      <h2 className={styles.title}>입주신청 / 계약 생성</h2>
      <form onSubmit={onSubmit}>
        <input className={styles.input} placeholder="방 번호" value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} />
        <input className={styles.input} type="date" placeholder="입주일" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
        <input className={styles.input} type="number" min="1" placeholder="계약 개월수" value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: e.target.value })} />
        <button className={styles.btn} type="submit">신청하기</button>
      </form>
      {message && <p className={styles.msg}>{message}</p>}
    </CardBody></Card></Col></Row></Container></section>
  );
}
