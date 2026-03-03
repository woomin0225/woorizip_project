import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacilityList } from '../../hooks/facility/useFacilityList';
import { useHouseList } from '../../hooks/facility/useHouseList';
import Modal from '../../../../shared/components/Modal/Modal';
import FacilityDetail from '../detail/FacilityDetail';
import styles from './List.module.css';

export default function FacilityList({ isLessor, houseNo: propsHouseNo }) {
  const nav = useNavigate();
  const { houseNo: urlHouseNo } = useParams();
  const currentHouseNo = propsHouseNo || urlHouseNo;
  const [selectedFacilityNo, setSelectedFacilityNo] = useState(null);
  const { houses, loading: hLoading } = useHouseList(
    isLessor && !currentHouseNo
  );
  const { facilities, loading: fLoading } = useFacilityList(
    currentHouseNo,
    isLessor
  );

  if (hLoading || fLoading)
    return <div className={styles.facilityEmpty}>건물 정보 로딩 중...</div>;

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {!currentHouseNo ? '건물 선택' : '공용시설 관리'}
        </h2>

        {isLessor && currentHouseNo && (
          <div className={styles.registerBtnSection}>
            <button
              className={styles.primaryBtn}
              onClick={() => nav(`/facility/form/${currentHouseNo}`)}
            >
              + 시설 등록
            </button>
          </div>
        )}
      </div>

      {!currentHouseNo ? (
        <div className={styles.surveyBox}>
          <p className={styles.surveyTitle}>
            관리할 건물을 리스트에서 선택해주세요.
          </p>
          {Array.isArray(houses) && houses.length > 0 ? (
            houses.map((h) => (
              <div
                key={h.houseNo}
                className={styles.facilityRow}
                onClick={() => nav(`/facility/view/${h.houseNo}`)}
              >
                <div className={styles.oneLine}>
                  <strong>{h.houseName}</strong>
                  <span className={styles.textMuted}> (No. {h.houseNo})</span>
                </div>
                <span className={styles.textMuted}>&gt;</span>
              </div>
            ))
          ) : (
            <div className={styles.facilityEmpty}>등록된 건물이 없습니다.</div>
          )}
        </div>
      ) : (
        <div className={styles.facilityContainer}>
          <div className={styles.facilityHeader}>
            <span>시설 명칭</span>
            <span className={styles.textMuted}>상세보기</span>
          </div>
          {Array.isArray(facilities) && facilities.length > 0 ? (
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
          owner={isLessor}
          houseNo={currentHouseNo} />
        </Modal>
      )}
    </div>
  );
}
