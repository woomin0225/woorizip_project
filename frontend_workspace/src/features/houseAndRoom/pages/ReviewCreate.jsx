import { useNavigate, useParams } from "react-router-dom";
import styles from "./ReviewCreate.module.css";
import ReviewForm from "../components/Review/ReviewForm";
import { createRoomReview } from "../api/roomApi";

export default function ReviewCreate() {
  const { roomNo } = useParams();
  const navigate = useNavigate();

  async function onSubmit(payload) {
    // payload: { rating, reviewContent }
    await createRoomReview(roomNo, payload);
    navigate(`/rooms/${roomNo}`);
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>리뷰 작성</h2>
      <ReviewForm submitText="등록" onSubmit={onSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}