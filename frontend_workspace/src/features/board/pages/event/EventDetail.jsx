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
    ? `/upload/event/banner/${banner.updatedFileName}`
    : null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>이벤트 상세</h2>

      {/* 배너 이미지 */}
      {bannerUrl && (
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src={bannerUrl}
            alt="event banner"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      )}

      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          <tr>
            <th width="20%">제목</th>
            <td>{title}</td>
          </tr>
          <tr>
            <th>작성자</th>
            <td>{writer}</td>
          </tr>
          <tr>
            <th>조회수</th>
            <td>{readcount}</td>
          </tr>
          <tr>
            <th>등록일</th>
            <td>{enrollDate}</td>
          </tr>
          <tr>
            <th>내용</th>
            <td dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </tr>
          <tr>
            <th>첨부파일</th>
            <td>
              {event.files && event.files.length > 0
                ? event.files.map((f) => (
                    <div key={f.fileNo}>
                      <FileDownloadButton
                        postNo={postNo}
                        file={f}
                        downloadFn={downloadEventFile}
                      />
                    </div>
                  ))
                : '첨부파일이 없습니다.'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link to="/event" style={{ marginRight: 10 }}>
          목록으로
        </Link>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => nav(`/event/${postNo}/edit`)}
              style={{ marginRight: 10 }}
            >
              수정
            </button>

            <button type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
