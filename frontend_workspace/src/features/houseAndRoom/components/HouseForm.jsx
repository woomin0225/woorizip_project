// 건물 작성 및 수정 양식
import ImageUploadField from "./ImageUploadField";
import styles from "./HouseForm.module.css";
import { PropTypes } from 'prop-types';

export default function HouseForm({
  house,
  images,
  onChange,
  onAddImages,
  onRemoveImage,
  onSubmit,
  onSearchAddress,
}) {
  HouseForm.propTypes = {
    house: PropTypes.shape({
      houseName: PropTypes.string.isRequired,
      houseZip: PropTypes.string.isRequired,
      houseAddress: PropTypes.string.isRequired,
      houseAddressDetail: PropTypes.string,
      houseCompletionYear: PropTypes.number.isRequired,
      houseFloors: PropTypes.number.isRequired,
      houseHouseHolds: PropTypes.number.isRequired,
      houseElevatorYn: PropTypes.bool.isRequired,
      housePetYn: PropTypes.bool.isRequired,
      houseFemaleLimit: PropTypes.bool.isRequired,
      houseParkingMax: PropTypes.number.isRequired,
      houseAbstract: PropTypes.string,
    }),
  };
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <label>건물명</label>
        <input name="houseName" value={house.houseName || ""} onChange={onChange} />
      </div>

      <div className={styles.row}>
        <label>우편번호</label>
        <div className={styles.inline}>
          <input name="houseZip" value={house.houseZip || ""} onChange={onChange} /*readOnly*/ />
          <button type="button" onClick={onSearchAddress}>주소검색</button>
        </div>
      </div>

      <div className={styles.row}>
        <label>주소</label>
        <input name="houseAddress" value={house.houseAddress || ""} onChange={onChange} /*readOnly*/ />
      </div>

      <div className={styles.row}>
        <label>상세주소</label>
        <input name="houseAddressDetail" value={house.houseAddressDetail || ""} onChange={onChange} />
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>준공년도</label>
          <input type="number" name="houseCompletionYear" value={house.houseCompletionYear ?? ""} onChange={onChange} />
        </div>

        <div className={styles.row}>
          <label>층수</label>
          <input type="number" name="houseFloors" value={house.houseFloors ?? ""} onChange={onChange} />
        </div>

        <div className={styles.row}>
          <label>총 세대</label>
          <input type="number" name="houseHouseHolds" value={house.houseHouseHolds ?? ""} onChange={onChange} />
        </div>

        <div className={styles.row}>
          <label>주차 대수</label>
          <input type="number" name="houseParkingMax" value={house.houseParkingMax ?? ""} onChange={onChange} />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.row}>
          <label>엘리베이터</label>
          <select name="houseElevatorYn" value={String(house.houseElevatorYn ?? true)} onChange={onChange}>
            <option value="true">있음</option>
            <option value="false">없음</option>
          </select>
        </div>

        <div className={styles.row}>
          <label>반려동물</label>
          <select name="housePetYn" value={String(house.housePetYn ?? false)} onChange={onChange}>
            <option value="true">허용</option>
            <option value="false">금지</option>
          </select>
        </div>

        <div className={styles.row}>
          <label>여성전용</label>
          <select name="houseFemaleLimit" value={String(house.houseFemaleLimit ?? false)} onChange={onChange}>
            <option value="true">여성전용</option>
            <option value="false">남녀공용</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <label>소개글</label>
        <textarea
          name="houseAbstract"
          value={house.houseAbstract || ""}
          onChange={onChange}
          rows={4}
        />
      </div>

      <div className={styles.row}>
        <label>외관 사진</label>
        <ImageUploadField images={images} onAddFiles={onAddImages} onRemove={onRemoveImage} />
      </div>

      <div className={styles.actions}>
        <button type="submit">저장(임시)</button>
      </div>
    </form>
  );
}