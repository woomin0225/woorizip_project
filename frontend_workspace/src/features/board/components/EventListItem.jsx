// src/features/board/components/EventListItem.jsx
import React from 'react';

export default function EventListItem({
  post,
  onClick,
  isAdmin = false,
  onToggleVisibility,
  toggling = false,
}) {
  const banner = post?.bannerImage;
  const isVisible = post?.postVisibleYn !== false;

  const imageUrl = banner
    ? `http://localhost:8080/upload/event/banner/${banner.updatedFileName}`
    : null;

  const handleToggleClick = (event) => {
    event.stopPropagation();
    onToggleVisibility?.(post.postNo);
  };

  return (
    <div
      onClick={onClick}
      style={{
        width: 260,
        border: '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#fff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.15s ease',
        opacity: isVisible ? 1 : 0.72,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {/* 배너 이미지 */}
      <div
        style={{
          width: '100%',
          height: 160,
          background: '#f3f3f3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="event banner"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ color: '#999' }}>이미지 없음</span>
        )}
      </div>

      <div
        style={{
          padding: '12px',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {post.postTitle}
      </div>

      <div
        style={{
          padding: '0 12px 12px 12px',
          fontSize: 13,
          color: '#777',
        }}
      >
        {post.postCreatedAt}
      </div>

      {isAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '0 12px 12px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 28,
              padding: '0 10px',
              borderRadius: 999,
              background: isVisible ? '#e8f7ee' : '#fff1f0',
              color: isVisible ? '#1f7a45' : '#b42318',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {isVisible ? '노출중' : '숨김'}
          </span>

          <button
            type="button"
            onClick={handleToggleClick}
            disabled={toggling}
            style={{
              height: 30,
              padding: '0 12px',
              border: '1px solid #d9b59d',
              background: '#fff8f4',
              color: '#8a4c2d',
              borderRadius: 999,
              cursor: toggling ? 'default' : 'pointer',
              fontSize: 12,
              fontWeight: 700,
              opacity: toggling ? 0.6 : 1,
            }}
          >
            {toggling ? '변경 중...' : isVisible ? '숨기기' : '노출하기'}
          </button>
        </div>
      )}
    </div>
  );
}
