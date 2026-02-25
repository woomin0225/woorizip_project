// 건물 등록 페이지
// src/features/houseAndRoom/pages/house/HouseRegistration.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    // houseLat/houseLng가 있으면 주소검색 후 세팅 가능
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;

    setHouse((cur) => {
      const numberFields = new Set(["houseCompletionYear","houseFloors","houseHouseHolds","houseParkingMax"]);
      if (numberFields.has(name)) return { ...cur, [name]: value === "" ? null : Number(value) };

      const boolFields = new Set(["houseElevatorYn","housePetYn","houseFemaleLimit"]);
      if (boolFields.has(name)) return { ...cur, [name]: value === "true" };

      return { ...cur, [name]: value };
    });
  }

  function onAddImages(files) { setImages((prev) => [...prev, ...files]); }
  function onRemoveImage(index) { setImages((prev) => prev.filter((_, i) => i !== index)); }

  function onSearchAddress() {
    alert("주소검색(다음 우편번호/카카오) 연동은 추후. 지금은 직접 입력/테스트로 진행");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

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
    </div>
  );
}