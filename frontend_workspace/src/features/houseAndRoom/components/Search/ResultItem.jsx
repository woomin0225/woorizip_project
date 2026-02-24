import { useEffect, useState } from "react";
import styles from "./ResultItem.module.css";

export default function ResultItem({ roomSearchResponse, wished = false, onToggleWish }) {
  const images = (roomSearchResponse.imageNames || []).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWished, setIsWished] = useState(!!wished);

  useEffect(() => {
    setCurrentIndex(0);
    setIsWished(!!wished);
  }, [roomSearchResponse.roomNo, wished]);

  const total = images.length;

  function prevClick() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }
  function nextClick() {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }

  function toggleWish(e) {
    e.stopPropagation();
    e.preventDefault();
    const next = !isWished;
    setIsWished(next);
    if (onToggleWish) onToggleWish(roomSearchResponse.roomNo, next);
  }

  function imgUrl(imageName) {
    if (!imageName) return "#";
    if (imageName.startsWith("http")) return imageName;
    return `C:/upload_files/room_image${imageName}`;
  }

  return (
    <div className={styles.card}>
      {/* 오른쪽 위 찜 버튼 */}
      <button className={styles.wishBtn} onClick={toggleWish} aria-label="찜">
        {isWished ? "★" : "☆"}
      </button>
      <table>
        <tbody>
          <tr>
            <td>
              <div className={styles["slider-container"]}>
                <div
                  className={styles.slides}
                  style={{ transform: `translateX(-${currentIndex * 500}px)` }}
                >
                  {images.map((imageName, index) => (
                    <img key={`${imageName}-${index}`} src={imgUrl(imageName)} alt={`${index + 1}`} />
                  ))}
                </div>
              </div>

              <button onClick={prevClick} disabled={currentIndex === 0}>◀</button>
              <button onClick={nextClick} disabled={currentIndex >= total - 1}>▶</button>
              <br />
              {roomSearchResponse.roomImageCount}개 사진
            </td>

            <td>
              <table>
                <tbody>
                  <tr>
                    <td>
                      {/* 상세 이동 뼈대 */}
                      <Link to={`/rooms/${roomSearchResponse.roomNo}`}>
                        {roomSearchResponse.roomName}
                      </Link>
                      {" | "}
                      {roomSearchResponse.roomUpdatedAt ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {roomSearchResponse.roomMethod} | {roomSearchResponse.roomDeposit ?? ""} | {roomSearchResponse.roomMonthly ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {roomSearchResponse.roomArea} | {roomSearchResponse.roomFacing} | {roomSearchResponse.roomRoomCount} |{" "}
                      {roomSearchResponse.roomEmptyYn ? "공실" : "거주중"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

          </tr>
        </tbody>
      </table>
    </div>
  );
}