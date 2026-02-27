// 건물 등록 페이지
// src/features/houseAndRoom/pages/house/HouseRegistration.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DaumPostcodeEmbed from "react-daum-postcode";

import HouseForm from "../../components/HouseForm";
import styles from "./HouseRegistration.module.css";

import { createHouse } from "../../api/houseApi";

export default function HouseRegistration() {
  const navigate = useNavigate();

  const [house, setHouse] = useState({
    houseName: "",
    houseZip: "",
    houseAddress: "",
    houseAddressDetail: "",
    houseCompletionYear: null,
    houseFloors: null,
    houseHouseHolds: null,
    houseElevatorYn: true,
    housePetYn: false,
    houseFemaleLimit: false,
    houseParkingMax: null,
    houseAbstract: "",
  });

  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  // ✅ 주소검색 모달
  const [openPostcode, setOpenPostcode] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;

    setHouse((cur) => {
      const numberFields = new Set([
        "houseCompletionYear",
        "houseFloors",
        "houseHouseHolds",
        "houseParkingMax",
      ]);
      if (numberFields.has(name))
        return { ...cur, [name]: value === "" ? null : Number(value) };

      const boolFields = new Set(["houseElevatorYn", "housePetYn", "houseFemaleLimit"]);
      if (boolFields.has(name)) return { ...cur, [name]: value === "true" };

      return { ...cur, [name]: value };
    });
  }

  function onAddImages(files) {
    setImages((prev) => [...prev, ...files]);
  }
  function onRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ✅ “주소검색” 버튼 클릭
  function onSearchAddress() {
    setOpenPostcode(true);
  }

  // ✅ 주소 선택 완료
  function handleCompleteAddress(data) {
    const zip = data.zonecode; // 우편번호
    // 도로명주소 우선, 없으면 지번주소/기본주소
    const addr =
      data.roadAddress ||
      data.jibunAddress ||
      data.address ||
      "";

    setHouse((cur) => ({
      ...cur,
      houseZip: zip,
      houseAddress: addr,
      // 상세주소는 사용자가 입력하니 유지(원하면 ""로 초기화 가능)
      // houseAddressDetail: "",
    }));

    setOpenPostcode(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    // ✅ 주소 필수 체크(사전 방지)
    if (!house.houseZip || !house.houseAddress) {
      alert("주소검색을 통해 우편번호/주소를 먼저 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await createHouse(Object.entries(house), images);
      alert("건물 등록 성공");
      navigate("/estate/manage");
    } catch (err) {
      console.error(err);
      alert("건물 등록 실패(콘솔 확인)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>건물 등록</h2>

      <HouseForm
        house={house}
        images={images}
        onChange={onChange}
        onAddImages={onAddImages}
        onRemoveImage={onRemoveImage}
        onSubmit={onSubmit}
        onSearchAddress={onSearchAddress}
      />

      {/* ✅ 주소검색 모달 */}
      {openPostcode && (
        <div className={styles.backdrop} onClick={() => setOpenPostcode(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>주소검색</div>
              <button type="button" className={styles.closeBtn} onClick={() => setOpenPostcode(false)}>
                ✕
              </button>
            </div>

            <DaumPostcodeEmbed onComplete={handleCompleteAddress} />

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setOpenPostcode(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}