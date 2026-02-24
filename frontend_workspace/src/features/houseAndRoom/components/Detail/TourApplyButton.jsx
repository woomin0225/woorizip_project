// 투어 신청하기 버튼 현재 상세 페이지를 보고 있는 방의 투어 신청 페이지로 이동
import { Link } from "react-router-dom";
import styles from "./TourApplyButton.module.css";

export default function TourApplyButton({ roomNo }) {
  const disabled = !roomNo;
  if (disabled) return <button className={styles.btn} disabled>투어신청</button>;

  // 라우트는 나중에 붙일 예정이므로 “뼈대”만
  return (
    <Link to={`/rooms/${roomNo}/tour`} className={styles.link}>
      <button className={styles.btn}>투어신청</button>
    </Link>
  );
}