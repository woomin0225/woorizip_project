// 상세페이지 내에서 해당 방의 옵션 목록(쉼표구분자로 분리해야함)을 아이콘과 함께 나열해줌
import styles from "./RoomOptionList.module.css";

const ICONS = {
  WiFi: "🛜",
  냉장고: "🧊",
  세탁기: "🧺",
  에어컨: "❄️",
  침대: "🛏️",
  책상: "🪑",
  옷장: "🚪",
  TV: "📺",
  신발장: "👟",
};

export default function RoomOptionList({ options }) {
  const arr = Array.isArray(options)
    ? options
    : String(options || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

  if (arr.length === 0) return <div className={styles.empty}>옵션 정보가 없습니다.</div>;

  return (
    <div className={styles.wrap}>
      {arr.map((o) => (
        <div key={o} className={styles.item}>
          <span className={styles.icon}>{ICONS[o] || "✅"}</span>
          <span>{o}</span>
        </div>
      ))}
    </div>
  );
}