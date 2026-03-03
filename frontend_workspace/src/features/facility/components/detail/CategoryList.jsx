// src/features/facility/components/detail/CategoryList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryList } from '../../hooks/category/useCategoryList';
import styles from './Detail.module.css';

export default function CategoryList() {
  const nav = useNavigate();
  const { categories, loading, error } = useCategoryList();

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>카테고리 정보 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>시설 카테고리 관리</h2>
            <p className={styles.subTitle}>* 클릭 시 수정 페이지로 이동합니다.</p>
          </div>
          <button
            className={styles.facilityRow}
            onClick={() => nav('/admin/category/form')}
          >
            + 신규 카테고리 등록
          </button>
        </div>

        <div className={styles.grid2}>
          {categories.map((category) => (
            <div
              key={category.facilityCode}
              className={styles.itemCard}
              onClick={() =>
                nav(`/admin/category/form/${category.facilityCode}`)
              }
            >
              <div className={styles.facilityRow}>
                <h4 className={styles.itemTitle}>{category.facilityType}</h4>
                <div className={styles.optionGrid}>
                  {category.facilityOptions?.map((option, idx) => (
                    <span key={idx} className={styles.optionBadge}>
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}