// 등록/수정 페이지의 이미지 업로드용: 슬라이드 앨범과 사진위 삭제버튼(X), 파일 첨부하기 버튼
import { useEffect, useState } from "react";
import styles from "./ImageUploadField.module.css";

export default function ImageUploadField({ images = [], onAddFiles, onRemove }) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = (images || []).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  function handleFiles(e) {
    const list = Array.from(e.target.files || []);
    if (list.length > 0) onAddFiles?.(list);
    e.target.value = "";
  }

  return (
    <div className={styles.wrap}>
      <input className={styles.file} type="file" accept="image/*" multiple onChange={handleFiles} />

      <div className={styles.grid}>
        {previews.map((src, idx) => (
          <div className={styles.thumb} key={`${src}-${idx}`}>
            <img src={src} alt={`new-${idx}`} />
            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemove?.(idx)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {previews.length === 0 && <div className={styles.empty}>첨부된 사진이 없습니다.</div>}
    </div>
  );
}