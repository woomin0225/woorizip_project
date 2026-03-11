// src/features/houseAndRoom/pages/CenterDetail.jsx
// Detail.jsx의 CenteredPageLayout 적용 샘플

import styles from "./CenterDetail.module.css";
import Detail from './Detail';
import CenteredPageLayout from '../../../app/layouts/CenteredPageLayout';

function SideBanner() {
  return <div className={styles.banner}>배너 자리</div>;
}

export default function CenterDetail() {
  return (
    <CenteredPageLayout left={<SideBanner />} right={<SideBanner />}>
      <div className={styles.content}>
        {/* 여기 안에 기존 Detail.jsx의 본문(섹션들) 넣기 */}
        <Detail/>
      </div>
    </CenteredPageLayout>
  );
}
