import React from 'react';
import styles from './StepHeader.module.css';

export default function StepHeader({ title }) {
  return <h3 className={styles.title}>{title || '계약 단계'}</h3>;
}
