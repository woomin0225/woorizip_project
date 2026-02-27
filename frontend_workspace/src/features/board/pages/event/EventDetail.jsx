// src/features/board/pages/event/eventDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEventDetail } from '../../hooks/useEventDetail';
import { downloadEventFile } from '../../api/EventApi';
import FileDownloadButton from '../../components/FileDownloadButton';

export default function EventDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { isAdmin, event, loading, deleting, error, handleDelete } =
    useEventDetail({ postNo, nav });

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;
  if (!event) return <div>데이터가 없습니다.</div>;

  const title = event.postTitle || '(제목 없음)';
  const writer = event.userNo || '';
  const readcount = event.postViewCount ?? 0;
  const enrollDate = event.postCreatedAt || '';
  const contentHtml = event.postContent || '';
  const banner = event.bannerImage;

  const bannerUrl = banner
    ? `http://localhost:8080/upload/event/banner/${banner.updatedFileName}`
    : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 40 }}>이벤트 상세</h2>

      {/* 🔵 제목 */}
      <h3 style={{ marginBottom: 20 }}>{title}</h3>

      {/* 🔵 대표 이미지 */}
      {bannerUrl && (
        <div style={{ marginBottom: 40 }}>
          <img
            src={bannerUrl}
            alt="event banner"
            style={{
              width: '100%',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}

      {/* 🔵 내용 */}
      <div
        style={{
          padding: 20,
          border: '1px solid #ddd',
          minHeight: 200,
          marginBottom: 30,
        }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* 🔵 첨부파일 */}
      {event.files && event.files.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h4>첨부파일</h4>
          {event.files.map((f) => (
            <div key={f.fileNo}>
              <FileDownloadButton
                postNo={postNo}
                file={f}
                downloadFn={downloadEventFile}
              />
            </div>
          ))}
        </div>
      )}

      {/* 🔵 버튼 */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/event" style={{ marginRight: 10 }}>
          목록
        </Link>

        {isAdmin && (
          <>
            <button
              onClick={() => nav(`/event/${postNo}/edit`)}
              style={{ marginRight: 10 }}
            >
              수정
            </button>

            <button onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
