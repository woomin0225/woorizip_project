// src/features/board/pages/qna/QnaDetail.jsx
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import FileDownloadButton from '../../components/FileDownloadButton';
import { useQnaDetail } from '../../hooks/useQnaDetail';
import { downloadQnaFile } from '../../api/QnaApi';
import CommentBox from '../../components/CommentBox';

export default function QnaDetail() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const { qna, loading, deleting, error, isOwner, handleDelete } = useQnaDetail(
    { postNo, nav }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;
  if (!qna) return <div>데이터 없음</div>;

  const title = qna.postTitle || '(제목 없음)';
  const writer = qna.userName || '';
  const readCount = qna.postViewCount ?? 0;
  const enrollDate = qna.postCreatedAt || '';
  const contentHtml = qna.postContent || '';

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
    // 백엔드 정적서빙 경로에 맞춰 필요시만 바꿔주세요
    // (지금 배너처럼 /upload_files/qna/... 형태를 쓴다는 가정)
    return `http://localhost:8080/upload/qna/${f.updatedFileName}`;
  };

  const imagesHtml = (qna?.files || [])
    .filter(isImageFile)
    .map(
      (f) =>
        `<div style="margin-top:12px;">
         <img src="${getQnaFileUrl(f)}"
              alt="${f.originalFileName || '첨부 이미지'}"
              style="max-width:100%; height:auto; display:block; margin-top:12px; border-radius:6px;" />
       </div>`
    )
    .join('');

  const finalHtml = `${imagesHtml}${contentHtml || ''}`;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Q&A 게시글 상세</h2>

      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          <tr>
            <th width="15%">제목</th>
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
              {qna.files && qna.files.length > 0
                ? qna.files.map((f) => (
                    <div key={f.fileNo}>
                      <FileDownloadButton
                        postNo={postNo}
                        file={f}
                        downloadFn={downloadQnaFile}
                      />
                    </div>
                  ))
                : '없음'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Link to="/qna">
          <button type="button">목록으로</button>
        </Link>

        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => nav(`/qna/${postNo}/edit`)}
              style={{ marginLeft: 10 }}
            >
              수정하기
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{ marginLeft: 10 }}
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
  );
}
