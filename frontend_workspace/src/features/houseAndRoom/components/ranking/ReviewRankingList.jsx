import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, CardBody, Row, Col } from 'reactstrap';
import styles from './ViewsRankingList.module.css';
import woorizipLogo from '../../../../assets/images/logo-muted.png';
import { toRoomImageUrl } from '../../utils/roomImage';

function toStars(rating) {
  const safe = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
}

ReviewRankingList.propTypes = {
  list: PropTypes.array,
};

export default function ReviewRankingList({ list = [] }) {
  return (
    <Card className={styles.card}>
      <CardBody className={styles.cardBody}>
        <Row className={styles.headRow}>
          <Col className={styles.rankCol}>순위</Col>
          <Col className={styles.imageCol}>사진</Col>
          <Col className={styles.infoCol}>방</Col>
          <Col className={styles.sideCol}>평균 점수</Col>
        </Row>

        {list.length === 0 ? (
          <div className={styles.empty}>No ranking data.</div>
        ) : (
          list.map((item, index) => {
            const imageSrc = item?.repImageName
              ? toRoomImageUrl(item.repImageName)
              : null;

            const avgRating = Number(item?.avgRating);
            const hasRating = Number.isFinite(avgRating);

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
                    <Link
                      to={`/rooms/${item.roomNo}`}
                      className={styles.infoLink}
                    >
                      <div className={styles.subText}>
                        {item?.houseName || ''}
                      </div>
                      <div className={styles.mainText}>
                        {item?.roomName || ''}
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className={styles.subText}>
                        {item?.houseName || ''}
                      </div>
                      <div className={styles.mainText}>
                        {item?.roomName || ''}
                      </div>
                    </>
                  )}
                </Col>

                <Col className={styles.sideCol}>
                  {hasRating ? (
                    <>
                      <div className={styles.mainText}>
                        {toStars(avgRating)}
                      </div>
                      <div
                        className={styles.subText}
                      >{`${avgRating.toFixed(1)} / 5`}</div>
                    </>
                  ) : (
                    <div className={styles.sideEmpty}>점수 없음</div>
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
