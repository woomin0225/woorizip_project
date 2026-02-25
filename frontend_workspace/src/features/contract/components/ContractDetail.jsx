import React from 'react';
import styles from './ContractDetail.module.css';

export default function ContractDetail({ contract }) {
  return <div className={styles.box}>{contract?.title || '계약 상세 정보'}</div>;
}
