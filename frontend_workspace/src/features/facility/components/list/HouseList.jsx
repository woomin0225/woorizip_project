// src/features/facility/components/HouseList.jsx
import styles from './HouseList.module.css';

const HouseList = ({ houses, selectedHouseNo, onHouseChange }) => {
  return (
    <div className={styles.filterContainer}>
      <select
        className={styles.selectBox}
        value={selectedHouseNo}
        onChange={(e) => onHouseChange(e.target.value)}
      >
        <option value="">-- 조회하실 건물을 선택하세요 --</option>
        {houses.map((h) => (
          <option key={h.houseNo} value={h.houseNo}>
            {h.houseName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default HouseList;