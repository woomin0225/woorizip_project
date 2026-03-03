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
}) {
  function searchLatest() {
    onChangeCriterion("LATEST");
  }
  function searchLargest() {
    onChangeCriterion("AREA");
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.sortBar}>
        <button className={styles.sortBtn} onClick={searchLatest} value="LATEST" disabled={criterion === "LATEST"}>최신업데이트순</button>
        <button className={styles.sortBtn} onClick={searchLargest} value="AREA" disabled={criterion === "AREA"}>면적큰순</button>
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
