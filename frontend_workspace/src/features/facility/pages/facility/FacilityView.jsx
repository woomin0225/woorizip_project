import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FacilityList from '../../components/list/FacilityList';
import { axiosInstance } from '../../../../app/http/axiosInstance'; 
import styles from './FacilityPage.module.css';

export default function FacilityViewPage() {
  const { houseNo } = useParams();
  const [isLessor, setIsLessor] = useState(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const checkUser = async () => {
      if (!token) { setIsLessor(false); return; }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailId = payload.emailId || payload.sub;
        
        const res = await axiosInstance.get(`/api/user/${encodeURIComponent(emailId)}`);
        setIsLessor(res?.data?.data?.type === 'LESSOR');
      } catch (e) { 
        setIsLessor(false); 
      }
    };
    checkUser();
  }, [token]);

  if (isLessor === null) return null;

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <FacilityList 
          isLessor={isLessor} 
          houseNo={isLessor ? (houseNo || null) : null} 
        />
      </div>
    </div>
  );
}