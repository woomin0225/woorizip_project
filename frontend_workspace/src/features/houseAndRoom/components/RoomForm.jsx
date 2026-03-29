// 방 작성 및 수정 양식
import ImageUploadField from './ImageUploadField';
import styles from './RoomForm.module.css';
import { PropTypes } from 'prop-types';
// 추후 자동등록 기능 사용하려면 주석 제거
// import { useEffect, useState } from 'react';
// import { analyzeRoomImages } from '../api/roomApi';
import { useEffect } from 'react';

const OPTIONS = [
  'WiFi',
  '냉장고',
  '세탁기',
  '에어컨',
  '침대',
  '책상',
  '옷장',
  'TV',
  '신발장',
];

function optionChecked(roomOptions, value) {
  const arr = String(roomOptions || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return arr.includes(value);
}

export default function RoomForm({
  room,
  images,
  onChange,
  onToggleOption,
  onAddImages,
  onRemoveImage,
  onSubmit,
}) {
  RoomForm.propTypes = {
    room: PropTypes.shape({
      roomName: PropTypes.string.isRequired,
      houseNo: PropTypes.string.isRequired,
      roomMethod: PropTypes.string.isRequired,
      roomDeposit: PropTypes.number.isRequired,
      roomMonthly: PropTypes.number,
      roomArea: PropTypes.number.isRequired,
      roomFacing: PropTypes.string.isRequired,
      roomAvailableDate: PropTypes.any.isRequired,
      roomAbstract: PropTypes.string,
      roomRoomCount: PropTypes.number.isRequired,
      roomBathCount: PropTypes.number.isRequired,
      roomEmptyYn: PropTypes.bool,
      roomStatus: PropTypes.string,
      roomOptions: PropTypes.string,
    }),
  };

  const today = new Date().toISOString().slice(0, 10);
  const raw = room.roomAvailableDate
    ? String(room.roomAvailableDate).slice(0, 10)
    : '';
  useEffect(() => {
    // 입주 가능 날짜가 비어있으면 기본값을 오늘로 세팅(부모 state도 같이 바뀜)
    if (!raw || raw < today) {
      onChange?.({ target: { name: 'roomAvailableDate', value: today } });
    }
  }, [raw, today, onChange]);

  // 추후 자동등록 기능 사용하려면 주석 제거
  // const [aiLoading, setAiLoading] = useState(false);
  // const [aiMessage, setAiMessage] = useState('');

  const isJeonse = room.roomMethod === 'L';

  // 추후 자동등록 기능 사용하려면 주석 제거
  /* const handleAiAnalyze = async () => {
    try {
      if (!images || images.length === 0) {
        setAiMessage('먼저 방 이미지를 추가해주세요.');
        return;
      }

      const newImageFiles = images.filter((img) => img instanceof File);

      if (newImageFiles.length === 0) {
        setAiMessage('새로 추가한 이미지가 있어야 AI 분석이 가능합니다.');
        return;
      }

      setAiLoading(true);
      setAiMessage('이미지 분석 중입니다...');

      const result = await analyzeRoomImages(newImageFiles);

      if (result?.summary) {
        onChange?.({
          target: {
            name: 'roomAbstract',
            value: result.summary,
          },
        });
      }

      if (Array.isArray(result?.normalizedOptions)) {
        onChange?.({
          target: {
            name: 'roomOptions',
            value: result.normalizedOptions.join(','),
          },
        });
      }

      setAiMessage('AI 분석 결과를 반영했습니다.');
    } catch (e) {
      console.error(e);
      setAiMessage('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  }; */

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label>호실명</label>
        <input
          name="roomName"
          value={room.roomName || ''}
          onChange={onChange}
          maxLength={20}
        />
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>거래방식</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioItem}>
              <input
                type="radio"
                name="roomMethod"
                value="L"
                checked={room.roomMethod === 'L'}
                onChange={onChange}
              />
              전세
            </label>
            <label className={styles.radioItem}>
              <input
                type="radio"
                name="roomMethod"
                value="M"
                checked={room.roomMethod === 'M'}
                onChange={onChange}
              />
              월세
            </label>
          </div>
        </div>

        <div className={styles.row}>
          <label>공실여부</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioItem}>
              <input
                type="radio"
                name="roomEmptyYn"
                value="true"
                checked={room.roomEmptyYn === true}
                onChange={onChange}
              />
              공실
            </label>
            <label className={styles.radioItem}>
              <input
                type="radio"
                name="roomEmptyYn"
                value="false"
                checked={room.roomEmptyYn === false}
                onChange={onChange}
              />
              거주중
            </label>
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>보증금</label>
          <input
            type="number"
            name="roomDeposit"
            value={room.roomDeposit ?? ''}
            onChange={onChange}
            min={0}
            max={10000000000}
          />
        </div>

        <div className={styles.row}>
          <label>월세</label>
          <input
            type="number"
            name="roomMonthly"
            value={room.roomMonthly ?? ''}
            onChange={onChange}
            disabled={isJeonse && !!room.roomMethod}
            min={0}
            max={100000000}
          />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>면적(㎡)</label>
          <input
            type="number"
            step={0.01}
            name="roomArea"
            value={room.roomArea ?? ''}
            onChange={onChange}
            min={0.0}
            max={999.99}
          />
        </div>

        <div className={styles.row}>
          <label>방향</label>
          <select
            name="roomFacing"
            value={room.roomFacing || ''}
            onChange={onChange}
          >
            <option value="동향">동향</option>
            <option value="서향">서향</option>
            <option value="남향">남향</option>
            <option value="북향">북향</option>
            <option value="남동향">남동향</option>
            <option value="남서향">남서향</option>
            <option value="북동향">북동향</option>
            <option value="북서향">북서향</option>
          </select>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>방 수</label>
          <input
            type="number"
            min="1"
            name="roomRoomCount"
            value={room.roomRoomCount ?? 1}
            onChange={onChange}
          />
        </div>

        <div className={styles.row}>
          <label>욕실 수</label>
          <input
            type="number"
            min="0"
            name="roomBathCount"
            value={room.roomBathCount ?? 1}
            onChange={onChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <label>입주 가능 날짜</label>
        <input
          type="date"
          name="roomAvailableDate"
          value={raw && raw >= today ? raw : today}
          onChange={onChange}
        />
      </div>

      <div className={styles.row}>
        <label>방 사진</label>
        <ImageUploadField
          images={images}
          onAddFiles={onAddImages}
          onRemove={onRemoveImage}
        />
      </div>

      {/* 추후 자동등록 기능 사용하려면 주석 제거
      <div className={styles.row}>
        <label>AI 이미지 분석</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={handleAiAnalyze} disabled={aiLoading}>
            {aiLoading ? '분석 중...' : 'AI로 이미지 분석'}
          </button>
          {aiMessage && <span>{aiMessage}</span>}
        </div>
      </div>
      */}

      <div className={styles.row}>
        <label>소개글</label>
        <textarea
          name="roomAbstract"
          value={room.roomAbstract || ''}
          onChange={onChange}
          rows={4}
        />
      </div>

      <div className={styles.row}>
        <label>옵션</label>
        <div className={styles.options}>
          {OPTIONS.map((opt) => (
            <label key={opt} className={styles.optItem}>
              <input
                type="checkbox"
                checked={optionChecked(room.roomOptions, opt)}
                onChange={(e) => onToggleOption?.(opt, e.target.checked)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit">저장</button>
      </div>
    </form>
  );
}
