// src/features/facility/pages/lessor/facility/LessorFacilityList.jsx
import { useEffect, useState } from 'react';
import styles from './LessorFacilityList.module.css'; 
import HouseList from '../../../components/list/HouseList';
import FacilityList from '../../../components/list/FacilityList';
import { getMyHouses } from '../../../../houseAndRoom/api/houseApi';
import useFacilityList from '../../../hooks/facility/useFacilityList';

export default function LessorFacilityList() {
  const [houses, setHouses] = useState([]);
  const [selectedHouseNo, setSelectedHouseNo] = useState('');
  const { facilities, loading, error } = useFacilityList(selectedHouseNo);

  useEffect(() => {
    getMyHouses().then((data) => setHouses(data || []));
  }, []);

  if (loading) return <div className={styles.loadingText}>시설 정보를 불러오고 있습니다.</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>공용 시설 목록</h2>

      <HouseList
        houses={houses}
        selectedHouseNo={selectedHouseNo}
        onHouseChange={setSelectedHouseNo}
      />

      <hr className={styles.divider} />

      <FacilityList facilityList={facilities} />
    </div>
  );
}