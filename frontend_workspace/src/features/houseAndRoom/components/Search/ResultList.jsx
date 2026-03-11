import ResultItem from "./ResultItem";
import styles from "./ResultList.module.css";

export default function ResultList({
  slice = [],
  criterion,
  onLoadMore,
  onChangeCriterion,
  hasNext,
  loading,
  wishMap,
  onToggleWish,
  isJeonse,
}) {
  function searchLatest() {
    onChangeCriterion("LATEST");
  }
  function searchLargest() {
    onChangeCriterion("AREA");
  }
  function searchLowestDeposit(){
    onChangeCriterion("LOW_DEPOSIT");
  }
  function searchHighestDeposit(){
    onChangeCriterion("HIGH_DEPOSIT");
  }
  function searchLowestTax(){
    onChangeCriterion("LOW_TAX");
  }
  function searchHighestTax(){
    onChangeCriterion("HIGH_TAX");
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.sortBar}>
        <button className={styles.sortBtn} onClick={searchLatest} value="LATEST" disabled={criterion === "LATEST"}>업데이트순</button>
        <button className={styles.sortBtn} onClick={searchLargest} value="AREA" disabled={criterion === "AREA"}>큰 면적</button>
        <button className={styles.sortBtn} onClick={searchLowestDeposit} value="LOW_DEPOSIT" disabled={criterion === "LOW_DEPOSIT"} >낮은 보증금</button>
        <button className={styles.sortBtn} onClick={searchHighestDeposit} value="HIGH_DEPOSIT" disabled={criterion === "HIGH_DEPOSIT"}>높은 보증금</button>
        <button className={styles.sortBtn} onClick={searchLowestTax} value="LOW_TAX" disabled={criterion === "LOW_TAX"} hidden={isJeonse}>낮은 월세</button>
        <button className={styles.sortBtn} onClick={searchHighestTax} value="HIGH_TAX" disabled={criterion === "HIGH_TAX"} hidden={isJeonse}>높은 월세</button>
      </div>

      {slice.map((room) => (
        <ResultItem
          key={room.roomNo}
          roomSearchResponse={room}
          wished={!!wishMap?.[room.roomNo]}
          onToggleWish={onToggleWish}
        />
      ))}

      <div className={styles.loadMore}>
        <button className={styles.loadMoreBtn} onClick={onLoadMore} disabled={!hasNext || loading}>
          {loading ? "불러오는 중..." : (hasNext ? "더보기" : "마지막입니다")}
        </button>
      </div>
    </div>
  );
}
