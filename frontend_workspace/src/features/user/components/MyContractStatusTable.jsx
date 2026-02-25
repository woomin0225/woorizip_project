import React from 'react';
import styles from './MyContractStatusTable.module.css';

export default function MyContractStatusTable({ items = [] }) {
  return <div className={styles.box}>{items.length ? `${items.length}건` : '계약 내역 없음'}</div>;
}
