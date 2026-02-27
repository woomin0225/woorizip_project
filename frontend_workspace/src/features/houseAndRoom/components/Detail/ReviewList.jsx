// 상세페이지를 보고 있는 방의 리뷰1행의 상위 컴포넌트. 상위로부터 리뷰 목록 받아서 리뷰 1행씩 반복시킴
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import styles from "./ReviewList.module.css";

import ReviewItem from "./ReviewItem";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { deleteRoomReview } from "../../api/roomApi"

function buildButtons(current, total) {
  if (total <= 7) return Array.from({ length: total }).map((_, i) => i);
  const start = Math.max(0, current - 3);
  const end = Math.min(total - 1, start + 6);
  const s = Math.max(0, end - 6);
  return Array.from({ length: end - s + 1 }).map((_, i) => s + i);
}

export default function ReviewList({ roomNo, page, currentUserNo, onChangePage, onRefresh }) {
  const content = page?.content ?? [];
  const number = page?.number ?? 0;
  const totalPages = page?.totalPages ?? 1;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState(null);

  const buttons = buildButtons(number, totalPages);

const navigate = useNavigate();

  function go(p) {
    if (!onChangePage) return;
    if (p < 0 || p >= totalPages) return;
    onChangePage(p);
  }

  function requestDelete(review) {
    setTarget(review);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!target) return;
    try {
      await deleteRoomReview(roomNo, target.reviewNo);
      setConfirmOpen(false);
      setTarget(null);
      // ✅ 삭제 후 현재 페이지 재조회(부모 Detail이 getRoomReviews 재호출)
      onRefresh?.();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.title}>리뷰</div>

        <Link to={`/rooms/${roomNo}/reviews/new`} className={styles.writeLink}>
          리뷰 작성
        </Link>
      </div>

      {content.length === 0 && <div className={styles.empty}>리뷰가 없습니다.</div>}

      {content.map((r) => {
        const isMine = String(r.userNo ?? "") === String(currentUserNo ?? "");
        return (
          <ReviewItem
            key={r.reviewNo}
            review={r}
            isMine={isMine}
            onEdit={(r) => {navigate(`/rooms/${roomNo}/reviews/${r.reviewNo}/edit`, {state: {r}})}}
            onDelete={requestDelete}
          />
        );
      })}

      {/* 수정 Link는 ReviewItem에 넣고 싶으면 ReviewItem을 Link 포함으로 바꿔도 됨.
          지금은 “수정” 버튼을 ReviewItem 내부에서 onEdit 호출하도록 되어있으니,
          여기서 onEdit을 Link로 처리할 수 있게 아래처럼 바꾸는 방식 추천: */}
      <div className={styles.note}>
        * 수정은 각 행의 “수정” 버튼을 Link로 바꿔 연결할 예정(라우트 추가 시)
      </div>

      {/* 페이지네이션 */}
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

      <DeleteConfirmModal
        open={confirmOpen}
        title="리뷰 삭제"
        message="정말 삭제할까요?"
        onCancel={() => { setConfirmOpen(false); setTarget(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}