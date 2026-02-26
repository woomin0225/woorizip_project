// src/features/houseAndRoom/pages/room/RoomRegistration.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./RoomRegistration.module.css";
import RoomForm from "../../components/RoomForm";

import { createRoom } from "../../api/roomApi";

export default function RoomRegistration() {
  const { houseNo } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState({
    roomName: "",
    houseNo,
    roomMethod: "",
    roomDeposit: 0,
    roomMonthly: 0,
    roomArea: null,
    roomFacing: "",
    roomAvailableDate: "",
    roomAbstract: "",
    roomRoomCount: 1,
    roomBathCount: 1,
    roomEmptyYn: true,
    roomStatus: "ACTIVE",
    roomOptions: "",
  });

  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;

    setRoom((cur) => {
      const numFields = new Set(["roomDeposit","roomMonthly","roomArea","roomRoomCount","roomBathCount"]);
      if (numFields.has(name)) return { ...cur, [name]: value === "" ? null : Number(value) };

      const boolFields = new Set(["roomEmptyYn"]);
      if (boolFields.has(name)) return { ...cur, [name]: value === "true" };

      return { ...cur, [name]: value };
    });
  }

  function onToggleOption(opt, checked) {
    setRoom((cur) => {
      let arr = String(cur.roomOptions || "").split(",").map(v => v.trim()).filter(Boolean);
      if (checked) {
        if (!arr.includes(opt)) arr.push(opt);
      } else {
        arr = arr.filter(v => v !== opt);
      }
      return { ...cur, roomOptions: arr.join(",") };
    });
  }

  function onAddImages(files) { setImages((prev) => [...prev, ...files]); }
  function onRemoveImage(index) { setImages((prev) => prev.filter((_, i) => i !== index)); }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    if (!room.roomName.trim()) return alert("호실명을 입력해주세요.");
    if (!room.roomMethod) return alert("거래방식을 선택해주세요.");

    setSaving(true);
    try {
      // 백엔드 DTO 필드에 맞춰 entries로 전송
      await createRoom(houseNo, Object.entries(room), images);
      alert("방 등록 성공");
      navigate("/estate/manage");
    } catch (err) {
      console.error(err);
      alert("방 등록 실패(콘솔 확인)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>방 등록</h2>
      <div className={styles.sub}>선택된 건물: {houseNo}</div>

      <RoomForm
        room={room}
        images={images}
        onChange={onChange}
        onToggleOption={onToggleOption}
        onAddImages={onAddImages}
        onRemoveImage={onRemoveImage}
        onSubmit={onSubmit}
      />
    </div>
  );
}