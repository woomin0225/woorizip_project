// 삭제 확인 modal
import styles from "./DeleteConfirmModal.module.css";

export default function DeleteConfirmModal({ open, title = "삭제", message = "삭제할까요?", onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.msg}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>취소</button>
          <button className={styles.confirm} onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  );
}