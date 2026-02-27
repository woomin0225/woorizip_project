// src/features/board/components/EventListItem.jsx
import React from 'react';

export default function EventListItem({ post, onClick }) {
  const banner = post?.bannerImage;

  const imageUrl = banner
    ? `http://localhost:8080/upload/event/banner/${banner.updatedFileName}`
    : null;

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
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
        transition: 'transform 0.15s ease',
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

      {/* 제목 */}
      <div
        style={{
          padding: '12px',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {post.postTitle}
      </div>

      {/* 등록일 */}
      <div
        style={{
          padding: '0 12px 12px 12px',
          fontSize: 13,
          color: '#777',
        }}
      >
        {post.postCreatedAt}
      </div>
    </div>
  );
}
