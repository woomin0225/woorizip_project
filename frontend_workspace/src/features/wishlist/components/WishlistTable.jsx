import React from 'react';
import { Link } from 'react-router-dom';
import styles from './WishlistTable.module.css';

function methodLabel(method) {
  if (method === 'M') return '월세';
  if (method === 'L') return '전세';
  return method ?? '';
}

function formatMoneyKRW(value) {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  const EOK = 100_000_000;
  const MAN = 10_000;
  const eok = Math.floor(n / EOK);
  const rest = n % EOK;
  const man = Math.round(rest / MAN);

  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  return `${Math.round(n / MAN)}만`;
}

function priceText(item) {
  const method = item?.roomMethod;
  const deposit = formatMoneyKRW(item?.roomDeposit);
  const monthly = formatMoneyKRW(item?.roomMonthly);

  if (method === 'M') {
    return [
      deposit ? `보증금 ${deposit}` : null,
      monthly ? `월세 ${monthly}` : null,
    ].filter(Boolean);
  }

  if (method === 'L') {
    return [deposit ? `전세금 ${deposit}` : null].filter(Boolean);
  }

  return [
    deposit ? `보증금 ${deposit}` : null,
    monthly ? `월세 ${monthly}` : null,
  ].filter(Boolean);
}

function occupancyLabel(roomCount) {
  const n = Number(roomCount);
  if (!n || Number.isNaN(n)) return '';
  if (n <= 1) return '1인용';
  if (n === 2) return '2인용';
  return `${n}인용`;
}

function imageUrl(imageName) {
  if (!imageName) return null;
  if (imageName.startsWith('http')) return imageName;
  return `/upload_files/room_image/${imageName}`;
}

export default function WishlistTable({ items = [], onDelete }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <article key={item.wishNo} className={styles.card}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete?.(item.wishNo)}
          >
            삭제
          </button>

          <div className={styles.body}>
            <div className={styles.thumb}>
              {imageUrl(item.imageName) ? (
                <img className={styles.thumbImg} src={imageUrl(item.imageName)} alt="room" />
              ) : (
                <div className={styles.noImage}>Empty</div>
              )}
              <div className={styles.photoCount}>{item.roomImageCount ?? 0}개 사진</div>
            </div>

            <div className={styles.info}>
              <div className={styles.titleRow}>
                <Link className={styles.title} to={`/rooms/${item.roomNo}`}>
                  {item.roomName || `매물 #${item.roomNo}`}
                </Link>
              </div>

              <div className={styles.priceRow}>
                <span className={styles.method}>{methodLabel(item.roomMethod)}</span>
                {priceText(item).map((text) => (
                  <span key={text}>{text}</span>
                ))}
              </div>

              <div className={styles.metaRow}>
                <span>{item.roomArea ?? '-'}㎡</span>
                <span>{item.roomFacing ?? '-'}</span>
                <span>{occupancyLabel(item.roomRoomCount) || '-'}</span>
                <span>{item.roomEmptyYn ? '공실' : '거주중'}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
