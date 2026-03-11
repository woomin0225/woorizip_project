import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ReviewModify.module.css";
import ReviewForm from "../components/Review/ReviewForm";
import { modifyRoomReview } from "../api/roomApi";

export default function ReviewModify() {
  const { roomNo, reviewNo } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  // ReviewList에서 Link state로 넘겨준 review 사용
  const review = state?.review ?? state?.r;
  const initialRating = review?.rating ?? 5;
  const initialContent = review?.reviewContent ?? "";

  async function onSubmit(payload) {
    await modifyRoomReview(roomNo, reviewNo, payload);
    navigate(-1);
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>리뷰 수정</h2>

      {!review && (
        <div className={styles.warn}>
          리뷰 정보를 전달받지 못했습니다. (ReviewList에서 state로 review를 넘겨야 합니다.)
        </div>
      )}

      <ReviewForm
        initialRating={initialRating}
        initialContent={initialContent}
        submitText="수정"
        onSubmit={onSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
