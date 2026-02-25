// 방 작성 및 수정 양식
import ImageUploadField from "./ImageUploadField";
import styles from "./RoomForm.module.css";

const OPTIONS = ["WiFi", "냉장고", "세탁기", "에어컨", "침대", "책상", "옷장", "TV", "신발장"];

function optionChecked(roomOptions, value) {
  const arr = String(roomOptions || "").split(",").map(v => v.trim()).filter(Boolean);
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
  const isJeonse = room.roomMethod === "L";
  const isWolse = room.roomMethod === "M";

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label>호실명</label>
        <input name="roomName" value={room.roomName || ""} onChange={onChange} placeholder="101호" />
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>거래방식</label>
          <select name="roomMethod" value={room.roomMethod || ""} onChange={onChange}>
            <option value="">선택</option>
            <option value="L">전세</option>
            <option value="M">월세</option>
          </select>
        </div>

        <div className={styles.row}>
          <label>공실여부</label>
          <select name="roomEmptyYn" value={String(room.roomEmptyYn ?? true)} onChange={onChange}>
            <option value="true">공실</option>
            <option value="false">거주중</option>
          </select>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>전세금</label>
          <input
            type="number"
            name="roomDeposit"
            value={room.roomDeposit ?? ""}
            onChange={onChange}
            disabled={isWolse && !!room.roomMethod}
            placeholder="0"
          />
        </div>

        <div className={styles.row}>
          <label>월세</label>
          <input
            type="number"
            name="roomMonthly"
            value={room.roomMonthly ?? ""}
            onChange={onChange}
            disabled={isJeonse && !!room.roomMethod}
            placeholder="0"
          />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>면적(㎡)</label>
          <input type="number" name="roomArea" value={room.roomArea ?? ""} onChange={onChange} />
        </div>

        <div className={styles.row}>
          <label>방향</label>
          <select name="roomFacing" value={room.roomFacing || ""} onChange={onChange}>
            <option value="">선택</option>
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
          <input type="number" min="1" name="roomRoomCount" value={room.roomRoomCount ?? 1} onChange={onChange} />
        </div>

        <div className={styles.row}>
          <label>욕실 수</label>
          <input type="number" min="0" name="roomBathCount" value={room.roomBathCount ?? 1} onChange={onChange} />
        </div>
      </div>

      <div className={styles.row}>
        <label>입주 가능 날짜</label>
        <input type="date" name="roomAvailableDate" value={room.roomAvailableDate || ""} onChange={onChange} />
      </div>

      <div className={styles.row}>
        <label>소개글</label>
        <textarea name="roomAbstract" value={room.roomAbstract || ""} onChange={onChange} rows={4} />
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

      <div className={styles.row}>
        <label>방 사진</label>
        <ImageUploadField images={images} onAddFiles={onAddImages} onRemove={onRemoveImage} />
      </div>

      <div className={styles.actions}>
        <button type="submit">저장(임시)</button>
      </div>
    </form>
  );
}