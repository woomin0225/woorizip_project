import { useEffect, useState } from "react";
import styles from "./EstateModify.module.css";

import { getMyHouses, getHouse, getHouseImages, modifyHouse, getRoomByHouseNo } from "../api/houseApi";
import { getRoom, getRoomImages, modifyRoom } from "../api/roomApi";

import HouseForm from "../components/HouseForm";
import RoomForm from "../components/RoomForm";
import ExistingImagePicker from "../components/ExistingImagePicker";

export default function EstateModify() {
  const [houses, setHouses] = useState([]);
  const [selectedHouseNo, setSelectedHouseNo] = useState("");

  // house modify
  const [house, setHouse] = useState(null);
  const [houseImages, setHouseImages] = useState([]);
  const [deleteHouseImageNos, setDeleteHouseImageNos] = useState([]);
  const [newHouseImages, setNewHouseImages] = useState([]);

  // room list & room modify
  const [rooms, setRooms] = useState([]);
  const [selectedRoomNo, setSelectedRoomNo] = useState("");

  const [room, setRoom] = useState(null);
  const [roomImages, setRoomImages] = useState([]);
  const [deleteRoomImageNos, setDeleteRoomImageNos] = useState([]);
  const [newRoomImages, setNewRoomImages] = useState([]);

  const [tab, setTab] = useState("HOUSE"); // HOUSE | ROOM
  const [saving, setSaving] = useState(false);

  // 1) 내 건물 목록 로드
  useEffect(() => {
    (async () => {
      try {
        const list = await getMyHouses();
        setHouses(list || []);
      } catch (err) {
        console.error("getMyHouses failed status:", err?.response?.status);
        console.error("getMyHouses response data:", err?.response?.data); // ✅ 이게 핵심
        console.error(err);
        alert("내 건물 목록 조회 실패(콘솔의 response data 확인)");
      }
    })();
  }, []);

  // 2) house 선택 → house detail/images/rooms 로드
  useEffect(() => {
    if (!selectedHouseNo) return;

    (async () => {
      setSelectedRoomNo("");
      setRoom(null);
      setRoomImages([]);
      setDeleteRoomImageNos([]);
      setNewRoomImages([]);

      const [h, imgs, roomList] = await Promise.all([
        getHouse(selectedHouseNo),
        getHouseImages(selectedHouseNo),
        getRoomByHouseNo(selectedHouseNo),
      ]);

      setHouse(h);
      setHouseImages(imgs || []);
      setDeleteHouseImageNos([]);
      setNewHouseImages([]);

      setRooms(roomList || []);
    })();
  }, [selectedHouseNo]);

  // 3) room 선택 → room detail/images 로드
  useEffect(() => {
    if (!selectedRoomNo) return;

    (async () => {
      const [r, imgs] = await Promise.all([
        getRoom(selectedRoomNo),
        getRoomImages(selectedRoomNo),
      ]);

      setRoom(r);
      setRoomImages(imgs || []);
      setDeleteRoomImageNos([]);
      setNewRoomImages([]);
    })();
  }, [selectedRoomNo]);

  // ---- handlers ----
  function toggleDeleteHouseImage(id, checked) {
    setDeleteHouseImageNos((prev)=>{
      if(!checked) return prev.filter((x)=>x !== id);
      return prev.includes(id) ? prev : [...prev, id]
    })
  }
  function toggleDeleteRoomImage(id, checked) {
    setDeleteRoomImageNos((prev)=>{
      if(!checked) return prev.filter((x)=> x !== id);
      return prev.includes(id) ? prev : [...prev, id]
    });
  }

  // HouseForm onChange는 기존 구현을 그대로 재사용(너가 이미 만들어둔 방식)
  function handleHouseChange(e) {
    const { name, value } = e.target;
    setHouse((cur) => {
      if (!cur) return cur;

      const numberFields = new Set(["houseCompletionYear","houseFloors","houseHouseHolds","houseParkingMax"]);
      if (numberFields.has(name)) return { ...cur, [name]: value === "" ? null : Number(value) };

      const boolFields = new Set(["houseElevatorYn","housePetYn","houseFemaleLimit"]);
      if (boolFields.has(name)) return { ...cur, [name]: value === "true" };

      return { ...cur, [name]: value };
    });
  }

  function handleRoomChange(e) {
    const { name, value } = e.target;
    setRoom((cur) => {
      if (!cur) return cur;

      const numFields = new Set(["roomDeposit","roomMonthly","roomArea","roomRoomCount","roomBathCount"]);
      if (numFields.has(name)) return { ...cur, [name]: value === "" ? null : Number(value) };

      const boolFields = new Set(["roomEmptyYn"]);
      if (boolFields.has(name)) return { ...cur, [name]: value === "true" };

      return { ...cur, [name]: value };
    });
  }

  async function submitHouse(e) {
    e.preventDefault();
    if (!selectedHouseNo || !house) return;
    if (saving) return;

    setSaving(true);
    try {
      await modifyHouse(selectedHouseNo, Object.entries(house), deleteHouseImageNos, newHouseImages);
      alert("건물 수정 성공");

      // 리프레시: 변경 후 재조회
      const [h, imgs] = await Promise.all([getHouse(selectedHouseNo), getHouseImages(selectedHouseNo)]);
      setHouse(h);
      setHouseImages(imgs || []);
      setDeleteHouseImageNos([]);
      setNewHouseImages([]);
    } catch (err) {
      console.error(err);
      alert("건물 수정 실패(콘솔 확인)");
    } finally {
      setSaving(false);
    }
  }

  async function submitRoom(e) {
    e.preventDefault();
    if (!selectedRoomNo || !room) return;
    if (saving) return;

    setSaving(true);
    try {
      await modifyRoom(selectedRoomNo, Object.entries(room), deleteRoomImageNos, newRoomImages);
      alert("방 수정 성공");

      const [r, imgs] = await Promise.all([getRoom(selectedRoomNo), getRoomImages(selectedRoomNo)]);
      setRoom(r);
      setRoomImages(imgs || []);
      setDeleteRoomImageNos([]);
      setNewRoomImages([]);
    } catch (err) {
      console.error(err);
      alert("방 수정 실패(콘솔 확인)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>목록조회 / 수정</h2>

      <div className={styles.layout}>
        {/* 좌측: 내 건물 + 방 목록 */}
        <aside className={styles.left}>
          <div className={styles.blockTitle}>내 건물</div>
          <div className={styles.list}>
            {houses.map((h) => (
              <button
                key={h.houseNo}
                className={h.houseNo === selectedHouseNo ? styles.selectedBtn : styles.btn}
                onClick={() => setSelectedHouseNo(h.houseNo)}
              >
                {h.houseName ?? h.houseNo}
              </button>
            ))}
          </div>

          <div className={styles.blockTitle} style={{ marginTop: 14 }}>이 건물의 방</div>
          <div className={styles.list}>
            {rooms.map((r) => (
              <button
                key={r.roomNo}
                className={r.roomNo === selectedRoomNo ? styles.selectedBtn : styles.btn}
                onClick={() => { setTab("ROOM"); setSelectedRoomNo(r.roomNo); }}
                disabled={!selectedHouseNo}
              >
                {r.roomName ?? r.roomNo} {r.roomEmptyYn === false ? "(거주중)" : ""}
              </button>
            ))}
          </div>
        </aside>

        {/* 우측: 수정 탭 */}
        <main className={styles.right}>
          <div className={styles.tabs}>
            <button className={tab === "HOUSE" ? styles.tabActive : styles.tab} onClick={() => setTab("HOUSE")}>
              건물 수정
            </button>
            <button className={tab === "ROOM" ? styles.tabActive : styles.tab} onClick={() => setTab("ROOM")} disabled={!selectedHouseNo}>
              방 수정
            </button>
          </div>

          {tab === "HOUSE" && (
            <>
              {!selectedHouseNo && <div className={styles.empty}>왼쪽에서 건물을 선택하세요.</div>}
              {selectedHouseNo && house && (
                <>
                  <div className={styles.sectionTitle}>기존 건물 사진 삭제 선택</div>
                  <ExistingImagePicker
                    items={houseImages}
                    baseUrl="/upload_files/house_image"
                    selectedIds={deleteHouseImageNos}
                    onToggle={toggleDeleteHouseImage}
                  />

                  <div className={styles.sectionTitle}>건물 정보 수정 / 새 사진 추가</div>
                  <HouseForm
                    house={house}
                    images={newHouseImages}
                    onChange={handleHouseChange}
                    onAddImages={(files) => setNewHouseImages((p) => [...p, ...files])}
                    onRemoveImage={(idx) => setNewHouseImages((p) => p.filter((_, i) => i !== idx))}
                    onSubmit={submitHouse}
                    onSearchAddress={() => alert("주소검색은 추후")}
                  />
                </>
              )}
            </>
          )}

          {tab === "ROOM" && (
            <>
              {!selectedRoomNo && <div className={styles.empty}>왼쪽에서 방을 선택하세요.</div>}
              {selectedRoomNo && room && (
                <>
                  <div className={styles.sectionTitle}>기존 방 사진 삭제 선택</div>
                  <ExistingImagePicker
                    items={roomImages}
                    baseUrl="/upload_files/room_image"
                    selectedIds={deleteRoomImageNos}
                    onToggle={toggleDeleteRoomImage}
                  />

                  <div className={styles.sectionTitle}>방 정보 수정 / 새 사진 추가</div>
                  <RoomForm
                    room={room}
                    images={newRoomImages}
                    onChange={handleRoomChange}
                    onToggleOption={(opt, checked) => {
                      setRoom((cur) => {
                        let arr = String(cur.roomOptions || "").split(",").map(v=>v.trim()).filter(Boolean);
                        if (checked) { if (!arr.includes(opt)) arr.push(opt); }
                        else arr = arr.filter(v => v !== opt);
                        return { ...cur, roomOptions: arr.join(",") };
                      });
                    }}
                    onAddImages={(files) => setNewRoomImages((p) => [...p, ...files])}
                    onRemoveImage={(idx) => setNewRoomImages((p) => p.filter((_, i) => i !== idx))}
                    onSubmit={submitRoom}
                  />
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}