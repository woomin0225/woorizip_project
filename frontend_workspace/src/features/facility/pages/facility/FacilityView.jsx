// src/features/facility/pages/view/FacilityView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FacilityList from '../../components/list/FacilityList';
import { axiosInstance } from '../../../../app/http/axiosInstance';
import { tokenStore } from '../../../../app/http/tokenStore';
import styles from './FacilityPage.module.css';

export default function FacilityViewPage() {
  const { houseNo } = useParams();
  const [userStatus, setUserStatus] = useState({
    isLessor: null,
    isAdmin: null,
  });
  const token = tokenStore.getAccess();

  useEffect(() => {
    const checkUser = async () => {
      if (!token) {
        setUserStatus({ isLessor: false, isAdmin: false });
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailId = payload.emailId || payload.sub;

        // 1. 토큰 role에서 관리자 여부 확인
        const isAdmin = payload.role === 'ROLE_ADMIN';

        // 2. API 호출로 유저 타입 확인 (임대인/임차인)
        const res = await axiosInstance.get(
          `/api/user/${encodeURIComponent(emailId)}`
        );
        const isLessor = res?.data?.data?.type === 'LESSOR';

        setUserStatus({ isLessor, isAdmin });
      } catch (e) {
        setUserStatus({ isLessor: false, isAdmin: false });
      }
    };
    checkUser();
  }, [token]);

  if (userStatus.isAdmin === null) return null;

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <FacilityList
          isLessor={userStatus.isLessor}
          isAdmin={userStatus.isAdmin}
          houseNo={
            userStatus.isLessor || userStatus.isAdmin ? houseNo || null : null
          }
        />
      </div>
    </div>
  );
}
