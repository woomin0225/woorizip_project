import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ReservationForm.module.css";
import ReservationForm from "../../components/form/ReservationForm";
import { useReservationForm } from "../../hooks/reservation/useReservationForm"; // 훅 임포트

export default function ReservationFormPage() {
  const { houseNo, facilityNo, reservationNo } = useParams();
  const navigate = useNavigate();

  const { 
    onSubmit: hookSubmit,
    updateMode 
  } = useReservationForm(facilityNo, reservationNo);

  async function onSubmit() {
    await hookSubmit(null, navigate); 
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>
        {updateMode ? "예약 정보 수정" : "시설 이용 예약"}
      </h2>
      
      <ReservationForm 
        facilityNo={facilityNo}
        reservationNo={reservationNo}
        submitText={updateMode ? "수정" : "등록"} 
        onSubmit={onSubmit} 
        onCancel={() => navigate('/facility/view')} 
      />
    </div>
  );
}