import { useEffect, useMemo, useState } from "react";
import styles from "./Delete.module.css";

import { deleteHouse, getMyHouses, getRoomByHouseNo } from "../api/houseApi";
import { deleteRoom } from "../api/roomApi";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

function pickErrMsg(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.data ||
    err?.message ||
    "요청 처리 중 오류가 발생했습니다."
  );
}

function isRoomEmpty(room) {
  if (typeof room?.roomEmptyYn === "boolean") return room.roomEmptyYn;
  if (typeof room?.empty === "boolean") return room.empty;
  if (room?.roomEmptyYn === 1 || room?.roomEmptyYn === "1") return true;
  if (room?.roomEmptyYn === 0 || room?.roomEmptyYn === "0") return false;
  if (room?.empty === 1 || room?.empty === "1") return true;
  if (room?.empty === 0 || room?.empty === "0") return false;
  return false;
}

export default function Delete() {
  const [houses, setHouses] = useState([]);
  const [selectedHouseNo, setSelectedHouseNo] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await getMyHouses();
        setHouses((list || []).filter(Boolean));
      } catch (err) {
        alert(pickErrMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedHouseNo) {
      setRooms([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const list = await getRoomByHouseNo(selectedHouseNo);
        setRooms((list || []).filter(Boolean));
      } catch (err) {
        alert(pickErrMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedHouseNo]);

  const selectedHouse = useMemo(
    () => houses.find((house) => house.houseNo === selectedHouseNo),
    [houses, selectedHouseNo]
  );

  function openDeleteHouse() {
    if (!selectedHouse) return;

    setTarget({
      type: "HOUSE",
      houseNo: selectedHouse.houseNo,
      houseName: selectedHouse.houseName,
    });
    setModalOpen(true);
  }

  function openDeleteRoom(room) {
    if (!isRoomEmpty(room)) return;

    setTarget({
      type: "ROOM",
      roomNo: room.roomNo,
      roomName: room.roomName,
      houseNo: selectedHouseNo,
    });
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!target) return;

    try {
      setLoading(true);

      if (target.type === "ROOM") {
        await deleteRoom(target.roomNo);

        const list = await getRoomByHouseNo(target.houseNo);
        setRooms((list || []).filter(Boolean));
        alert("방이 삭제되었습니다.");
      }

      if (target.type === "HOUSE") {
        await deleteHouse(target.houseNo);

        const list = await getMyHouses();
        setHouses((list || []).filter(Boolean));
        setSelectedHouseNo("");
        setRooms([]);
        alert("건물이 삭제되었습니다.");
      }
    } catch (err) {
      alert(pickErrMsg(err));
    } finally {
      setLoading(false);
      setModalOpen(false);
      setTarget(null);
    }
  }

  const modalTitle =
    target?.type === "HOUSE" ? "건물 삭제" : target?.type === "ROOM" ? "방 삭제" : "삭제";

  const modalMessage = !target
    ? ""
    : target.type === "HOUSE"
      ? `건물(${target.houseName ?? target.houseNo})을(를) 삭제할까요?\n(건물에 속한 방도 삭제됩니다.)`
      : `방(${target.roomName ?? target.roomNo})을(를) 삭제할까요?`;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>삭제</h2>

      <div className={styles.layout}>
        <aside className={styles.left}>
          <div className={styles.blockTitle}>내 건물</div>

          {houses.length === 0 && !loading && (
            <div className={styles.empty}>삭제할 건물이 없습니다.</div>
          )}

          <div className={styles.list}>
            {houses.map((house) => (
              <button
                key={house.houseNo}
                className={house.houseNo === selectedHouseNo ? styles.selectedBtn : styles.btn}
                onClick={() => setSelectedHouseNo(house.houseNo)}
              >
                {house.houseName ?? house.houseNo}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.dangerBtn}
            disabled={!selectedHouseNo || loading}
            onClick={openDeleteHouse}
          >
            선택한 건물 삭제
          </button>
        </aside>

        <main className={styles.right}>
          <div className={styles.blockTitle}>
            {selectedHouseNo
              ? `방 목록 (${selectedHouse?.houseName ?? selectedHouseNo})`
              : "방 목록"}
          </div>

          {!selectedHouseNo && (
            <div className={styles.empty}>왼쪽에서 건물을 선택하세요.</div>
          )}

          {selectedHouseNo && rooms.length === 0 && !loading && (
            <div className={styles.empty}>이 건물에 등록된 방이 없습니다.</div>
          )}

          {selectedHouseNo && rooms.length > 0 && (
            <div className={styles.roomList}>
              {rooms.filter(Boolean).map((room) => {
                const deletable = isRoomEmpty(room);

                return (
                  <div key={room.roomNo} className={styles.roomRow}>
                    <div>
                      <div className={styles.roomName}>{room.roomName ?? room.roomNo}</div>
                      <div className={styles.roomSub}>
                        {room.roomMethod} / 보증금 {room.roomDeposit ?? 0} / 월세{" "}
                        {room.roomMonthly ?? 0} / {deletable ? "공실" : "입주 중"}
                      </div>
                      {!deletable && (
                        <div className={styles.disabledHint}>
                          입주 중인 방은 삭제할 수 없습니다.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.smallDangerBtn}
                      disabled={loading || !deletable}
                      title={!deletable ? "입주 중인 방은 삭제할 수 없습니다." : undefined}
                      onClick={() => openDeleteRoom(room)}
                    >
                      방 삭제
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {loading && <div className={styles.loading}>처리 중...</div>}
        </main>
      </div>

      <DeleteConfirmModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onCancel={() => {
          setModalOpen(false);
          setTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
