// 슬라이드 이미지 앨범. 건물/방의 상세 페이지에서 사진 이름 리스트를 받아서 반복처리하고 앨범 생성함.
// ResultItem의 앨범과 동일하지만 더 많은 수를 한번에 볼 수 있음
import { useEffect, useState } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images = [] }) {
  const list = (images || []).filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => setIdx(0), [list.join('|')]);

  if (list.length === 0) return <div className={styles.empty}>이미지가 없습니다.</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <img src={list[idx]} alt={`img-${idx}`} />
      </div>

      <div className={styles.controls}>
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>◀</button>
        <span>{idx + 1} / {list.length}</span>
        <button onClick={() => setIdx(i => Math.min(list.length - 1, i + 1))} disabled={idx >= list.length - 1}>▶</button>
      </div>

      <div className={styles.thumbs}>
        {list.slice(0, 12).map((src, i) => (
          <button
            key={`${src}-${i}`}
            className={i === idx ? styles.thumbActive : styles.thumb}
            onClick={() => setIdx(i)}
          >
            <img src={src} alt={`thumb-${i}`} />
          </button>
        ))}
      </div>
    </div>
  );
}