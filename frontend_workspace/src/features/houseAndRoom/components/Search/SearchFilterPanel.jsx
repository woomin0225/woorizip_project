import { useState } from "react";
import styles from "./SearchFilterPanel.module.css";

export default function SearchFilterPanel({
  cond,
  handleCondChange,
  handleOptionsChange,
  clickSearch,
}) {
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

        {/* 전세금 */}
        <div className={styles.group}>
          <label className={styles.label}>전세금</label>
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

        {/* 월세 */}
        <div className={styles.group}>
          <label className={styles.label}>월세</label>
          <div className={styles.range}>
            <input
              className={styles.number}
              type="number"
              name="minTax"
              disabled={isJeonse}
              value={cond.minTax ?? ""}
              onChange={handleCondChange}
              placeholder="최소"
            />
            <span className={styles.tilde}>~</span>
            <input
              className={styles.number}
              type="number"
              name="maxTax"
              disabled={isJeonse}
              value={cond.maxTax ?? ""}
              onChange={handleCondChange}
              placeholder="최대"
            />
          </div>
        </div>

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
          {/* 옵션 */}
          <div className={styles.group}>
            <label className={styles.advLabel}>옵션</label>
            <div className={styles.checks}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  value="WiFi"
                  checked={optionChecked("WiFi")}
                  onChange={handleOptionsChange}
                />
                WiFi
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  value="냉장고"
                  checked={optionChecked("냉장고")}
                  onChange={handleOptionsChange}
                />
                냉장고
              </label>

              {/* 여기 계속 추가 가능 */}
            </div>
          </div>

          {/* 건물 조건 */}
          <div className={styles.group}>
            <label className={styles.advLabel}>건물</label>
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
        </div>
      )}
    </form>
  );
}