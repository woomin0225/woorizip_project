import styles from './HouseInfoCard.module.css';

export default function HouseInfoCard({ house }) {
  if (!house) return <div className={styles.empty}>건물 정보를 불러오지 못했습니다.</div>;

  const parking =
    house.houseParkingMax ??
    (typeof house.houseParking === 'boolean' ? (house.houseParking ? '가능' : '불가') : null) ??
    '-';

  return (
    <div className={styles.wrap}>
      {/* <div>건물명: {house.houseName ?? '-'}</div> */}
      <div>📅 준공년도: {house.houseCompletionYear ?? '-'}</div>

      <div className={styles.fullRow}>
        🏠 주소: {house.houseAddress ?? '-'} {house.houseAddressDetail ?? ''}
      </div>

      <div>↕️ 층수: {house.houseFloors ?? '-'}</div>
      <div>🅿️ 주차: {parking}</div>

      <div>🛗 엘리베이터: {house.houseElevatorYn ? 'O' : 'X'}</div>
      <div>♀️ 여성전용: {house.houseFemaleLimit ? 'O' : 'X'}</div>

      <div>🐾 반려동물: {house.housePetYn ? '가능' : '불가'}</div>
      <div></div>

      <div className={styles.abstractBox}>
        {house.houseAbstract || '소개 내용이 없습니다.'}
      </div>
    </div>
  );
}