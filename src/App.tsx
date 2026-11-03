/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BootScreen } from './components/boot/BootScreen';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import { v86Service } from './services/v86Service';
import { WindowId } from './types';

type ViewMode = 'boot' | 'desktop';

export default function App() {
  const [view, setView] = useState<ViewMode>('desktop');
  const [targetApp, setTargetApp] = useState<WindowId | undefined>('terminal');

  useEffect(() => {
    v86Service.start();
  }, []);

  const handleBootComplete = () => {
    setView('desktop');
  };

  const handleReboot = () => {
    setView('boot');
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 font-sans">
      {view === 'boot' && <BootScreen onBootComplete={handleBootComplete} />}

      {view === 'desktop' && (
        <DesktopEnvironment
          defaultOpenApp={targetApp}
          onBackToHome={handleReboot}
        />
      )}
    </main>
  );
}
