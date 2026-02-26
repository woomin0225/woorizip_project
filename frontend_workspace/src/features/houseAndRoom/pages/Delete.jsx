import { useEffect, useMemo, useState } from "react";
import styles from "./Delete.module.css";

import { getMyHouses, getRoomByHouseNo, deleteHouse } from "../api/houseApi";
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

export default function Delete() {
  const [houses, setHouses] = useState([]);
  const [selectedHouseNo, setSelectedHouseNo] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState(null);
  // target 예시:
  // { type: "HOUSE", houseNo, houseName }
  // { type: "ROOM", roomNo, roomName, houseNo }

  // 최초: 내 건물 로딩
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await getMyHouses();
        setHouses(list || []);
      } catch (err) {
        alert(pickErrMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // house 선택 시: 해당 house의 방 로딩
  useEffect(() => {
    if (!selectedHouseNo) {
      setRooms([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const list = await getRoomByHouseNo(selectedHouseNo);
        setRooms(list || []);
      } catch (err) {
        alert(pickErrMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedHouseNo]);

  const selectedHouse = useMemo(
    () => houses.find((h) => h.houseNo === selectedHouseNo),
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

  function openDeleteRoom(r) {
    setTarget({
      type: "ROOM",
      roomNo: r.roomNo,
      roomName: r.roomName,
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

        // ✅ 방 삭제 후: 현재 방 목록 갱신
        const list = await getRoomByHouseNo(target.houseNo);
        setRooms(list || []);
        alert("방이 삭제되었습니다.");
      }

      if (target.type === "HOUSE") {
        await deleteHouse(target.houseNo);

        // ✅ 건물 삭제 후: 내 건물 목록 갱신 + 선택 초기화
        const list = await getMyHouses();
        setHouses(list || []);
        setSelectedHouseNo("");
        setRooms([]);
        alert("건물이 삭제되었습니다.");
      }
    } catch (err) {
      // 보통 “하위 방이 남아있으면 건물 삭제 불가” 같은 메시지가 여기로 옴
      alert(pickErrMsg(err));
    } finally {
      setLoading(false);
      setModalOpen(false);
      setTarget(null);
    }
  }

  const modalTitle =
    target?.type === "HOUSE" ? "건물 삭제" : "방 삭제";

  const modalMessage =
    target?.type === "HOUSE"
      ? `건물(${target.houseName ?? target.houseNo})을(를) 삭제할까요?\n(건물에 속한 방이 남아있으면 삭제가 실패할 수 있어요.)`
      : `방(${target.roomName ?? target.roomNo})을(를) 삭제할까요?`;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>삭제</h2>

      <div className={styles.layout}>
        {/* 좌측: 내 건물 목록 */}
        <aside className={styles.left}>
          <div className={styles.blockTitle}>내 건물</div>

          {houses.length === 0 && !loading && (
            <div className={styles.empty}>삭제할 건물이 없습니다.</div>
          )}

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

          <button
            type="button"
            className={styles.dangerBtn}
            disabled={!selectedHouseNo || loading}
            onClick={openDeleteHouse}
          >
            선택한 건물 삭제
          </button>
        </aside>

        {/* 우측: 방 목록 + 방 삭제 */}
        <main className={styles.right}>
          <div className={styles.blockTitle}>
            {selectedHouseNo ? `방 목록 (${selectedHouse?.houseName ?? selectedHouseNo})` : "방 목록"}
          </div>

          {!selectedHouseNo && <div className={styles.empty}>왼쪽에서 건물을 선택하세요.</div>}

          {selectedHouseNo && rooms.length === 0 && !loading && (
            <div className={styles.empty}>이 건물에 등록된 방이 없습니다.</div>
          )}

          {selectedHouseNo && rooms.length > 0 && (
            <div className={styles.roomList}>
              {rooms.map((r) => (
                <div key={r.roomNo} className={styles.roomRow}>
                  <div>
                    <div className={styles.roomName}>{r.roomName ?? r.roomNo}</div>
                    <div className={styles.roomSub}>
                      {r.roomMethod} / 보증금 {r.roomDeposit ?? 0} / 월세 {r.roomMonthly ?? 0} /{" "}
                      {r.roomEmptyYn ? "공실" : "거주중"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.smallDangerBtn}
                    disabled={loading}
                    onClick={() => openDeleteRoom(r)}
                  >
                    방 삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {loading && <div className={styles.loading}>처리 중…</div>}
        </main>
      </div>

      <DeleteConfirmModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onCancel={() => { setModalOpen(false); setTarget(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}