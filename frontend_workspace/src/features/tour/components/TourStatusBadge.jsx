import React from 'react';
import styles from './TourStatusBadge.module.css';

export default function TourStatusBadge({ status }) {
  return <span className={styles.badge}>{status || '검토중'}</span>;
}
