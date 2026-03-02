// 건물 소속 방 미리보기(방 이름만 표시) 누르면 상세보기가 해당 방의 상세보기로 전환됨. 상세보기 페이지 전체의 사이드바 처럼 쓰이는 컴포넌트
// 누르면 이곳의 방이름Item 버튼은 강조표시됨
import styles from './HouseRoomsPreview.module.css';

export default function HouseRoomsPreview({ rooms = [], selectedRoomNo, onSelect }) {
  return (
    <div>
      <div className={styles.title}>방 목록</div>

      <div className={styles.list}>
        {(rooms || []).map((r) => {
          const roomNo = r.roomNo;
          const isSelected = roomNo === selectedRoomNo;
          const isOccupied = r.roomEmptyYn === false;

          return (
            <button
              key={roomNo}
              className={`${styles.item} ${isSelected ? styles.selected : ''} ${isOccupied ? styles.occupied : ''}`}
              onClick={() => onSelect?.(roomNo)}
            >
              <div className={styles.roomName}>{r.roomName ?? roomNo}</div>
              <div className={styles.badge}>{r.roomEmptyYn ? '공실' : '거주중'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}