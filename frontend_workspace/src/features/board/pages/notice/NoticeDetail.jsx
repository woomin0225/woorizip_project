// src/features/board/pages/notice/NoticeDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getApiAssetUrl } from '../../../../app/config/env';
import styles from './NoticeDetail.module.css';
import FileDownloadButton from '../../components/FileDownloadButton';
import { useNoticeDetail } from '../../hooks/useNoticeDetail';
import { downloadNoticeFile } from '../../api/NoticeApi';

const EDIT_PATH = (postNo) => `/notices/${postNo}/edit`;

export default function NoticeDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { isAdmin, notice, loading, deleting, error, handleDelete } =
    useNoticeDetail({ postNo, nav });

  if (loading) return <div className={styles.loading}>Loading.....</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!notice) return <div className={styles.error}>데이터 없음</div>;

  const title = notice.postTitle || '(제목 없음)';
  const writer = notice.userName || '-';
  const readCount = notice.postViewCount ?? 0;
  const enrollDate = notice.postCreatedAt || '-';
  const contentHtml = notice.postContent || '';
  const files = notice.files || [];

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

  const getNoticeFileUrl = (f) => {
    return getApiAssetUrl(`/upload/notice/${f.updatedFileName}`);
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
                        downloadFn={downloadNoticeFile}
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
                      src={getNoticeFileUrl(f)}
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

          <div className={styles.buttonGroup}>
            <Link to="/notices" className={styles.button}>
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
