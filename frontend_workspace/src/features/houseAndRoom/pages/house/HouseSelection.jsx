// 관리 - 방 등록 -> 어느 건물에 방을 등록할지 선택하는 페이지
// src/features/houseAndRoom/pages/house/HouseSelection.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./HouseSelection.module.css";
import ScrollToTopButton from "../../../../shared/components/ScrollToTopButton";

import { getMyHouses } from "../../api/houseApi";

export default function HouseSelection() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyHouses();
        setHouses(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>방 등록 - 건물 선택</h2>

      {loading && <div className={styles.empty}>불러오는 중…</div>}

      {!loading && houses.length === 0 && (
        <div className={styles.empty}>
          등록된 건물이 없습니다. 먼저 건물을 등록해주세요.
          <div style={{ marginTop: 10 }}>
            <Link to="/estate/houses/new" className={styles.linkBtn}>건물 등록하러 가기</Link>
          </div>
        </div>
      )}

      {houses.length > 0 && (
        <div className={styles.list}>
          {houses.map((h) => (
            <div className={styles.card} key={h.houseNo}>
              <div className={styles.name}>{h.houseName || h.houseNo}</div>
              <div className={styles.addr}>{h.houseAddress ?? ""} {h.houseAddressDetail ?? ""}</div>

              <Link className={styles.selectBtn} to={`/estate/houses/${h.houseNo}/rooms/new`}>
                이 건물에 방 등록
              </Link>
            </div>
          ))}
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}
