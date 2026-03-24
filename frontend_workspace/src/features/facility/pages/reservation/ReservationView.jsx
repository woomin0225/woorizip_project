import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { axiosInstance } from '../../../../app/http/axiosInstance';
import { tokenStore } from '../../../../app/http/tokenStore';
import ReservationList from '../../components/list/ReservationList';
import styles from './ReservationPage.module.css';

export default function ReservationViewPage() {
  const { facilityNo } = useParams();
  const location = useLocation();
  const targetUserNo = location.state?.targetUserNo || null;

  const [isLessor, setIsLessor] = useState(null);
  const token = tokenStore.getAccess();

  useEffect(() => {
    const checkUser = async () => {
      if (!token) {
        setIsLessor(false);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailId = payload.emailId || payload.sub;

        const res = await axiosInstance.get(
          `/api/user/${encodeURIComponent(emailId)}`
        );
        const userType = res?.data?.data?.type;
        console.log('유저 타입 확인:', userType);
        setIsLessor(userType === 'LESSOR');
      } catch (e) {
        console.error('사용자 권한 체크 에러:', e);
        setIsLessor(false);
      }
    };
    checkUser();
  }, [token]);

  if (isLessor === null) {
    return <div className={styles.contentSection}>권한 확인 중...</div>;
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <ReservationList
          facilityNo={isLessor ? facilityNo || null : null}
          targetUserNo={!isLessor ? targetUserNo || null : null}
        />
      </div>
    </div>
  );
}
