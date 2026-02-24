// src/features/board/components/PostListItem.jsx
export default function PostListItem({ post, onClick }) {
  const hasFile = post?.files && post.files.length > 0;

  return (
    <tr style={{ cursor: 'pointer' }} onClick={onClick}>
      <td align="center">{post.postNo}</td>

      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasFile && <span>📎</span>}
          <span>{post.postTitle}</span>
        </div>
      </td>

      <td align="center">{post.userNo}</td>
      <td align="center">{post.postCreatedAt}</td>
      <td align="center">{post.postViewCount}</td>
    </tr>
  );
}
