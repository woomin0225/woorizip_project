import { useState } from 'react';
import styles from './HouseRoomsPreview.module.css';

export default function HouseRoomsPreview({
  rooms = [],
  selectedRoomNo,
  onSelect,
  wishMap = {},
  onToggleWish,
  isAuthed = false,
  onRequireLogin,
}) {
  const [pendingRoomNo, setPendingRoomNo] = useState(null);

  async function handleToggleWish(e, roomNo, isWished) {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthed) {
      onRequireLogin?.();
      return;
    }
    if (!onToggleWish || pendingRoomNo === roomNo) return;

    setPendingRoomNo(roomNo);
    try {
      await onToggleWish(roomNo, !isWished);
    } finally {
      setPendingRoomNo(null);
    }
  }

  function handleKeyDown(e, roomNo) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(roomNo);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>방 목록</div>

      <div className={styles.list}>
        {(rooms || []).map((r) => {
          const roomNo = r.roomNo;
          const isSelected = roomNo === selectedRoomNo;
          const isOccupied = r.roomEmptyYn === false;
          const isWished = Boolean(wishMap?.[roomNo]);
          const isPending = pendingRoomNo === roomNo;

          return (
            <div
              key={roomNo}
              className={`${styles.item} ${isSelected ? styles.selected : ''} ${isOccupied ? styles.occupied : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(roomNo)}
              onKeyDown={(e) => handleKeyDown(e, roomNo)}
            >
              <div className={styles.roomName}>{r.roomName ?? roomNo}</div>

              <div className={styles.itemRight}>
                <div className={styles.badge}>{r.roomEmptyYn ? '공실' : '거주중'}</div>
                <button
                  type="button"
                  className={`${styles.wishBtn} ${isWished ? styles.wished : ''}`}
                  onClick={(e) => handleToggleWish(e, roomNo, isWished)}
                  aria-label={isWished ? '찜 해제' : '찜 추가'}
                  disabled={isPending}
                >
                  {isWished ? '★' : '☆'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
