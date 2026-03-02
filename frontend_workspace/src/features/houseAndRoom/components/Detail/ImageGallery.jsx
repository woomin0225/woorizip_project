import { useEffect, useMemo, useState } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images = [] }) {
  const list = useMemo(() => (images || []).filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);
  const [showThumbs, setShowThumbs] = useState(false);
  const [mainCount, setMainCount] = useState(3);
  const [direction, setDirection] = useState('next');

  useEffect(() => {
    setIdx(0);
    setShowThumbs(false);
    setDirection('next');
  }, [list.join('|')]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMainCount = () => {
      const width = window.innerWidth;
      if (width < 900) {
        setMainCount(1);
      } else if (width < 1280) {
        setMainCount(2);
      } else {
        setMainCount(3);
      }
    };

    updateMainCount();
    window.addEventListener('resize', updateMainCount);
    return () => window.removeEventListener('resize', updateMainCount);
  }, []);

  if (list.length === 0) return <div className={styles.empty}>이미지가 없습니다.</div>;

  const isSingleImage = list.length === 1;
  const hasMultiple = list.length > 1;
  const displayCount = Math.min(mainCount, list.length);
  const centerOffset = Math.floor(displayCount / 2);
  const normalizeIndex = (value) => (value % list.length + list.length) % list.length;
  const visibleMainImages = Array.from({ length: displayCount }, (_, pos) => {
    const relative = pos - centerOffset;
    const realIndex = normalizeIndex(idx + relative);
    return { src: list[realIndex], realIndex };
  });
  const gridAnimClass = direction === 'prev' ? styles.slidePrev : styles.slideNext;

  const selectIndex = (nextIndex) => {
    const normalized = normalizeIndex(nextIndex);
    if (normalized === idx) return;

    const forward = (normalized - idx + list.length) % list.length;
    const backward = (idx - normalized + list.length) % list.length;
    setDirection(forward <= backward ? 'next' : 'prev');
    setIdx(normalized);
  };

  const goPrev = () => {
    if (!hasMultiple) return;
    setDirection('prev');
    setIdx((i) => (i === 0 ? list.length - 1 : i - 1));
  };

  const goNext = () => {
    if (!hasMultiple) return;
    setDirection('next');
    setIdx((i) => (i === list.length - 1 ? 0 : i + 1));
  };

  return (
    <div className={styles.wrap}>
      <div
        key={`${idx}-${mainCount}`}
        className={`${styles.mainGrid} ${isSingleImage ? styles.mainGridSingle : ''} ${gridAnimClass}`}
        style={{ '--gallery-cols': Math.max(1, Math.min(mainCount, visibleMainImages.length)) }}
      >
        {visibleMainImages.map(({ src, realIndex }, i) => {
          const isActive = realIndex === idx;

          return (
            <button
              type="button"
              key={`${realIndex}-${i}`}
              className={isActive ? styles.mainItemActive : styles.mainItem}
              onClick={() => selectIndex(realIndex)}
            >
              <img src={src} alt={`img-${realIndex}`} />
            </button>
          );
        })}
      </div>

      <div className={styles.footerRow}>
        <div className={styles.controls}>
          <button type="button" onClick={goPrev} disabled={!hasMultiple}>
            ◀
          </button>
          <span>
            {idx + 1} / {list.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={!hasMultiple}
          >
            ▶
          </button>
        </div>

        {hasMultiple && (
          <button type="button" className={styles.toggleThumbs} onClick={() => setShowThumbs((v) => !v)}>
            {showThumbs ? '썸네일 닫기' : `${list.length}+`}
          </button>
        )}
      </div>

      {showThumbs && hasMultiple && (
        <div className={styles.thumbs}>
          {list.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              className={i === idx ? styles.thumbActive : styles.thumb}
              onClick={() => selectIndex(i)}
            >
              <img src={src} alt={`thumb-${i}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
