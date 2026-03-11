import React from 'react';
import styles from './MyInfoCard.module.css';

export default function MyInfoCard({ info }) {
  return <div className={styles.box}><h4>내 정보</h4><p>{info?.name} / {info?.email} / {info?.phone}</p></div>;
}
