// src/features/board/pages/event/eventDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import styles from '../notice/NoticeDetail.module.css';
import FileDownloadButton from '../../components/FileDownloadButton';
import AiSummaryPanel from '../../components/AiSummaryPanel';
import { useEventDetail } from '../../hooks/useEventDetail';
import { useBoardSummary } from '../../hooks/useBoardSummary';
import { downloadEventFile } from '../../api/EventApi';

const EDIT_PATH = (postNo) => `/event/${postNo}/edit`;
const LIST_PATH = '/event';

export default function EventDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { isAdmin, event, loading, deleting, error, handleDelete } =
    useEventDetail({ postNo, nav });

  const {
    opened,
    summaryData,
    summaryLoading,
    summaryError,
    loadSummary,
    toggleOpened,
    hasLoaded,
  } = useBoardSummary(postNo);

  if (loading) return <div className={styles.loading}>Loading.....</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!event) return <div className={styles.error}>데이터 없음</div>;

  const title = event.postTitle || '(제목 없음)';
  const writer = event.userName || '-';
  const readCount = event.postViewCount ?? 0;
  const enrollDate = event.postCreatedAt || '-';
  const contentHtml = event.postContent || '';
  const files = event.files || [];
  const banner = event.bannerImage || null;

  const bannerUrl = banner?.updatedFileName
    ? `http://localhost:8080/upload/event/banner/${banner.updatedFileName}`
    : null;

  const isImageFile = (f) => {
    const name = (
      f?.originalFileName ||
      f?.updatedFileName ||
      ''
    ).toLowerCase();
    return (
      (typeof f?.fileType === 'string' && f.fileType.startsWith('image/')) ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.webp')
    );
  };

  const getEventFileUrl = (f) => {
    // 백엔드 정적서빙 경로에 맞춰 필요시만 바꿔주세요
    // (지금 배너처럼 /upload_files/event/... 형태를 쓴다는 가정)
    return `http://localhost:8080/upload/event/${f.updatedFileName}`;
  };

  const imageFiles = files.filter(isImageFile);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {bannerUrl && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
              background: '#fff',
            }}
          >
            <img
              src={bannerUrl}
              alt={title}
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        <div className={styles.card}>
          <h1 className={styles.postTitle}>{title}</h1>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>작성자 {writer}</span>
            <span className={styles.divider}>|</span>
            <span className={styles.metaItem}>등록일 {enrollDate}</span>
            <span className={styles.divider}>|</span>
            <span className={styles.metaItem}>조회수 {readCount}</span>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>첨부파일</h2>

            <div className={styles.sectionBox}>
              {files.length > 0 ? (
                <div className={styles.fileList}>
                  {files.map((f) => (
                    <div
                      key={f.fileNo || f.updatedFileName || f.originalFileName}
                      className={styles.fileItem}
                    >
                      <FileDownloadButton
                        postNo={postNo}
                        file={f}
                        downloadFn={downloadEventFile}
                        className={styles.fileButton}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyText}>첨부파일 없음</div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>내용</h2>

            <div className={styles.contentBox}>
              {imageFiles.length > 0 && (
                <div className={styles.imageList}>
                  {imageFiles.map((f) => (
                    <img
                      key={f.fileNo || f.updatedFileName || f.originalFileName}
                      src={getEventFileUrl(f)}
                      alt={f.originalFileName || '첨부 이미지'}
                      className={styles.contentImage}
                    />
                  ))}
                </div>
              )}

              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </section>

          <div className={styles.summaryWrap}>
            <AiSummaryPanel
              opened={opened}
              hasLoaded={hasLoaded}
              summaryLoading={summaryLoading}
              summaryError={summaryError}
              summaryData={summaryData}
              onLoad={loadSummary}
              onToggle={toggleOpened}
            />
          </div>

          <div className={styles.buttonGroup}>
            <Link to={LIST_PATH} className={styles.button}>
              목록으로
            </Link>

            {isAdmin && (
              <>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => nav(EDIT_PATH(postNo))}
                >
                  수정하기
                </button>

                <button
                  type="button"
                  className={styles.button}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '삭제하기'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
