import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { ROUTES } from '../constants/routes';
import styles from './ConvenienceEntryCard.module.css';

export default function ConvenienceEntryCard() {
  const { isAuthed } = useAuth();

  const destination = isAuthed
    ? ROUTES.CONVENIENCE.HOME
    : ROUTES.AUTH.LOGIN;
  const destinationState = isAuthed
    ? undefined
    : {
        from: {
          pathname: ROUTES.CONVENIENCE.HOME,
        },
      };

  return (
    <section className={styles.section} aria-label="편의기능 시작">
      <div className={styles.card}>
        <div className={styles.textBlock}>
          <span className={styles.badge}>쉬운 메뉴 안내</span>
          <h2 className={styles.title}>처음이어도 쉽게 이용할 수 있어요.</h2>
          <p className={styles.description}>
            방 찾기와 주요 메뉴를 한 단계씩 편하게 안내해드려요.
          </p>
        </div>

        <div className={styles.actions}>
          <Link
            to={destination}
            state={destinationState}
            className={styles.primaryAction}
          >
            편의기능 열기
          </Link>
        </div>
      </div>
    </section>
  );
}
