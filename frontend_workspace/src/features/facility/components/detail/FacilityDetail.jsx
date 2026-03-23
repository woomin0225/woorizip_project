// src/features/facility/components/detail/FacilityDetail.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacilityDetail } from '../../hooks/facility/useFacilityDetail';
import styles from './Detail.module.css';
import { buildUploadUrl } from '../../../../app/config/env';

export default function FacilityDetail({
  facilityNo,
  owner,
  houseNo,
  onClose,
}) {
  const nav = useNavigate();
  const { facilityDetails, loading, error } = useFacilityDetail(facilityNo);

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            시설 정보를 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            <p>{error.message}</p>
            <button className={styles.inlineBtn} onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!facilityDetails) return null;

  const {
    facilityName,
    facilityLocation,
    facilityCapacity,
    facilityOpenTime,
    facilityCloseTime,
    images,
    displayOptionList,
    facilityRsvnRequiredYn,
    maxRsvnPerDay,
    facilityRsvnUnitMinutes,
    facilityMaxDurationMinutes,
  } = facilityDetails;

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          {images && images.length > 0 && (
            <div className={styles.imageSection}>
              {images.map((img) => (
                <img
                  key={img.facilityImageNo}
                  src={buildUploadUrl(
                    'upload/facility_image',
                    img?.facilityStoredImageName
                  )}
                  alt={facilityName}
                  className={styles.facilityImg}
                />
              ))}
            </div>
          )}

          <div className={styles.infoSection}>
            <div className={styles.headerRow}>
              <h2 className={styles.title}>{facilityName}</h2>
              <p className={styles.subTitle}>
                {facilityLocation} 층 | 수용 인원: {facilityCapacity}명
              </p>
            </div>

            <div className={styles.descBox}>
              <strong>운영 시간:</strong> {facilityOpenTime?.slice(0, 5)} ~{' '}
              {facilityCloseTime?.slice(0, 5)}
              {facilityRsvnRequiredYn && (
                <>
                  <br />
                  <strong>일일 예약 가능 횟수:</strong> {maxRsvnPerDay}회 <br />
                  <strong>예약 단위 시간:</strong> {facilityRsvnUnitMinutes}분{' '}
                  <br />
                  <strong>1회 최대 예약 시간:</strong>{' '}
                  {facilityMaxDurationMinutes / 60}시간
                </>
              )}
            </div>

            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>시설 옵션</h4>
              <div className={styles.optionGrid}>
                {displayOptionList?.map((opt) => (
                  <span key={opt} className={styles.optionBadge}>
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.btnGroup}>
              {owner ? (
                <>
                  <button
                    className={styles.primaryBtn}
                    onClick={() =>
                      nav(`/facility/form/${houseNo}/${facilityNo}`)
                    }
                  >
                    수정하기
                  </button>
                  {facilityRsvnRequiredYn && (
                    <button
                      className={styles.primaryBtn}
                      onClick={() => nav(`/reservation/view/${facilityNo}`)}
                    >
                      예약조회
                    </button>
                  )}
                  {!facilityRsvnRequiredYn && (
                    <button className={styles.primaryBtn} onClick={onClose}>
                      확인
                    </button>
                  )}
                </>
              ) : (
                <>
                  {facilityRsvnRequiredYn ? (
                    <button
                      className={styles.primaryBtn}
                      onClick={() => nav(`/reservation/form/${facilityNo}`)}
                    >
                      예약하기
                    </button>
                  ) : (
                    <button className={styles.primaryBtn} onClick={onClose}>
                      확인
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
