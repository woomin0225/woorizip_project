// src/features/board/pages/qna/QnaDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getApiAssetUrl } from '../../../../app/config/env';
import styles from '../notice/NoticeDetail.module.css';
import FileDownloadButton from '../../components/FileDownloadButton';
import CommentBox from '../../components/CommentBox';
import { useQnaDetail } from '../../hooks/useQnaDetail';
import { downloadQnaFile } from '../../api/QnaApi';

// 라우트가 다르면 여기만 수정
const EDIT_PATH = (postNo) => `/qna/${postNo}/edit`;

export default function QnaDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { qna, loading, deleting, error, isOwner, handleDelete } = useQnaDetail(
    {
      postNo,
      nav,
    }
  );

  if (loading) return <div className={styles.loading}>Loading.....</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!qna) return <div className={styles.error}>데이터 없음</div>;

  const title = qna.postTitle || '(제목 없음)';
  const writer = qna.userName || qna.userNo || '-';
  const readCount = qna.postViewCount ?? 0;
  const enrollDate = qna.postCreatedAt || '-';
  const contentHtml = qna.postContent || '';
  const files = qna.files || [];

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

  const getQnaFileUrl = (f) => {
    return getApiAssetUrl(`/upload/qna/${f.updatedFileName}`);
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
                        downloadFn={downloadQnaFile}
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
                      src={getQnaFileUrl(f)}
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
            <Link to="/qna" className={styles.button}>
              목록으로
            </Link>

            {isOwner && (
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

          {/* 댓글 영역 */}
          <div style={{ marginTop: 40 }}>
            <CommentBox postNo={Number(postNo)} />
          </div>
        </div>
      </div>
    </div>
  );
}
