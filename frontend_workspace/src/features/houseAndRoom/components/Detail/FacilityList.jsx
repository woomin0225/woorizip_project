import { useEffect, useState } from "react";
import styles from "./FacilityList.module.css";
import { fetchFacilityList } from "../../../facility/api/facility";

export default function FacilityList({ houseNo }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!houseNo) return;
    (async () => {
      try {
        const data = await fetchFacilityList(houseNo);
        // fetchFacilityList는 data를 그대로 반환하므로 배열이면 그대로, 아니면 data.data 방어
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setItems(list);
      } catch {
        setItems([]);
      }
    })();
  }, [houseNo]);

  if (!houseNo) return <div className={styles.empty}>건물 정보가 없습니다.</div>;

  return (
    <div className={styles.wrap}>
      {items.length === 0 && <div className={styles.empty}>공용시설 정보가 없습니다.</div>}
      {items.map((f) => (
        <span key={f.facilityNo || f.facilityName} className={styles.chip}>
          {f.facilityName}
        </span>
      ))}
    </div>
  );
}