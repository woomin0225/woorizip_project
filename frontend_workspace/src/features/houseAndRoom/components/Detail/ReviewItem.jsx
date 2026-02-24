// 상세페이지 보고 있는 방의 리뷰 1행. 본인 리뷰에는 수정/삭제 버튼이 있음
import styles from './ReviewItem.module.css';

function stars(n) {
  const x = Number(n || 0);
  return '★'.repeat(x) + '☆'.repeat(Math.max(0, 5 - x));
}

export default function ReviewItem({ review, isMine, onEdit, onDelete }) {
  const rating = review?.rating ?? 0;
  const content = review?.reviewContent ?? '';
  const createdAt = review?.reviewCreatedAt ?? '';
  const userNo = review?.userNo ?? '';

  return (
    <div className={styles.row}>
      <div className={styles.top}>
        <div className={styles.stars}>{stars(rating)}</div>
        <div className={styles.meta}>
          <span>{userNo}</span>
          <span>{createdAt}</span>
        </div>

        {isMine && (
          <div className={styles.actions}>
            <button onClick={() => onEdit?.(review)}>수정</button>
            <button onClick={() => onDelete?.(review)}>삭제</button>
          </div>
        )}
      </div>

      <div className={styles.content}>{content}</div>
    </div>
  );
}