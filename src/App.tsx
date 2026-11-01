/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { BootScreen } from './components/boot/BootScreen';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import { WindowId } from './types';

type ViewMode = 'landing' | 'boot' | 'desktop';

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  const [targetApp, setTargetApp] = useState<WindowId>('terminal');
  const [hasBootedOnce, setHasBootedOnce] = useState<boolean>(false);

  const launchWithApp = (app: WindowId) => {
    setTargetApp(app);
    if (!hasBootedOnce) {
      setView('boot');
    } else {
      setView('desktop');
    }
  };

  const handleBootComplete = () => {
    setHasBootedOnce(true);
    setView('desktop');
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-stone-950 text-stone-100">
      {view === 'landing' && (
        <LandingPage
          onLaunchDesktop={() => launchWithApp('terminal')}
          onLaunchTerminal={() => launchWithApp('terminal')}
          onLaunchLab={() => launchWithApp('lab')}
          onLaunchIDE={() => launchWithApp('ide')}
        />
      )}

      {view === 'boot' && <BootScreen onBootComplete={handleBootComplete} />}

      {view === 'desktop' && (
        <DesktopEnvironment
          defaultOpenApp={targetApp}
          onBackToHome={() => setView('landing')}
        />
      )}
    </main>
  );
}
