import React from 'react';
import { Container } from 'reactstrap';
import { Link } from 'react-router-dom';
import ConvenienceNavigator from '../components/ConvenienceNavigator';
import { getMyInfo, isLessorType } from '../../features/user/api/userAPI';
import styles from './ConveniencePage.module.css';

function pickFirst(...values) {
  return (
    values.find((value) => value !== undefined && value !== null && value !== '') ||
    ''
  );
}

export default function ConveniencePage() {
  const [profile, setProfile] = React.useState({
    loading: true,
    error: '',
    userName: '',
    isLessor: false,
  });

  React.useEffect(() => {
    let mounted = true;

    getMyInfo()
      .then((info) => {
        if (!mounted) return;

        if (info?.type) {
          localStorage.setItem('userType', String(info.type));
          sessionStorage.setItem('userType', String(info.type));
        }

        setProfile({
          loading: false,
          error: '',
          userName: pickFirst(
            info?.name,
            sessionStorage.getItem('userName'),
            localStorage.getItem('userName')
          ),
          isLessor: isLessorType(info?.type),
        });
      })
      .catch((error) => {
        if (!mounted) return;
        setProfile({
          loading: false,
          error: error?.message || '편의기능 정보를 불러오지 못했습니다.',
          userName: pickFirst(
            sessionStorage.getItem('userName'),
            localStorage.getItem('userName')
          ),
          isLessor: false,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const pageTitle = profile.isLessor
    ? '관리할 메뉴를 쉽게 찾아보세요.'
    : '원하는 메뉴를 쉽게 찾아보세요.';
  const pageDescription = profile.isLessor
    ? '승인 관리, 매물 관리, 시설 관리처럼 자주 쓰는 업무를 큰 버튼으로 편하게 찾을 수 있습니다.'
    : '매물 찾기, 신청 현황, 공용시설, 내 정보를 큰 버튼으로 편하게 찾을 수 있습니다.';

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <Container>
          <div className={styles.heroCard}>
            <span className={styles.badge}>편의기능</span>
            <h1 className={styles.title}>{pageTitle}</h1>
            <p className={styles.description}>{pageDescription}</p>
            <Link to="/" className={styles.backLink}>
              홈으로 돌아가기
            </Link>
          </div>
        </Container>
      </section>

      <section className={styles.contentSection}>
        <Container>
          {profile.error && <p className={styles.message}>{profile.error}</p>}
          {profile.loading ? (
            <p className={styles.message}>편의기능을 준비하는 중입니다...</p>
          ) : (
            <ConvenienceNavigator
              userName={profile.userName}
              isLessor={profile.isLessor}
              defaultOpen
              hideToggle
              hideHero
            />
          )}
        </Container>
      </section>
    </main>
  );
}
