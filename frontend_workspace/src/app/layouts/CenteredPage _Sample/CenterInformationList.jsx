// src/features/board/Information/pages/CenterDetail.jsx
// InformationList.jsx의 CenteredPageLayout 적용 샘플

import styles from "./CenterInformationList.module.css";
import CenteredPageLayout from '../CenteredPageLayout';
import InformationList from '../../../features/board/pages/Information/InformationList';

function SideBanner() {
  return <div className={styles.banner}>배너 자리</div>;
}

export default function CenterInformationList() {
  return (
    <CenteredPageLayout left={<SideBanner />} right={<SideBanner />}>
      <div className={styles.content}>
        {/* 여기 안에 기존 InformationList.jsx의 본문(섹션들) 넣기 */}
        <InformationList/>
      </div>
    </CenteredPageLayout>
  );
}
