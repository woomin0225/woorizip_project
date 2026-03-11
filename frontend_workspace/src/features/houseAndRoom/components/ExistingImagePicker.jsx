import styles from "./ExistingImagePicker.module.css";

function getId(img) {
  return (
    img.houseImageNo ??
    img.roomImageNo ??
    img.imageNo ??
    img.id ??
    null
  );
}

function getStoredName(img) {
  return (
    img.houseStoredImageName ??
    img.roomStoredImageName ??
    img.storedImageName ??
    img.imageName ??
    img.fileName ??
    img.name ??
    null
  );
}

export default function ExistingImagePicker({
  items = [],
  baseUrl,
  selectedIds = [],
  onToggle,
}) {
  if (!items || items.length === 0) {
    return <div className={styles.empty}>등록된 사진이 없습니다.</div>;
  }

  return (
    <div className={styles.grid}>
      {items.map((img) => {
        const id = getId(img);
        const stored = getStoredName(img);
        if (id == null || !stored) return null;

        const checked = selectedIds.includes(Number(id));

        return (
          <label key={id} className={styles.card}>
            <img src={`${baseUrl}/${stored}`} alt={stored} />
            <div className={styles.row}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle?.(Number(id), e.target.checked)}
              />
              <span>삭제</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}