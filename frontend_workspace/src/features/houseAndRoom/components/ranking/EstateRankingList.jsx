import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Card, CardBody, Row, Col } from "reactstrap";
import styles from "./EstateRankingList.module.css";
import woorizipLogo from "../../../../assets/images/logo-muted.png";
import { getRoomReviews } from "../../api/roomApi";
import { getFacilityList } from "../../../facility/api/facilityApi";

const REVIEW_LIMIT = 3;
const FACILITY_LIMIT = 8;

const FACILITY_ICON_MAP = [
  { keys: ["wifi", "\uC640\uC774\uD30C\uC774"], icon: "📶" },
  { keys: ["\uC8FC\uCC28"], icon: "🅿️" },
  { keys: ["\uC138\uD0C1"], icon: "🧺" },
  { keys: ["\uD5EC\uC2A4", "gym", "fitness"], icon: "🏋️" },
  { keys: ["\uC5D8\uB9AC\uBCA0\uC774\uD130", "\uC2B9\uAC15\uAE30"], icon: "🛗" },
  { keys: ["\uCE74\uD398"], icon: "☕" },
  { keys: ["\uC8FC\uBC29"], icon: "🍳" },
  { keys: ["\uB3C5\uC11C", "\uC2A4\uD130\uB514"], icon: "📚" },
  { keys: ["\uB77C\uC6B4\uC9C0", "\uD734\uAC8C"], icon: "🛋️" },
  { keys: ["\uBCF4\uC548", "cctv"], icon: "🛡️" },
  { keys: ["\uD0DD\uBC30"], icon: "📦" },
  { keys: ["\uC218\uC601"], icon: "🏊" },
];

function toStars(rating) {
  const safe = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return `${"\u2605".repeat(safe)}${"\u2606".repeat(5 - safe)}`;
}

function getPageContent(pageLike) {
  if (Array.isArray(pageLike)) return pageLike;
  if (Array.isArray(pageLike?.content)) return pageLike.content;
  return [];
}

function getFacilityItems(res) {
  return Array.isArray(res) ? res : res?.data ?? [];
}

function getFacilityIcon(name) {
  const text = String(name || "");
  const lower = text.toLowerCase();
  const hit = FACILITY_ICON_MAP.find((entry) =>
    entry.keys.some((k) => lower.includes(String(k).toLowerCase()))
  );
  return hit?.icon || "🏢";
}

EstateRankingList.propTypes = {
  list: PropTypes.array,
  type: PropTypes.oneOf(["room", "house"]).isRequired,
};

