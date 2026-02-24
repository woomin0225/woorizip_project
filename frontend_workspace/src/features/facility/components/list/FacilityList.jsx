// src/features/facility/components/FacilityList.jsx

import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import FacilityCard from './FacilityCard';

class FacilityListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      facilityList: [] 
    };
  }

  render() {
    const { facilityList } = this.state;

    return (
      <Container fluid className="pt-5">
        <Row>
          {facilityList.map((facility) => (
            <Col md="4" key={facility.facilityNo} className="mb-4">
              <FacilityCard facility={facility} />
            </Col>
          ))}
        </Row>
      </Container>
    );
  }
}

export default FacilityListPage;

