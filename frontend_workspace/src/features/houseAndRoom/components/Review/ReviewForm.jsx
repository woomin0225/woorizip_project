import { useState } from "react";
import styles from "./ReviewForm.module.css";

export default function ReviewForm({
  initialRating = 5,
  initialContent = "",
  submitText = "저장",
  onSubmit,
  onCancel,
}) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!content.trim()) return setError("리뷰 내용을 입력해주세요.");
    if (rating < 1 || rating > 5) return setError("평점은 1~5 사이여야 합니다.");

    setSaving(true);
    try {
      await onSubmit?.({ rating, reviewContent: content });
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>평점</label>
      <select className={styles.select} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      <label className={styles.label}>내용</label>
      <textarea
        className={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="리뷰 내용을 입력하세요"
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>취소</button>
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? "저장중..." : submitText}
        </button>
      </div>
    </form>
  );
}