import React from 'react';
import styles from './WishlistTable.module.css';

export default function WishlistTable({ items = [], onDelete }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article key={item.wishNo} className={styles.card}>
          <div className={styles.thumb} />
          <div className={styles.body}>
            <h4 className={styles.title}>{item.title || `매물 #${item.roomNo}`}</h4>
            <p className={styles.meta}>월세 {Number(item.monthlyRent || 0).toLocaleString()}원 · 면적 {item.area || '-'}㎡</p>
            <button type="button" className={styles.deleteBtn} onClick={() => onDelete?.(item.wishNo)}>삭제</button>
          </div>
        </article>
      ))}
    </div>
  );
}
