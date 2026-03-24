// src/features/facility/components/list/FacilityList.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacilityList } from '../../hooks/facility/useFacilityList';
import { useHouseList } from '../../hooks/facility/useHouseList';
import Modal from '../../../../shared/components/Modal/Modal';
import FacilityDetail from '../detail/FacilityDetail';
import styles from './List.module.css';

export default function FacilityList({
  isLessor,
  isAdmin,
  targetUserNo,
  houseNo: propsHouseNo,
}) {
  const nav = useNavigate();
  const { houseNo: urlHouseNo } = useParams();
  const currentHouseNo = propsHouseNo || urlHouseNo;
  const [selectedFacilityNo, setSelectedFacilityNo] = useState(null);

  const showHouseSelection = (isLessor || isAdmin) && !currentHouseNo;

  const { houses, loading: hLoading } = useHouseList(
    showHouseSelection,
    targetUserNo
  );
  const { facilities, loading: fLoading } = useFacilityList(currentHouseNo, isLessor || isAdmin);

  if (hLoading || fLoading)
    return <div className={styles.facilityEmpty}>로딩 중...</div>;

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {showHouseSelection ? '건물 선택' : '공용시설'}
        </h2>

        {isAdmin ? (
          <button
            className={styles.primaryBtn}
            onClick={() => nav(`/admin/category`)}
          >
            카테고리 조회
          </button>
        ) : isLessor ? (
          currentHouseNo && (
            <button
              className={styles.primaryBtn}
              onClick={() => nav(`/facility/form/${currentHouseNo}`)}
            >
              + 시설 등록
            </button>
          )
        ) : (
          <button
            className={styles.primaryBtn}
            onClick={() => nav(`/reservation/view`)}
          >
            내 예약 내역
          </button>
        )}
      </div>

      {showHouseSelection ? (
        <div className={styles.facilityContainer}>
          <div className={styles.facilityHeader}>
            <span>관리할 건물을 선택해주세요.</span>
          </div>
          {houses?.map((h) => (
            <div
              key={h.houseNo}
              className={styles.facilityRow}
              onClick={() => nav(`/facility/view/${h.houseNo}`)}
            >
              <div className={styles.oneLine}>
                <strong>{h.houseName}</strong>
              </div>
              <span>&gt;</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.facilityContainer}>
          <div className={styles.facilityHeader}>
            <span>시설 명칭</span>
          </div>
          {facilities?.length > 0 ? (
            facilities.map((f) => (
              <div
                key={f.facilityNo}
                className={styles.facilityRow}
                onClick={() => setSelectedFacilityNo(f.facilityNo)}
              >
                <span className={styles.oneLine}>{f.facilityName}</span>
                <span className={styles.textMuted}>조회 &gt;</span>
              </div>
            ))
          ) : (
            <div className={styles.facilityEmpty}>등록된 시설이 없습니다.</div>
          )}
        </div>
      )}

      {selectedFacilityNo && (
        <Modal onClose={() => setSelectedFacilityNo(null)}>
          <FacilityDetail
            facilityNo={selectedFacilityNo}
            owner={isLessor || isAdmin} // 관리자도 수정/삭제 권한을 가질 수 있게 owner로 취급
            houseNo={currentHouseNo}
            onClose={() => setSelectedFacilityNo(null)}
          />
        </Modal>
      )}
    </div>
  );
}