export default function EstateRankingList({ list = [], type }) {
  const [reviewMap, setReviewMap] = useState({});
  const [facilityMap, setFacilityMap] = useState({});

  const roomNos = useMemo(
    () => Array.from(new Set(list.map((item) => item?.roomNo).filter(Boolean))),
    [list]
  );
  const houseNos = useMemo(
    () => Array.from(new Set(list.map((item) => item?.houseNo).filter(Boolean))),
    [list]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (type !== "room" || roomNos.length === 0) {
        setReviewMap({});
        return;
      }

      const pairs = await Promise.all(
        roomNos.map(async (roomNo) => {
          try {
            const page = await getRoomReviews(roomNo, 0, REVIEW_LIMIT, {
              sort: "reviewCreatedAt,desc",
            });
            return [roomNo, getPageContent(page).slice(0, REVIEW_LIMIT)];
          } catch {
            return [roomNo, []];
          }
        })
      );

      if (!cancelled) setReviewMap(Object.fromEntries(pairs));
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [type, roomNos]);

  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      if (type !== "house" || houseNos.length === 0) {
        setFacilityMap({});
        return;
      }

      const pairs = await Promise.all(
        houseNos.map(async (houseNo) => {
          try {
            const data = await getFacilityList(houseNo);
            return [houseNo, getFacilityItems(data)];
          } catch {
            return [houseNo, []];
          }
        })
      );

      if (!cancelled) setFacilityMap(Object.fromEntries(pairs));
    }

    loadFacilities();
    return () => {
      cancelled = true;
    };
  }, [type, houseNos]);

  return (
    <Card className={styles.card}>
      <CardBody className={styles.cardBody}>
        <Row className={styles.headRow}>
          <Col className={styles.rankCol}>순위</Col>
          <Col className={styles.imageCol}>사진</Col>
          <Col className={styles.infoCol}>정보</Col>
          <Col className={styles.sideCol}>{type === "room" ? "최근 리뷰" : "공용시설"}</Col>
        </Row>

        {list.length === 0 ? (
          <div className={styles.empty}>No ranking data.</div>
        ) : (
          list.map((item, index) => {
            const imageBase = type === "room" ? "room_image" : "house_image";
            const imageSrc = item?.repImageName
              ? `http://localhost:8080/upload/${imageBase}/${item.repImageName}`
              : null;
            const reviews = type === "room" ? reviewMap[item?.roomNo] || [] : [];
            const facilities = type === "house" ? facilityMap[item?.houseNo] || [] : [];
            const visibleFacilities = facilities.slice(0, FACILITY_LIMIT);

            return (
              <Row className={styles.bodyRow} key={item?.roomNo || item?.houseNo || index}>
                <Col className={styles.rankCol}>
                  <span className={styles.rankNumber}>{index + 1}</span>
                </Col>

                <Col className={styles.imageCol}>
                  {imageSrc ? (
                    <img className={styles.repImage} src={imageSrc} alt={`rank-${index + 1}`} />
                  ) : (
                    <div className={styles.imagePlaceholder} aria-hidden="true">
                      <img src={woorizipLogo} alt="" className={styles.placeholderLogo} />
                    </div>
                  )}
                </Col>

                <Col className={styles.infoCol}>
                  {type === "room" ? (
                    item?.roomNo ? (
                      <Link to={`/rooms/${item.roomNo}`} className={styles.infoLink}>
                        <div className={styles.subText}>{item?.houseName || ""}</div>
                        <div className={styles.mainText}>{item?.roomName || ""}</div>
                      </Link>
                    ) : (
                      <>
                        <div className={styles.subText}>{item?.houseName || ""}</div>
                        <div className={styles.mainText}>{item?.roomName || ""}</div>
                      </>
                    )
                  ) : (
                    item?.houseNo ? (
                      <Link to={`/houses/${item.houseNo}`} className={styles.infoLink}>
                        <div className={styles.mainText}>{item?.houseName || ""}</div>
                        <div className={styles.subText}>{item?.houseAddress || ""}</div>
                      </Link>
                    ) : (
                      <>
                        <div className={styles.mainText}>{item?.houseName || ""}</div>
                        <div className={styles.subText}>{item?.houseAddress || ""}</div>
                      </>
                    )
                  )}
                </Col>

                <Col className={styles.sideCol}>
                  {type === "room" ? (
                    reviews.length === 0 ? (
                      <div className={styles.sideEmpty}>리뷰 없음</div>
                    ) : (
                      <ul className={styles.reviewList}>
                        {reviews.map((review, i) => {
                          const content = review?.reviewContent?.trim() || "내용 없음";
                          return (
                            <li className={styles.reviewItem} key={review?.reviewNo || i}>
                              <span className={styles.reviewStars}>{toStars(review?.rating)}</span>
                              <span className={styles.reviewTextWrap}>
                                <span className={styles.reviewText}>"{content}"</span>
                                <span className={styles.reviewTooltip}>"{content}"</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : visibleFacilities.length === 0 ? (
                    <div className={styles.sideEmpty}>시설 정보 없음</div>
                  ) : (
                    <div className={styles.facilityList}>
                      {visibleFacilities.map((facility) => {
                        const name = facility?.facilityName || "시설";
                        return (
                          <span
                            key={facility?.facilityNo || `${item?.houseNo}-${name}`}
                            className={styles.facilityChip}
                            title={name}
                          >
                            <span className={styles.facilityIcon}>{getFacilityIcon(name)}</span>
                            <span className={styles.facilityName}>{name}</span>
                          </span>
                        );
                      })}
                      {facilities.length > FACILITY_LIMIT && (
                        <span className={styles.facilityMore}>+{facilities.length - FACILITY_LIMIT}</span>
                      )}
                    </div>
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
