// 상세페이지를 보고 있는 방의 리뷰1행의 상위 컴포넌트. 상위로부터 리뷰 목록 받아서 리뷰 1행씩 반복시킴
import ReviewItem from './ReviewItem';
import styles from './ReviewList.module.css';

function buildPageButtons(current, total) {
  if (total <= 7) return Array.from({ length: total }).map((_, i) => i);
  const start = Math.max(0, current - 3);
  const end = Math.min(total - 1, start + 6);
  const s = Math.max(0, end - 6);
  return Array.from({ length: end - s + 1 }).map((_, i) => s + i);
}

export default function ReviewList({ page, currentUserNo, roomNo, onChangePage }) {
  const content = page?.content ?? [];
  const number = page?.number ?? 0;
  const totalPages = page?.totalPages ?? 1;
  const buttons = buildPageButtons(number, totalPages);

  function go(p) {
    if (!onChangePage) return;
    if (p < 0 || p >= totalPages) return;
    onChangePage(p);
  }

  return (
    <div>
      {content.length === 0 && <div className={styles.empty}>리뷰가 없습니다.</div>}

      {content.map((r) => (
        <ReviewItem
          key={r.reviewNo ?? Math.random()}
          review={r}
          isMine={String(r.userNo ?? '') === String(currentUserNo ?? '')}
          onEdit={() => alert('리뷰 수정 UI는 다음 단계')}
          onDelete={() => alert('리뷰 삭제 연결은 다음 단계')}
        />
      ))}

      <div className={styles.paging}>
        <button onClick={() => go(number - 1)} disabled={number <= 0}>이전</button>

        <div className={styles.pages}>
          {buttons[0] > 0 && (
            <>
              <button className={styles.page} onClick={() => go(0)}>1</button>
              <span className={styles.dots}>…</span>
            </>
          )}

          {buttons.map((p) => (
            <button
              key={p}
              onClick={() => go(p)}
              className={p === number ? styles.active : styles.page}
            >
              {p + 1}
            </button>
          ))}

          {buttons[buttons.length - 1] < totalPages - 1 && (
            <>
              <span className={styles.dots}>…</span>
              <button className={styles.page} onClick={() => go(totalPages - 1)}>{totalPages}</button>
            </>
          )}
        </div>

        <button onClick={() => go(number + 1)} disabled={number >= totalPages - 1}>다음</button>
      </div>
    </div>
  );
}