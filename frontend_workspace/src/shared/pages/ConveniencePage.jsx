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

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <Container>
          <div className={styles.heroCard}>
            <span className={styles.badge}>편의기능</span>
            <h1 className={styles.title}>원하는 메뉴를 쉽게 찾아보세요.</h1>
            <p className={styles.description}>
              큰 버튼을 순서대로 누르면 필요한 메뉴와 매물을 편하게 찾을 수
              있습니다.
            </p>
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
