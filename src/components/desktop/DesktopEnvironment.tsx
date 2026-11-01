import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Code2,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Home,
  Sliders,
  Terminal,
  Trash2,
} from 'lucide-react';
import { WindowId, WindowState } from '../../types';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowFrame } from './WindowFrame';
import { ContextMenu } from './ContextMenu';
import { AppLauncher } from './AppLauncher';

// App Components
import { TerminalApp } from '../apps/TerminalApp';
import { FileManagerApp } from '../apps/FileManagerApp';
import { TextEditorApp } from '../apps/TextEditorApp';
import { ProgrammingLabApp } from '../apps/ProgrammingLabApp';
import { SystemMonitorApp } from '../apps/SystemMonitorApp';
import { ReferenceApp } from '../apps/ReferenceApp';
import { LearningLabApp } from '../apps/LearningLabApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { SettingsApp } from '../apps/SettingsApp';
import { BrowserApp } from '../apps/BrowserApp';

interface DesktopEnvironmentProps {
  onBackToHome: () => void;
  defaultOpenApp?: WindowId;
}

export const DesktopEnvironment: React.FC<DesktopEnvironmentProps> = ({
  onBackToHome,
  defaultOpenApp = 'terminal',
}) => {
  const [wallpaper, setWallpaper] = useState<string>(
    '/src/assets/images/ubuntu_jammy_wallpaper_1793457587205.jpg'
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [dockPosition, setDockPosition] = useState<'left' | 'bottom'>('left');
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [editorInitialPath, setEditorInitialPath] = useState<string | undefined>(undefined);
  const [terminalCommandQueue, setTerminalCommandQueue] = useState<string | undefined>(undefined);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Windows State
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'terminal',
      title: 'Terminal (sheikh@linux:~)',
      isOpen: defaultOpenApp === 'terminal',
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      position: { x: 80, y: 50 },
      size: { width: 780, height: 490 },
    },
    {
      id: 'files',
      title: 'Files (Linux Filesystem Explorer)',
      isOpen: defaultOpenApp === 'files',
      isMinimized: false,
      isMaximized: false,
      zIndex: 9,
      position: { x: 120, y: 70 },
      size: { width: 750, height: 480 },
    },
    {
      id: 'editor',
      title: 'Text Editor (Gedit)',
      isOpen: defaultOpenApp === 'editor',
      isMinimized: false,
      isMaximized: false,
      zIndex: 8,
      position: { x: 160, y: 90 },
      size: { width: 720, height: 480 },
    },
    {
      id: 'ide',
      title: 'C & Script Programming Lab',
      isOpen: defaultOpenApp === 'ide',
      isMinimized: false,
      isMaximized: false,
      zIndex: 11,
      position: { x: 100, y: 60 },
      size: { width: 840, height: 530 },
    },
    {
      id: 'lab',
      title: 'Linux Practice Challenges & MCQs',
      isOpen: defaultOpenApp === 'lab',
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      position: { x: 140, y: 70 },
      size: { width: 800, height: 520 },
    },
    {
      id: 'monitor',
      title: 'Linux System Monitor',
      isOpen: defaultOpenApp === 'monitor',
      isMinimized: false,
      isMaximized: false,
      zIndex: 7,
      position: { x: 200, y: 110 },
      size: { width: 720, height: 460 },
    },
    {
      id: 'reference',
      title: 'Linux Commands Manual (50+ Reference)',
      isOpen: defaultOpenApp === 'reference',
      isMinimized: false,
      isMaximized: false,
      zIndex: 7,
      position: { x: 180, y: 90 },
      size: { width: 750, height: 480 },
    },
    {
      id: 'browser',
      title: 'Web Browser — Linux Documentation',
      isOpen: defaultOpenApp === 'browser',
      isMinimized: false,
      isMaximized: false,
      zIndex: 6,
      position: { x: 160, y: 80 },
      size: { width: 780, height: 500 },
    },
    {
      id: 'calc',
      title: 'Calculator (Standard / Programmer)',
      isOpen: defaultOpenApp === 'calc',
      isMinimized: false,
      isMaximized: false,
      zIndex: 5,
      position: { x: 240, y: 120 },
      size: { width: 340, height: 420 },
    },
    {
      id: 'settings',
      title: 'System Settings',
      isOpen: defaultOpenApp === 'settings',
      isMinimized: false,
      isMaximized: false,
      zIndex: 6,
      position: { x: 200, y: 100 },
      size: { width: 680, height: 470 },
    },
  ]);

  // Bring window to front
  const focusWindow = (id: WindowId) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 1);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w));
    });
  };

  const openApp = (id: WindowId) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 1);
      const target = prev.find((w) => w.id === id);

      // If already open, visible, and currently active on top, toggle minimize
      if (target && target.isOpen && !target.isMinimized && target.zIndex === maxZ) {
        return prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w));
      }

      // Otherwise open or unminimize and elevate to top
      return prev.map((w) =>
        w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: maxZ + 1 } : w
      );
    });
  };

  const closeWindow = (id: WindowId) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false, isMinimized: false } : w)));
  };

  const minimizeWindow = (id: WindowId) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  };

  const toggleMaximizeWindow = (id: WindowId) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const updateWindowPos = (id: WindowId, pos: { x: number; y: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position: pos } : w)));
  };

  const updateWindowSize = (id: WindowId, size: { width: number; height: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  };

  const handleOpenFileInEditor = (path: string) => {
    setEditorInitialPath(path);
    openApp('editor');
  };

  const handleRunInTerminal = (cmd: string) => {
    setTerminalCommandQueue(cmd);
    openApp('terminal');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeWindow = windows.find((w) => w.isOpen && !w.isMinimized);

  // Desktop Icons
  const desktopShortcuts = [
    { id: 'terminal' as WindowId, label: 'Terminal', icon: Terminal, color: 'text-orange-400' },
    { id: 'files' as WindowId, label: 'File Manager', icon: Folder, color: 'text-orange-400' },
    { id: 'ide' as WindowId, label: 'C Programming', icon: Code2, color: 'text-emerald-400' },
    { id: 'lab' as WindowId, label: 'Practice Lab', icon: GraduationCap, color: 'text-yellow-400' },
    { id: 'reference' as WindowId, label: 'Command Library', icon: BookOpen, color: 'text-cyan-400' },
    { id: 'monitor' as WindowId, label: 'System Monitor', icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <div
      onClick={() => setContextMenu(null)}
      onContextMenu={handleContextMenu}
      className={`relative w-screen h-screen overflow-hidden flex flex-col font-sans select-none ${
        isDarkMode ? 'dark' : ''
      }`}
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Panel */}
      <TopBar
        activeWindowTitle={activeWindow?.title}
        onToggleLauncher={() => setIsLauncherOpen(!isLauncherOpen)}
        onOpenApp={openApp}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isDarkMode={isDarkMode}
        onToggleDarkMode={setIsDarkMode}
      />

      {/* Main Desktop Area with Dock */}
      <div
        className={`flex-1 relative flex overflow-hidden ${
          dockPosition === 'bottom' ? 'flex-col justify-between' : 'flex-row'
        }`}
      >
        {/* Left Dock (if position is left) */}
        {dockPosition === 'left' && (
          <Dock
            position="left"
            windows={windows}
            onOpenApp={openApp}
            onToggleLauncher={() => setIsLauncherOpen(!isLauncherOpen)}
          />
        )}

        {/* Desktop Surface Canvas */}
        <div className="flex-1 relative h-full overflow-hidden">
          {/* Back to Home Page Floating Button on Desktop */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-900 border border-stone-800 text-stone-300 text-xs shadow-lg backdrop-blur-md transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-orange-400" />
              <span>Exit to Home</span>
            </button>
          </div>

          {/* Desktop Icons */}
          <div className="absolute top-4 left-4 grid grid-flow-col grid-rows-6 gap-3 z-10">
            {desktopShortcuts.map((sc) => {
              const IconComp = sc.icon;
              return (
                <div
                  key={sc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openApp(sc.id);
                  }}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-xl hover:bg-white/10 active:bg-orange-600/20 cursor-pointer p-2 text-center transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-900/80 border border-stone-700/60 shadow flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComp className={`w-5 h-5 ${sc.color}`} />
                  </div>
                  <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1 truncate w-full">
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Windows Layer */}
          {windows.map((win) => {
            return (
              <WindowFrame
                key={win.id}
                window={win}
                onFocus={() => focusWindow(win.id)}
                onClose={() => closeWindow(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onToggleMaximize={() => toggleMaximizeWindow(win.id)}
                onUpdatePosition={(pos) => updateWindowPos(win.id, pos)}
                onUpdateSize={(size) => updateWindowSize(win.id, size)}
              >
                {win.id === 'terminal' && (
                  <TerminalApp initialCommand={terminalCommandQueue} />
                )}
                {win.id === 'files' && (
                  <FileManagerApp onOpenFileInEditor={handleOpenFileInEditor} />
                )}
                {win.id === 'editor' && (
                  <TextEditorApp initialPath={editorInitialPath} />
                )}
                {win.id === 'ide' && (
                  <ProgrammingLabApp onOpenInTerminal={handleRunInTerminal} />
                )}
                {win.id === 'lab' && (
                  <LearningLabApp onRunInTerminal={handleRunInTerminal} />
                )}
                {win.id === 'monitor' && <SystemMonitorApp />}
                {win.id === 'reference' && (
                  <ReferenceApp onRunInTerminal={handleRunInTerminal} />
                )}
                {win.id === 'browser' && <BrowserApp />}
                {win.id === 'calc' && <CalculatorApp />}
                {win.id === 'settings' && (
                  <SettingsApp
                    currentWallpaper={wallpaper}
                    onSelectWallpaper={setWallpaper}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={setIsDarkMode}
                    dockPosition={dockPosition}
                    onChangeDockPosition={setDockPosition}
                  />
                )}
              </WindowFrame>
            );
          })}
        </div>

        {/* Bottom Dock (if position is bottom) */}
        {dockPosition === 'bottom' && (
          <Dock
            position="bottom"
            windows={windows}
            onOpenApp={openApp}
            onToggleLauncher={() => setIsLauncherOpen(!isLauncherOpen)}
          />
        )}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={openApp}
        />
      )}

      {/* Application Launcher Overlay */}
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onOpenApp={openApp}
      />
    </div>
  );
};
