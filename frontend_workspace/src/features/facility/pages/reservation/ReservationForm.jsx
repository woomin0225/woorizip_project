import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ReservationPage.module.css";
import ReservationForm from "../../components/form/ReservationForm";

export default function ReservationFormPage() {
  const { facilityNo, reservationNo } = useParams();
  const navigate = useNavigate();

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <ReservationForm 
          facilityNo={facilityNo}
          reservationNo={reservationNo}
          onCancel={() => navigate(-1)} 
        />
      </div>
    </div>
  );
}