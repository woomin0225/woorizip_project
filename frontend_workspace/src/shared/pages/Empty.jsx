import { Link } from 'react-router-dom';
import styles from './Empty.module.css';

export default function Empty() {
  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <h1 className={styles.title}>잘못된 접근입니다.</h1>
        <Link className={styles.link} to="/">
          Home으로 이동
        </Link>
      </div>
    </div>
  );
}
