export default function SearchFilterPanel({
  cond,
  handleCondChange,
  handleOptionsChange,
  clickSearch,
}) {
  function optionChecked(value) {
    // cond.options 확인
    const arr = (cond.options || "").split(",").filter(Boolean);
    return arr.includes(value);
  }

  const isJeonse = cond.roomType === "L";
  const isWolse  = cond.roomType === "M";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        clickSearch();
      }}
    >
      <label>검색어</label>
      <input name="keyword" value={cond.keyword} onChange={handleCondChange} />
      <button type="button" onClick={clickSearch}>검색</button>

      <div>
        <select name="roomType" value={cond.roomType} onChange={handleCondChange}>
          <option value="">전체</option>
          <option value="L">전세</option>
          <option value="M">월세</option>
        </select>

        <div>
          <label>전세금</label>
          <input name="minDeposit" disabled={isWolse} value={cond.minDeposit ?? ""} onChange={handleCondChange} />
          ~
          <input name="maxDeposit" disabled={isWolse} value={cond.maxDeposit ?? ""} onChange={handleCondChange} />
        </div>

        <div>
          <label>월세</label>
          <input name="minTax" disabled={isJeonse} value={cond.minTax ?? ""} onChange={handleCondChange} />
          ~
          <input name="maxTax" disabled={isJeonse} value={cond.maxTax ?? ""} onChange={handleCondChange} />
        </div>

        <div>
          <label>
            <input type="checkbox" value="WiFi" checked={optionChecked("WiFi")} onChange={handleOptionsChange} />
            WiFi
          </label>
          <label>
            <input type="checkbox" value="냉장고" checked={optionChecked("냉장고")} onChange={handleOptionsChange} />
            냉장고
          </label>
          {/* 나머지 옵션도 동일 패턴 */}
        </div>

        <div>
          <label>
            <input type="checkbox" name="houseElevatorYn" checked={!!cond.houseElevatorYn} onChange={handleCondChange} />
            승강기
          </label>
          <label>
            <input type="checkbox" name="housePetYn" checked={!!cond.housePetYn} onChange={handleCondChange} />
            애완동물
          </label>
          <label>
            <input type="checkbox" name="houseFemaleLimit" checked={!!cond.houseFemaleLimit} onChange={handleCondChange} />
            여성전용
          </label>
          <label>
            <input type="checkbox" name="houseParking" checked={!!cond.houseParking} onChange={handleCondChange} />
            주차가능
          </label>
        </div>
      </div>
    </form>
  );
}