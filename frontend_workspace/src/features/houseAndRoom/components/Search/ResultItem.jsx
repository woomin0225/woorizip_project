import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildUploadUrl } from '../../../../app/config/env';
import styles from './ResultItem.module.css';

// ===== 표시용 포맷 함수들 =====
function methodLabel(method) {
  if (method === 'M') return '월세';
  if (method === 'L') return '전세';
  return method ?? '';
}

export function formatMoneyKRW(value) {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  const EOK = 100_000_000; // 1억
  const MAN = 10_000; // 1만

  const eok = Math.floor(n / EOK);
  const rest = n % EOK;
  const man = Math.round(rest / MAN);

  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  return `${Math.round(n / MAN)}만`;
}

function priceText(room) {
  const method = room?.roomMethod;
  const deposit = formatMoneyKRW(room?.roomDeposit);
  const monthly = formatMoneyKRW(room?.roomMonthly);
  const depositText = deposit ? `${deposit} 원` : '';
  const monthlyText = monthly ? `${monthly} 원` : '';

  if (method === 'M')
    return `보증금 ${depositText}${monthlyText ? ` / 월세 ${monthlyText}` : ''}`;
  if (method === 'L') return `전세 ${depositText}`;
  return [depositText, monthlyText].filter(Boolean).join(' / ');
}

function occupancyLabel(roomCount) {
  const n = Number(roomCount);
  if (!n || Number.isNaN(n)) return '';
  if (n <= 1) return '1인용';
  if (n === 2) return '2인용';
  return `${n}인용`;
}

export default function ResultItem({
  roomSearchResponse,
  wished = false,
  onToggleWish,
  onHoverHouseChange,
}) {
  // ✅ Hook은 항상 호출되어야 함 (early return 금지)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWished, setIsWished] = useState(!!wished);

  // ✅ roomSearchResponse가 없을 수도 있다고 가정하고
  const room = roomSearchResponse ?? {};

  const houseName = room.houseName;
  const houseAddress = room.houseAddress;

  // ✅ images도 안전하게 (null/undefined 대비)
  const images = useMemo(
    () => (room.imageNames ?? []).filter(Boolean),
    [room.imageNames]
  );
  const total = images.length;

  function prevClick() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }
  function nextClick() {
    setCurrentIndex((i) => Math.min(Math.max(total - 1, 0), i + 1));
  }

  // function toggleWish(e) {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   const next = !isWished;
  //   setIsWished(next);
  //   if (onToggleWish && room.roomNo) onToggleWish(room.roomNo, next);
  // }
  async function toggleWish(e) {
    e.stopPropagation();
    e.preventDefault();

    const next = !isWished;
    setIsWished(next);

    if (!onToggleWish || !room.roomNo) return;
    const ok = await onToggleWish(room.roomNo, next);
    if (!ok) setIsWished(!next);
  }
  function imgUrl(imageName) {
    if (!imageName) return '#';
    if (imageName.startsWith('http')) return imageName;
    return buildUploadUrl('upload/room_image', imageName);
  }

  // ✅ roomSearchResponse가 진짜 없으면 렌더만 비워주기
  if (!roomSearchResponse) return null;

  return (
    <div
      className={styles.card}
      onMouseEnter={() => onHoverHouseChange?.(room.houseNo ?? null)}
      onMouseLeave={() => onHoverHouseChange?.(null)}
    >
      <button className={styles.wishBtn} onClick={toggleWish} aria-label="찜">
        {isWished ? '★' : '☆'}
      </button>

      <div className={styles.body}>
        <div className={styles.thumb}>
          {images.length === 0 ? (
            <div className={styles.noImage}>Empty</div>
          ) : (
            <img
              className={styles.thumbImg}
              src={imgUrl(images[currentIndex])}
              alt="room"
            />
          )}

          {images.length > 1 && (
            <div className={styles.thumbNav}>
              <button
                type="button"
                onClick={prevClick}
                disabled={currentIndex === 0}
              >
                ◀
              </button>
              <button
                type="button"
                onClick={nextClick}
                disabled={currentIndex >= total - 1}
              >
                ▶
              </button>
            </div>
          )}

          <div className={styles.photoCount}>
            {room.roomImageCount ?? images.length}개 사진
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.titleRow}>
            <div className={styles.titleCol}>
              {houseName && <div className={styles.houseName}>{houseName}</div>}
              <Link className={styles.title} to={`/rooms/${room.roomNo}`}>
                {room.roomName}
              </Link>
            </div>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.method}>
              {methodLabel(room.roomMethod)}
            </span>
            <span>{priceText(room)}</span>
          </div>
          <div className={styles.metaRow}>
            <span>{room.roomArea}㎡</span>
            <span>{room.roomFacing}</span>
            <span>{occupancyLabel(room.roomRoomCount)}</span>
            <span>{room.roomEmptyYn ? '공실' : '거주중'}</span>
          </div>
          <div>
            {houseAddress && (
              <span className={styles.houseName}>{houseAddress}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
