import { useState } from "react";
import styles from "./SearchFilterPanel.module.css";
import { PropTypes } from 'prop-types';

const OPTION_LIST = ["WiFi", "냉장고", "세탁기", "에어컨", "침대", "책상", "옷장", "TV", "신발장"];

function parseOptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(",").map(v => v.trim()).filter(Boolean);
  }
  return [];
}

SearchFilterPanel.propTypes = {
  cond: PropTypes.shape({
    keyword: PropTypes.string,
    
    minDeposit: PropTypes.number,
    maxDeposit: PropTypes.number,
    minTax: PropTypes.number,
    maxTax: PropTypes.number,

    swLat: PropTypes.number,
    swLng: PropTypes.number,
    neLat: PropTypes.number,
    neLng: PropTypes.number,

    options: PropTypes.string,
    roomRoomCount: PropTypes.number,
    houseElevatorYn: PropTypes.bool,
    housePetYn: PropTypes.bool,
    houseFemaleLimit: PropTypes.bool,
    houseParking: PropTypes.bool,
  }),
};

export default function SearchFilterPanel({
  cond,
  handleCondChange,
  handleOptionsChange,
  clickSearch,
}) {
  const selectedSet = new Set(parseOptions(cond?.options));

  function toggleOption(opt) {
    const next = new Set(selectedSet);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);

    handleOptionsChange({
      target: {
        value: opt,
        checked: next.has(opt),
      },
    });
  }
  
  const [showOptions, setShowOptions] = useState(false);

  function optionChecked(value) {
    const arr = (cond.options || "").split(",").filter(Boolean);
    return arr.includes(value);
  }

  const isJeonse = cond.roomType === "L";
  const isWolse = cond.roomType === "M";

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        clickSearch();
      }}
    >
      {/* 1줄: 핵심 필터들(옵션 제외) */}
      <div className={styles.row}>
        {/* 검색어 */}
        <div className={styles.group}>
          <label className={styles.label}>검색어</label>
          <input
            className={styles.text}
            type="text"
            name="keyword"
            value={cond.keyword}
            onChange={handleCondChange}
            placeholder="지역/건물/방 이름"
          />
          <button className={styles.btn} type="submit">
            검색
          </button>
        </div>

        {/* 거래유형 */}
        <div className={styles.group}>
          <label className={styles.label}>유형</label>
          <select
            className={styles.select}
            name="roomType"
            value={cond.roomType}
            onChange={handleCondChange}
          >
            <option value="L">전세</option>
            <option value="M">월세</option>
          </select>
        </div>

        {/* 보증금 */}
        <div className={styles.group}>
          <label className={styles.label}>보증금</label>
          <div className={styles.range}>
            <input
              className={styles.number}
              type="number"
              name="minDeposit"
              value={cond.minDeposit ?? ""}
              onChange={handleCondChange}
              placeholder="최소"
            />
            <span className={styles.tilde}>~</span>
            <input
              className={styles.number}
              type="number"
              name="maxDeposit"
              value={cond.maxDeposit ?? ""}
              onChange={handleCondChange}
              placeholder="최대"
            />
          </div>
        </div>

        {!isJeonse && (
          <div className={styles.group}>
            <label className={styles.label}>월세</label>
            <div className={styles.range}>
              <input
                className={styles.number}
                type="number"
                name="minTax"
                value={cond.minTax ?? ""}
                onChange={handleCondChange}
                placeholder="최소"
              />
              <span className={styles.tilde}>~</span>
              <input
                className={styles.number}
                type="number"
                name="maxTax"
                value={cond.maxTax ?? ""}
                onChange={handleCondChange}
                placeholder="최대"
              />
            </div>
          </div>
        )}

        {/* 상세필터 토글 버튼 */}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setShowOptions((v) => !v)}
        >
          상세필터 {showOptions ? "▲" : "▼"}
        </button>
      </div>

      {/* 접기/펼치기: 옵션 + 건물 체크 */}
      {showOptions && (
        <div className={styles.advanced}>
          {/* 건물 조건 */}
          <div className={styles.group}>
            <label className={styles.advLabel}>조건</label>
            <div className={styles.checks}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="houseElevatorYn"
                  checked={!!cond.houseElevatorYn}
                  onChange={handleCondChange}
                />
                승강기
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="housePetYn"
                  checked={!!cond.housePetYn}
                  onChange={handleCondChange}
                />
                애완동물
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="houseFemaleLimit"
                  checked={!!cond.houseFemaleLimit}
                  onChange={handleCondChange}
                />
                여성전용
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="houseParking"
                  checked={!!cond.houseParking}
                  onChange={handleCondChange}
                />
                주차가능
              </label>
            </div>
          </div>

          {/* 옵션 */}
          <div className={styles.group}>
            <label className={styles.advLabel}>옵션</label>
            <div className={styles.optionGrid}>
              {OPTION_LIST.map((opt) => (
                <label key={opt} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(opt)}
                    onChange={() => toggleOption(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
