import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ReservationPage.module.css";
import ReservationForm from "../../components/form/ReservationForm";

export default function ReservationFormPage() {
  const { facilityNo, reservationNo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCancel = () => {
    if (location.state?.targetUserNo) {
      navigate('/reservation/view', { state: location.state });
      return;
    }

    navigate(-1);
  };

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <ReservationForm 
          facilityNo={facilityNo}
          reservationNo={reservationNo}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
