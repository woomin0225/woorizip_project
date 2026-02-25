import React from 'react';
import styles from './WishlistGrid.module.css';

export default function WishlistGrid({ items = [] }) {
  return <div className={styles.grid}>{items.map((i) => <div key={i.id || i.wishNo} className={styles.card}>{i.title || '찜 매물'}</div>)}</div>;
}
