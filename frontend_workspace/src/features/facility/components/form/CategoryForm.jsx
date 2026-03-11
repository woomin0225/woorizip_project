// src/features/facility/components/form/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategoryForm } from '../../hooks/category/useCategoryForm';
import styles from './Form.module.css';

export default function CategoryForm() {
  const { facilityCode } = useParams();
  const navigate = useNavigate();

  const { values, handleChange, onSubmit, loading, submitting, updateMode } =
    useCategoryForm(facilityCode ? parseInt(facilityCode) : null);

  const [optionList, setOptionList] = useState(['', '', '', '', '']);

  useEffect(() => {
    if (values.facilityOptions) {
      const savedOptions = values.facilityOptions
        .split(',')
        .map((opt) => opt.trim());
      const newOptions = ['', '', '', '', ''];
      savedOptions.forEach((opt, i) => {
        if (i < 5) newOptions[i] = opt;
      });
      setOptionList(newOptions);
    }
  }, [values.facilityOptions]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...optionList];
    newOptions[index] = value;
    setOptionList(newOptions);

    const syntheticEvent = {
      target: {
        name: 'facilityOptions',
        value: newOptions.filter((opt) => opt.trim() !== '').join(','),
      },
    };
    handleChange(syntheticEvent);
  };

  if (loading) {
    return (
      <div className={styles.contentSection}>
        <div className="container">
          <div className={styles.facilityEmpty}>카테고리 정보 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          <div className={styles.infoSection}>
            <h2 className={styles.title}>
              {updateMode ? '카테고리 수정' : '신규 카테고리 등록'}
            </h2>

            <form
              onSubmit={(e) => onSubmit(e, navigate)}
              className={styles.descBox}
            >
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>시설 종류</h4>
                <input
                  type="text"
                  name="facilityType"
                  className={styles.input}
                  placeholder="시설 이름"
                  value={values.facilityType}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>기본 옵션 (최대 5개)</h4>
                <div className={styles.menuList}>
                  {optionList.map((opt, idx) => (
                    <div key={idx} className={styles.fieldRow}>
                      <label className={styles.fieldLabel}>{idx + 1}.</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder={`${idx + 1}번째 시설 기본 옵션`}
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => navigate(`/admin/category`)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submitting}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
