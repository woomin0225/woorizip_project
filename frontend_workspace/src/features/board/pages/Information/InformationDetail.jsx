// src/features/board/pages/Information/InformationDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import styles from '../notice/NoticeDtail.module.css'; //동일 CSS 재사용
import FileDownloadButton from '../../components/FileDownloadButton';
import { useInformationDetail } from '../../hooks/useInformationDetail';
import { downloadInformationFile } from '../../api/InformationApi';

// 라우트가 다르면 여기만 수정
const EDIT_PATH = (postNo) => `/information/${postNo}/edit`;

export default function InformationDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { isAdmin, information, loading, deleting, error, handleDelete } =
    useInformationDetail({ postNo, nav });

  if (loading) return <div className={styles.loading}>Loading.....</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!information) return <div className={styles.error}>데이터 없음</div>;

  const title = information.postTitle || '(제목 없음)';
  const writer = information.userNo || '';
  const readCount = information.postViewCount ?? 0;
  const enrollDate = information.postCreatedAt || '';
  const content = information.postContent || '';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>정책・정보 게시글 상세</h2>

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
            <td dangerouslySetInnerHTML={{ __html: content }} />
          </tr>
          <tr>
            <th>첨부파일</th>
            <td>
              {information.files && information.files.length > 0
                ? information.files.map((f) => (
                    <div key={f.fileNo}>
                      <FileDownloadButton
                        postNo={postNo}
                        file={f}
                        downloadFn={downloadInformationFile}
                      />
                    </div>
                  ))
                : '없음'}
            </td>
          </tr>
        </tbody>
      </table>

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
  );
}
