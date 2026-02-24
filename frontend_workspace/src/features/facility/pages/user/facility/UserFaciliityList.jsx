// src/features/facility/pages/user/facility/UserFacilityList.jsx

import { Container, Row, Col } from 'reactstrap';
import { useFacilityList } from '../../hooks/useFacilityList';
import FacilityList from '../../../components/list/FacilityList';
import styles from './UserFacilityList.module.css';

export default function UserFacilityList() {
  // 데이터와 상태 수신
  const { facilities, loading, error } = useFacilityList();

  // 로딩 중
  if (loading) {
    return (
      <Container className="pt-5 text-center">
        <div className={styles.container}>시설 정보를 불러오고 있습니다.</div>
      </Container>
    );
  }

  // 에러
  if (error) {
    return (
      <Container className="pt-5 text-center">
        <div className={styles.container}>
          {error.message ||
            '시설 목록 조회에 실패하였습니다. 잠시 후 다시 시도하세요.'}
        </div>
      </Container>
    );
  }

  // 시설 목록 조회에 성공하였을 경우
  return (
    <Container fluid className="pt-5">
      <h2 className={styles.title}>공용 시설 목록</h2>
      <FacilityList facilityList={facilities} />
    </Container>
  );
}
