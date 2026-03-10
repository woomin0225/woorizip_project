// src/features/board/pages/Information/InformationDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import styles from '../notice/NoticeDetail.module.css';
import FileDownloadButton from '../../components/FileDownloadButton';
import AiSummaryPanel from '../../components/AiSummaryPanel';
import { useInformationDetail } from '../../hooks/useInformationDetail';
import { useBoardSummary } from '../../hooks/useBoardSummary';
import { downloadInformationFile } from '../../api/InformationApi';

// 라우트가 다르면 여기만 수정
const EDIT_PATH = (postNo) => `/information/${postNo}/edit`;

export default function InformationDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { isAdmin, information, loading, deleting, error, handleDelete } =
    useInformationDetail({ postNo, nav });

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
  if (!information) return <div className={styles.error}>데이터 없음</div>;

  const title = information.postTitle || '(제목 없음)';
  const writer = information.userName || information.userNo || '-';
  const readCount = information.postViewCount ?? 0;
  const enrollDate = information.postCreatedAt || '-';
  const contentHtml = information.postContent || '';
  const files = information.files || [];

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

  const getInformationFileUrl = (f) => {
    // 백엔드 정적서빙 경로에 맞춰 필요시만 바꿔주세요
    // (지금 배너처럼 /upload_files/information/... 형태를 쓴다는 가정)
    return `http://localhost:8080/upload/information/${f.updatedFileName}`;
  };

  const imageFiles = files.filter(isImageFile);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
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
                        downloadFn={downloadInformationFile}
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
                      src={getInformationFileUrl(f)}
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
            <Link to="/information" className={styles.button}>
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
