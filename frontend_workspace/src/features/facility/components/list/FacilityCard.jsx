// src/features/facility/components/FacilityCards.jsx

import React from "react";
import { Button } from "reactstrap";
import { Link } from "react-router-dom";
import styles from "./Card.module.css"

class FacilityCard extends React.Component {
  render() {
    const { facility } = this.props;

    const pathParts = window.location.pathname.split("/");
    const role = pathParts[1];

    return (
      <>
      <div className={styles.facilityList}>
        <Link to={`/${role}/facilities/detail/${facility.facilityNo}`}>
          <Button className="LinkToDetail">
            {facility.facilityName}
          </Button>
        </Link>
      </div>
      </>
    );
  }
}

export default FacilityCard;