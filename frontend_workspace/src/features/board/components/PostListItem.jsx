// src/features/board/components/PostListItem.jsx
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
      style={{
        cursor: 'pointer',
        background: isPinned ? '#FFF7CC' : 'transparent',
      }}
      onClick={onClick}
    >
      <td align="center">{post.postNo}</td>

      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasFile && <span>📎</span>}

          {/* 관리자만 핀버튼 */}
          {isAdmin && (
            <button
              type="button"
              onClick={handlePinClick}
              style={{
                border: '1px solid #ddd',
                background: isPinned ? '#FFD84D' : 'white',
                borderRadius: 6,
                padding: '2px 6px',
                cursor: 'pointer',
              }}
              title="상단 고정 코글"
            >
              📌
            </button>
          )}

          <span>{post.postTitle}</span>
        </div>
      </td>

      <td align="center">{post.userNo}</td>
      <td align="center">{post.postCreatedAt}</td>
      <td align="center">{post.postViewCount}</td>
    </tr>
  );
}
