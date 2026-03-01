import PropTypes from 'prop-types';
import { Card, CardBody, Row, Col } from 'reactstrap';

EstateRankingList.propTypes = {
    list: PropTypes.array,
}

export default function EstateRankingList({list=[], type}){
    
    return (
        <Card>
            <CardBody>
                <Row>
                    <Col>순위</Col>
                    <Col>정보</Col>
                    <Col>조회수</Col>
                </Row>
                {list?.map((item, index)=>(
                    <Row>
                        <Col>
                            {index+1}
                        </Col>
                        {type==='room' ? 
                            <Col>
                                <div>{item?.houseName || ""}</div>
                                <div>{item?.roomName || ""}</div>
                            </Col>
                            :
                            <Col>
                                <div>{item?.houseName || ""}</div>
                                <div>{item?.houseAddress || ""}</div>
                            </Col>
                        }
                        <Col>
                            {item?.viewCount || ""}
                        </Col>
                    </Row>
                )) || ""}
            </CardBody>
        </Card>
    );
}