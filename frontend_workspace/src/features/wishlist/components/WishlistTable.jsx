import React from 'react';
import { Link } from 'react-router-dom';
import { toRoomImageUrl } from '../../houseAndRoom/utils/roomImage';
import styles from './WishlistTable.module.css';

function methodLabel(method) {
  if (method === 'M') return '월세';
  if (method === 'L') return '전세';
  return method ?? '매물';
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

function priceSummary(item) {
  const method = item?.roomMethod;
  const deposit = formatMoneyKRW(item?.roomDeposit);
  const monthly = formatMoneyKRW(item?.roomMonthly);

  if (method === 'M') {
    return `${deposit ? `보증금 ${deposit}` : ''}${deposit && monthly ? ' / ' : ''}${
      monthly ? `월세 ${monthly}` : ''
    }`;
  }

  if (method === 'L') {
    return deposit ? `전세금 ${deposit}` : '-';
  }

  return [
    deposit ? `보증금 ${deposit}` : null,
    monthly ? `월세 ${monthly}` : null,
  ]
    .filter(Boolean)
    .join(' / ');
}

function occupancyLabel(roomCount) {
  const n = Number(roomCount);
  if (!n || Number.isNaN(n)) return '';
  if (n <= 1) return '1인용';
  if (n === 2) return '2인용';
  return `${n}인용`;
}

function statusLabel(emptyYn) {
  if (emptyYn === null || emptyYn === undefined) return '상태 확인 필요';
  return emptyYn ? '즉시 입주 가능' : '현재 거주중';
}

function imageUrl(imageName) {
  return toRoomImageUrl(imageName);
}

export default function WishlistTable({ items = [], onDelete }) {
  return (
    <div className={styles.list}>
      {items.map((item) => {
        const imageSrc = imageUrl(item.imageName);
        return (
          <article key={item.wishNo} className={styles.card}>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => onDelete?.(item.wishNo)}
              aria-label={`${item.roomName || `매물 ${item.roomNo}`} 찜 삭제`}
            >
              삭제
            </button>

            <div className={styles.body}>
              <Link className={styles.thumbLink} to={`/rooms/${item.roomNo}`}>
                <div className={styles.thumb}>
                  {imageSrc ? (
                    <img
                      className={styles.thumbImg}
                      src={imageSrc}
                      alt={item.roomName || '찜한 방 이미지'}
                    />
                  ) : (
                    <div className={styles.noImage}>이미지 없음</div>
                  )}
                </div>
              </Link>

              <div className={styles.info}>
                <div className={styles.topRow}>
                  <span className={styles.methodBadge}>
                    {methodLabel(item.roomMethod)}
                  </span>
                  <span className={styles.statusText}>
                    {statusLabel(item.roomEmptyYn)}
                  </span>
                </div>

                <Link className={styles.title} to={`/rooms/${item.roomNo}`}>
                  {item.roomName || `매물 #${item.roomNo}`}
                </Link>

                <p className={styles.priceText}>{priceSummary(item) || '-'}</p>

                <div className={styles.metaRow}>
                  <span className={styles.metaChip}>{item.roomArea ?? '-'}㎡</span>
                  <span className={styles.metaChip}>{item.roomFacing ?? '-'}</span>
                  <span className={styles.metaChip}>
                    {occupancyLabel(item.roomRoomCount) || '-'}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
