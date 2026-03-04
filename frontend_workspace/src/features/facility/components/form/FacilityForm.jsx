import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacilityForm } from '../../hooks/facility/useFacilityForm';
import styles from './Form.module.css';

export default function FacilityForm() {
  const FAC_IMG_DIR = 'http://localhost:8080/upload/facility_image';

  const { houseNo, facilityNo } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    values,
    categories,
    defaultOptions,
    handleChange,
    handleOptionChange,
    addCustomOption,
    loading,
    submitting,
    onSubmit,
    updateMode,
    existingImages,
    setImages: setFormFiles,
    setDeleteImageNos,
  } = useFacilityForm(houseNo, facilityNo);

  const [images, setImages] = useState([]);
  const [customInputs, setCustomInputs] = useState(['', '', '', '', '']);

  const currentCategoryName =
    categories.find(
      (cat) => String(cat.facilityCode) === String(values.facilityCode)
    )?.facilityType || '카테고리는 수정할 수 없습니다.';

  useEffect(() => {
    if (updateMode && existingImages?.length > 0) {
      const formatted = existingImages.map((img) => ({
        facilityImageNo: img.facilityImageNo,
        preview:
          img.imageUrl ||
          (img.facilityStoredImageName
            ? `${FAC_IMG_DIR}/${img.facilityStoredImageName}`
            : ''),
        isExisting: true,
      }));
      setImages(formatted);
    }
  }, [updateMode, existingImages]);

  useEffect(() => {
    if (updateMode && values.facilityOptionInfo && defaultOptions?.length > 0) {
      const allKeys = Object.keys(values.facilityOptionInfo);
      const extraKeys = allKeys.filter(
        (key) =>
          !defaultOptions.includes(key) &&
          values.facilityOptionInfo[key] === true
      );

      const nextInputs = ['', '', '', '', ''];

      extraKeys.forEach((key, i) => {
        if (i < 5) nextInputs[i] = key;
      });

      setCustomInputs(nextInputs);
    }
  }, [updateMode, values.facilityOptionInfo, defaultOptions]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (images.length + selectedFiles.length > 5) {
      alert('이미지는 최대 5장까지 업로드 가능합니다.');
      return;
    }
    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    setFormFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const target = prev[index];

      if (!target) return prev;
      if (target.preview && !target.isExisting) {
        URL.revokeObjectURL(target.preview);
      }

      if (target.isExisting && target.facilityImageNo != null) {
        setDeleteImageNos((nos) =>
          nos.includes(target.facilityImageNo)
            ? nos
            : [...nos, target.facilityImageNo]
        );
      }

      if (!target.isExisting && target.file) {
        setFormFiles((files) => files.filter((file) => file !== target.file));
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const extraOptionsList = customInputs
      .map((val) => val.trim())
      .filter((val) => val !== '');

    const updatedOptionInfo = {};

    defaultOptions.forEach((opt) => {
      updatedOptionInfo[opt] = !!values.facilityOptionInfo?.[opt];
    });

    extraOptionsList.forEach((opt) => {
      updatedOptionInfo[opt] = true;
    });

    const finalValues = {
      ...values,
      facilityOptionInfo: updatedOptionInfo,
    };

    console.log('최종 보낼 데이터:', finalValues);
    await onSubmit(e, navigate, finalValues);
  };

  if (loading)
    return <div className={styles.facilityEmpty}>시설 정보 로딩 중...</div>;

  return (
    <div className={styles.contentSection}>
      <div className="container">
        <div className={styles.detailContainer}>
          <div className={styles.infoSection}>
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.title}>
                  {updateMode ? '시설 정보 수정' : '신규 시설 등록'}
                </h2>
                <p className={styles.subTitle}>시설의 정보를 입력합니다.</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className={styles.formBody}>
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>시설 이미지</h4>
                <div
                  className={styles.imageSection}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className={styles.noImage}>
                    <span>+ 클릭하여 이미지 업로드</span>
                    <span className={styles.imageCount}>
                      ({images.length}/5)
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
                {images.length > 0 && (
                  <div className={styles.imagePreviewGrid}>
                    {images.map((img, idx) => (
                      <div key={idx} className={styles.previewItem}>
                        <img
                          src={img.preview}
                          alt={`preview-${idx}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className={styles.removeImgBtn}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>기본 설정</h4>
                <div className={styles.surveyBox}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>카테고리</div>
                    <div className={styles.fieldControl}>
                      {updateMode ? (
                        <div className={styles.readOnlyField}>
                          <strong>{currentCategoryName}</strong>
                          <input
                            type="hidden"
                            name="facilityCode"
                            value={values.facilityCode || ''}
                          />
                        </div>
                      ) : (
                        <select
                          name="facilityCode"
                          className={styles.input}
                          value={values.facilityCode || ''}
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- 선택하세요 --</option>
                          {categories.map((cat) => (
                            <option
                              key={cat.facilityCode}
                              value={cat.facilityCode}
                            >
                              {cat.facilityType}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>시설 이름</div>
                    <div className={styles.fieldControl}>
                      <input
                        type="text"
                        name="facilityName"
                        className={styles.input}
                        value={values.facilityName || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>운영 정보</h4>
                <div className={styles.grid2}>
                  <div className={styles.surveyBox}>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>위치(층)</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="number"
                          name="facilityLocation"
                          className={styles.input}
                          value={values.facilityLocation ?? ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>수용 인원</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="number"
                          name="facilityCapacity"
                          className={styles.input}
                          value={values.facilityCapacity || ''}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.surveyBox}>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>여는 시간</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="time"
                          name="facilityOpenTime"
                          className={styles.input}
                          value={values.facilityOpenTime || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldLabel}>닫는 시간</div>
                      <div className={styles.fieldControl}>
                        <input
                          type="time"
                          name="facilityCloseTime"
                          className={styles.input}
                          value={values.facilityCloseTime || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>예약 시스템</h4>
                <div className={styles.surveyBox}>
                  <label className={styles.confirmCheck}>
                    <input
                      type="checkbox"
                      name="facilityRsvnRequiredYn"
                      checked={!!values.facilityRsvnRequiredYn}
                      onChange={handleChange}
                    />
                    <span> 시설 예약 시스템을 활성화합니다.</span>
                  </label>
                  {values.facilityRsvnRequiredYn && (
                    <div className={styles.rsvnDetail}>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldLabel}>일일 횟수</div>
                        <div className={styles.fieldControl}>
                          <input
                            type="number"
                            name="maxRsvnPerDay"
                            className={styles.input}
                            value={values.maxRsvnPerDay || ''}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className={styles.grid2}>
                        <div className={styles.fieldRow}>
                          <div className={styles.fieldLabel}>단위(분)</div>
                          <div className={styles.fieldControl}>
                            <select
                              name="facilityRsvnUnitMinutes"
                              className={styles.input}
                              value={values.facilityRsvnUnitMinutes || ''}
                              onChange={handleChange}
                            >
                              <option value="">선택</option>
                              {[15, 30, 60].map((m) => (
                                <option key={m} value={m}>
                                  {m}분
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className={styles.fieldRow}>
                          <div className={styles.fieldLabel}>최대 시간</div>
                          <div className={styles.fieldControl}>
                            <select
                              name="facilityMaxDurationMinutes"
                              className={styles.input}
                              value={
                                values.facilityMaxDurationMinutes
                                  ? String(values.facilityMaxDurationMinutes)
                                  : ''
                              }
                              onChange={handleChange}
                            >
                              <option value="">선택</option>
                              {[60, 120, 180].map((m) => (
                                <option key={m} value={m}>
                                  {m / 60}시간 ({m}분)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionTitle}>시설 옵션</h4>
                <div className={styles.surveyBox}>
                  <div className={styles.reasonGroup}>
                    {defaultOptions &&
                      defaultOptions.map((opt) => (
                        <label key={opt} className={styles.reasonItem}>
                          <input
                            type="checkbox"
                            checked={!!values.facilityOptionInfo?.[opt]}
                            onChange={(e) =>
                              handleOptionChange(opt, e.target.checked)
                            }
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                  </div>

                  <div className={styles.customOptionGrid}>
                    {customInputs.map((val, idx) => (
                      <input
                        key={idx}
                        type="text"
                        className={styles.input}
                        placeholder={`기타 옵션 ${idx + 1}`}
                        value={val}
                        onChange={(e) => {
                          const next = [...customInputs];
                          next[idx] = e.target.value;
                          setCustomInputs(next);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => navigate(-1)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submitting}
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
