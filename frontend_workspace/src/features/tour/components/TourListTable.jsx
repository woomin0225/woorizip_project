import React from 'react';
import TourStatusBadge from './TourStatusBadge';
import styles from './TourListTable.module.css';

export default function TourListTable({ items = [] }) {
  return <div className={styles.list}>{items.map((i) => <div key={i.tourNo} className={styles.row}><span>{i.title}</span><TourStatusBadge status={i.status} /></div>)}</div>;
}
