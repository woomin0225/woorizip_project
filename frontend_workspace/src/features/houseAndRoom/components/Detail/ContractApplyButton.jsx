// 계약 신청하기 버튼 현재 상세 페이지를 보고 있는 방의 계약 신청 페이지로 이동
import { Link } from "react-router-dom";
import styles from "./ContractApplyButton.module.css";

export default function ContractApplyButton({ roomNo }) {
  const disabled = !roomNo;
  if (disabled) return <button className={styles.btn} disabled>계약신청</button>;

  return (
    <Link to={`/rooms/${roomNo}/contract`} className={styles.link}>
      <button className={styles.btn}>계약신청</button>
    </Link>
  );
}