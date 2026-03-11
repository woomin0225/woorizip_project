import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, CardBody, Row, Col } from 'reactstrap';
import styles from './ViewsRankingList.module.css';
import woorizipLogo from '../../../../assets/images/logo-muted.png';

WishRankingList.propTypes = {
  list: PropTypes.array,
};

export default function WishRankingList({ list = [] }) {
  return (
    <Card className={styles.card}>
      <CardBody className={styles.cardBody}>
        <Row className={styles.headRow}>
          <Col className={styles.rankCol}>순위</Col>
          <Col className={styles.imageCol}>사진</Col>
          <Col className={styles.infoCol}>방</Col>
          <Col className={styles.sideCol}>찜 / 조회수</Col>
        </Row>

        {list.length === 0 ? (
          <div className={styles.empty}>No ranking data.</div>
        ) : (
          list.map((item, index) => {
            const imageSrc = item?.repImageName
              ? `http://localhost:8080/upload/room_image/${item.repImageName}`
              : null;
            const wishCount = Number(item?.wishCount);
            const viewCount = Number(item?.viewCount);
            const hasWishCount = Number.isFinite(wishCount);
            const hasViewCount = Number.isFinite(viewCount);

            return (
              <Row className={styles.bodyRow} key={item?.roomNo || index}>
                <Col className={styles.rankCol}>
                  <span className={styles.rankNumber}>{index + 1}</span>
                </Col>

                <Col className={styles.imageCol}>
                  {imageSrc ? (
                    <img
                      className={styles.repImage}
                      src={imageSrc}
                      alt={`rank-${index + 1}`}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder} aria-hidden="true">
                      <img
                        src={woorizipLogo}
                        alt=""
                        className={styles.placeholderLogo}
                      />
                    </div>
                  )}
                </Col>

                <Col className={styles.infoCol}>
                  {item?.roomNo ? (
                    <Link to={`/rooms/${item.roomNo}`} className={styles.infoLink}>
                      <div className={styles.subText}>{item?.houseName || ''}</div>
                      <div className={styles.mainText}>{item?.roomName || ''}</div>
                    </Link>
                  ) : (
                    <>
                      <div className={styles.subText}>{item?.houseName || ''}</div>
                      <div className={styles.mainText}>{item?.roomName || ''}</div>
                    </>
                  )}
                </Col>

                <Col className={styles.sideCol}>
                  {hasWishCount ? (
                    <>
                      <div className={styles.mainText}>{`찜 ${wishCount}`}</div>
                      <div className={styles.subText}>
                        {hasViewCount ? `조회수 ${viewCount}` : '조회수 -'}
                      </div>
                    </>
                  ) : (
                    <div className={styles.sideEmpty}>No wish data</div>
                  )}
                </Col>
              </Row>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
