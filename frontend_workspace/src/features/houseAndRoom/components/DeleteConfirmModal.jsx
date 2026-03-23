// 삭제 확인 modal
import styles from "./DeleteConfirmModal.module.css";

export default function DeleteConfirmModal({
  open,
  title = "삭제",
  message = "정말 삭제할까요?",
  warning = "",
  confirmText = "삭제",
  cancelText = "취소",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.msg}>{message}</p>
        {warning ? <div className={styles.warning}>{warning}</div> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
