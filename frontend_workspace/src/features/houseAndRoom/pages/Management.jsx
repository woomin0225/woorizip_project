// src/features/houseAndRoom/pages/Management.jsx
import { Link } from "react-router-dom";
import styles from "./Management.module.css";

export default function Management() {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>건물/방 관리</h2>

      <div className={styles.grid}>
        <Link className={styles.card} to="/estate/houses/new">
          <div className={styles.cardTitle}>건물 등록</div>
          <div className={styles.cardDesc}>새 건물 정보/사진 등록</div>
        </Link>

        <Link className={styles.card} to="/estate/houses/select">
          <div className={styles.cardTitle}>방 등록</div>
          <div className={styles.cardDesc}>내 건물 선택 후 방 등록</div>
        </Link>

        <Link className={styles.card} to="/estate/modify">
          <div className={styles.cardTitle}>목록조회/수정</div>
          <div className={styles.cardDesc}>등록한 건물/방 수정</div>
        </Link>

        <Link className={styles.card} to="/estate/delete">
          <div className={styles.cardTitle}>삭제</div>
          <div className={styles.cardDesc}>건물/방 삭제</div>
        </Link>
      </div>
    </div>
  );
}