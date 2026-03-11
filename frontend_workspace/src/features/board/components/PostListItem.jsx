// src/features/board/components/PostListItem.jsx
import styles from './PostListItem.module.css';

export default function PostListItem({ post, onClick, isAdmin, onTogglePin }) {
  const hasFile = post?.files && post.files.length > 0;

  const isPinned = Boolean(post?.postPinnedYn);

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (!onTogglePin) return;
    onTogglePin(post.postNo);
  };

  return (
    <tr
      className={`${styles.row} ${isPinned ? styles.pinned : ''}`}
      onClick={onClick}
    >
      <td className={styles.center}>{post.postNo}</td>

      <td>
        <div className={styles.titleCell}>
          {hasFile && <span>📎</span>}

          {isAdmin && typeof onTogglePin === 'function' && (
            <button
              type="button"
              onClick={handlePinClick}
              className={`${styles.pinBtn} ${isPinned ? styles.pinBtnPinned : ''}`}
              title="상단 고정 토글"
            >
              📌
            </button>
          )}

          <span>{post.postTitle}</span>
        </div>
      </td>

      <td className={styles.center}>{post.userName}</td>
      <td className={styles.center}>{post.postCreatedAt}</td>
      <td className={styles.center}>{post.postViewCount}</td>
    </tr>
  );
}
