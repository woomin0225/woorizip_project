import React from 'react';
import styles from './MyTourStatusTable.module.css';

export default function MyTourStatusTable({ items = [] }) {
  return <div className={styles.box}>{items.length ? `${items.length}건` : '신청 내역 없음'}</div>;
}
