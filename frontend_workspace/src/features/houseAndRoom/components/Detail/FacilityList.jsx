import { useEffect, useState } from "react";
import styles from "./FacilityList.module.css";
import { getFacilityList } from "../../../facility/api/facilityApi";
import { getFacilityIcon } from "../../constants/facilityIcons";
export default function FacilityList({ houseNo }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!houseNo) return;
    (async () => {
      try {
        const data = await getFacilityList(houseNo);
        // getFacilityList data를 그대로 반환하므로 배열이면 그대로, 아니면 data.data 방어
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
      {items.map((f) => {
        const name = f?.facilityName || '시설';
        return (
          <span key={f?.facilityNo || name} className={styles.chip} title={name}>
            <span className={styles.chipIcon}>{getFacilityIcon(name)}</span>
            <span className={styles.chipName}>{name}</span>
          </span>
        );
      })}
    </div>
  );
}
