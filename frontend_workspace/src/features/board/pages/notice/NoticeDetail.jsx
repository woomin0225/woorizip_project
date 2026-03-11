// src/features/board/pages/notice/NoticeDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import styles from './NoticeDetail.module.css';
import FileDownloadButton from '../../components/FileDownloadButton';
import { useNoticeDetail } from '../../hooks/useNoticeDetail';
import { downloadNoticeFile } from '../../api/NoticeApi';

// 라우트가 다르면 여기만 수정
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
  const writer = notice.userNo || '';
  const readCount = notice.postViewCount ?? 0;
  const enrollDate = notice.postCreatedAt || '';
  const contentHtml = notice.postContent || '';

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
    // 백엔드 정적서빙 경로에 맞춰 필요시만 바꿔주세요
    // (지금 배너처럼 /upload_files/notice/... 형태를 쓴다는 가정)
    return `http://localhost:8080/upload/notice/${f.updatedFileName}`;
  };

  const imagesHtml = (notice?.files || [])
    .filter(isImageFile)
    .map(
      (f) =>
        `<div style="margin-top:12px;">
         <img src="${getNoticeFileUrl(f)}"
              alt="${f.originalFileName || '첨부 이미지'}"
              style="max-width:100%; height:auto; display:block; margin-top:12px; border-radius:6px;" />
       </div>`
    )
    .join('');

  const finalHtml = `${imagesHtml}${contentHtml || ''}`;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>공지사항 게시글 상세</h2>

      <table className={styles.table}>
        <tbody>
          <tr>
            <th>제목</th>
            <td>{title}</td>
          </tr>
          <tr>
            <th>작성자</th>
            <td>{writer}</td>
          </tr>
          <tr>
            <th>조회수</th>
            <td>{readCount}</td>
          </tr>
          <tr>
            <th>등록일</th>
            <td>{enrollDate}</td>
          </tr>
          <tr>
            <th>내용</th>
            <td dangerouslySetInnerHTML={{ __html: finalHtml }} />
          </tr>
          <tr>
            <th>첨부파일</th>
            <td>
              {notice.files && notice.files.length > 0
                ? notice.files.map((f) => (
                    <div key={f.fileNo}>
                      <FileDownloadButton
                        postNo={postNo}
                        file={f}
                        downloadFn={downloadNoticeFile}
                      />
                    </div>
                  ))
                : '없음'}
            </td>
          </tr>
        </tbody>
      </table>

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
  );
}
