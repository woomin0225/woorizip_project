// src/app/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

import styles from './MainLayout.module.css';
import Header from './components/Header';
import Footer from './components/Footer';
import OrchestrateQuickAgent from '../../features/aiAssistant/components/OrchestrateQuickAgent';
import ScreenReaderVoicePrompt from '../../features/aiAssistant/components/ScreenReaderVoicePrompt';
import VoicePageAnnouncer from '../../features/aiAssistant/components/VoicePageAnnouncer';
import { VoiceModeProvider } from '../../features/aiAssistant/context/VoiceModeContext';

export default function MainLayout() {
  return (
    <VoiceModeProvider>
      <div className={styles.wrapper}>
        <ScreenReaderVoicePrompt />
        <VoicePageAnnouncer />
        <Header />

        <main className={styles.main}>
          <Outlet />
        </main>

        <Footer />
        <OrchestrateQuickAgent />
      </div>
    </VoiceModeProvider>
  );
}
