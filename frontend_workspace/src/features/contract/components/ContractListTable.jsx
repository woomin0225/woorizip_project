import React from 'react';
import styles from './ContractListTable.module.css';

export default function ContractListTable({ items = [] }) {
  return <div className={styles.list}>{items.map((i) => <div key={i.contractNo} className={styles.row}>{i.title}</div>)}</div>;
}
