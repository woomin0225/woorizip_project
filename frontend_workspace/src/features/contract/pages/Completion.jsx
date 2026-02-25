import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import styles from './Completion.module.css';

export default function Completion() {
  return (
    <section className={styles.page}><Container><Row className="justify-content-center"><Col lg="8"><Card className="shadow border-0"><CardBody>
      <h2 className={styles.title}>전자계약 / 결제 완료</h2>
      <p className={styles.desc}>결제가 완료되었습니다. 마이페이지에서 계약 상태를 확인할 수 있습니다.</p>
    </CardBody></Card></Col></Row></Container></section>
  );
}
