import styles from "./CenteredPageLayout.module.css";

export default function CenteredPageLayout({ children, left, right }) {
  return (
    <div className={styles.outer}>
      <aside className={styles.side}>{left}</aside>
      <main className={styles.center}>{children}</main>
      <aside className={styles.side}>{right}</aside>
    </div>
  );
}
