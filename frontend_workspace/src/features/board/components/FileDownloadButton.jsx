// src/features/board/components/FileDownloadButton.jsx
import React, { useState } from 'react';

export default function FileDownloadButton({
  postNo,
  file,
  downloadFn,
  className = '',
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const response = await downloadFn(postNo, file.fileNo);

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalFileName;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('파일 다운로드 실패:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={className}
    >
      {downloading ? '다운로드 중...' : file.originalFileName}
    </button>
  );
}
