import { useState } from "react";

export default function SearchFilterPanel({cond, handleCondChange, handleOptionsChange, clickSearch}){
    const optionChecked = (value) => {
        // cond.options 확인
        const arr = (cond.options || "").split(",");
        return arr.includes(value);
    };
    return(
        <div>
            <form>
                <label htmlFor="searchKeyword">검색어</label>
                <input
                    id="searchKeyword"
                    value={cond.keyword}
                    onChange={handleCondChange}
                />
                <button onClick={clickSearch}>검색</button>
                <div>
                    {/* 전세/월세 선택 */}
                    <select id="roomType" name="roomType" value={cond.roomType} onChange={handleCondChange}>
                        <option value="L">전세</option>
                        <option value="M">월세</option>
                    </select>
                    <label>전세금액</label><input name="minDeposit" disabled={cond.roomType==="L"?true:false} onChange={handleCondChange} />원 ~ <input name="maxDeposit" />원
                    <label>월세금액</label><input name="minTax" disabled={cond.roomType==="M"?true:false} onChange={handleCondChange}/>원 ~ <input name="maxTax" />원
                    {/* 가구옵션 체크 */}
                    <table>
                        <tr>
                            <input type="checkbox" value="WiFi" checked={optionChecked("WiFi")} onChange={handleOptionsChange} />WiFi
                            <input type="checkbox" value="냉장고" checked={optionChecked("냉장고")} onChange={handleOptionsChange} />냉장고
                        </tr>
                        <tr>
                            <input type="checkbox" value="세탁기" checked={optionChecked("세탁기")} onChange={handleOptionsChange} />세탁기
                            <input type="checkbox" value="에어컨" cheched={optionChecked("에어컨")} onChange={handleOptionsChange} />에어컨
                        </tr>
                        <tr>
                            <input type="checkbox" value="침대" checked={optionChecked("침대")} onChange={handleOptionsChange} />침대
                            <input type="checkbox" value="책상" checked={optionChecked("책상")} onChange={handleOptionsChange} />책상
                        </tr>
                        <tr>
                            <input type="checkbox" value="옷장" checked={optionChecked("옷장")} onChange={handleOptionsChange} />옷장
                            <input type="checkbox" value="TV" checked={optionChecked("TV")} onChange={handleOptionsChange} />TV
                        </tr>
                        <tr>
                            <input type="checkbox" value="신발장" checked={optionChecked("신발장")} onChange={handleOptionsChange} />신발장
                        </tr>
                    </table>
                    <table>
                        <tr>
                            {/* 승강기 유무 체크 */}
                            <input type="checkbox" name="houseElevatorYn" value="true" onChange={handleCondChange}/>승강기
                            {/* 애완동물 가능여부 체크 */}
                            <input type="checkbox" name="housePetYn" value="true" onChange={handleCondChange} />애완동물
                        </tr>
                        <tr>
                            {/* 여성전용 체크 */}
                            <input type="checkbox" name="houseFemaleLimit" value="true" onChange={handleCondChange}/>여성전용
                            {/* 주차가능 체크 */}
                            <input type="checkbox" name="houseParking" value="true" onChange={handleCondChange}/>주차가능
                        </tr>
                    </table>
                </div>
            </form>
        </div>
    );
}