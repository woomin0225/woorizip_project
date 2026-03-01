// src/features/facility/components/list/FacilityList.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacilityList } from '../../hooks/facility/useFacilityList';
import { useHouseList } from '../../hooks/facility/useHouseList';
import FacilityDetail from '../detail/FacilityDetail';
import styles from './List.module.css';

export default function FacilityList() {
  const { houseNo } = useParams();
  const nav = useNavigate();

  const { houses, loading: houseLoading, error: houseError } = useHouseList();

  const {
    facilities,
    loading: facLoading,
    error: facError,
    refresh,
  } = useFacilityList(houseNo);

  const [selectedNo, setSelectedNo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isOwner = !!houses && houses.length >= 0;

  if (houseLoading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>건물 정보 확인 중...</div>
        </div>
      </div>
    );
  }

  if (houseError) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            <p>건물 정보를 불러오지 못했습니다.</p>
            <span className={styles.textMuted}>{houseError.message}</span>
          </div>
        </div>
      </div>
    );
  }

  if (facError) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            <p>{facError.message}</p>
            <button className={styles.secondaryBtn} onClick={refresh}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.headerRow}>
          <h2 className={styles.title}>시설 목록</h2>

          {isOwner && houseNo && (
            <div className={styles.registerBtnSection}>
              <button
                className={styles.primaryBtn}
                onClick={() => nav(`/facility/form/${houseNo}`)}
              >
                + 신규 시설 추가
              </button>
            </div>
          )}
        </div>

        <div className={styles.sectionBlock}>
          {facLoading ? (
            <div className={styles.facilityEmpty}>시설 목록 로딩 중...</div>
          ) : facilities.length === 0 ? (
            <div className={styles.facilityEmpty}>등록된 시설이 없습니다.</div>
          ) : (
            <>
              <div className={styles.facilityHeader}>
                <span>시설 명칭</span>
                <span className={styles.textMuted}>상세보기</span>
              </div>

              {facilities.map((f) => (
                <div
                  key={f.facilityNo}
                  className={styles.facilityRow}
                  onClick={() => {
                    setSelectedNo(f.facilityNo);
                    setModalOpen(true);
                  }}
                >
                  <span className={styles.oneLine}>{f.facilityName}</span>
                  <button className={styles.inlineBtn}>조회</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <FacilityDetail
          facilityNo={selectedNo}
          owner={isOwner}
          onClose={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
