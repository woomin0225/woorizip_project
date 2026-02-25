import React from 'react';
import styles from './WishlistItemCard.module.css';

export default function WishlistItemCard({ item }) {
  return <div className={styles.card}>{item?.title || '찜 매물'}</div>;
}
