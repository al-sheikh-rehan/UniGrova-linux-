import React, { useEffect, useState } from 'react';
import {
  Battery,
  Calendar,
  ChevronDown,
  Globe,
  Maximize2,
  Minimize2,
  Moon,
  Power,
  RefreshCw,
  Sliders,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react';
import { v86Service } from '../../services/v86Service';

interface TopBarProps {
  activeWindowTitle?: string;
  onToggleLauncher: () => void;
  onOpenApp: (id: any) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: (dark: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeWindowTitle,
  onToggleLauncher,
  onOpenApp,
  isFullscreen,
  onToggleFullscreen,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-7 w-full bg-stone-950/95 text-stone-200 flex items-center justify-between px-3 text-xs select-none border-b border-stone-800/80 z-40 relative backdrop-blur-md">
      {/* Left: Activities & Active App */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLauncher}
          className="font-medium hover:text-white px-2 py-0.5 rounded hover:bg-stone-800/80 transition-colors"
        >
          Activities
        </button>
        {activeWindowTitle && (
          <span className="text-stone-400 font-medium hidden sm:inline truncate max-w-xs">
            {activeWindowTitle}
          </span>
        )}
      </div>

      {/* Center: System Clock & Calendar Popover */}
      <div className="relative">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="font-medium hover:text-white px-2 py-0.5 rounded hover:bg-stone-800/80 transition-colors flex items-center gap-1.5"
        >
          <span>{dateStr}</span>
          <span className="font-semibold text-stone-100">{timeStr}</span>
        </button>

        {showCalendar && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 bg-stone-900 border border-stone-700 rounded-lg p-3 shadow-2xl z-50 text-stone-200">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-800">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">{new Date().toDateString()}</span>
            </div>
            <div className="text-center py-2 text-stone-400 text-xs">
              Linux System Clock synchronized
            </div>
          </div>
        )}
      </div>

      {/* Right: Status Indicators & Quick Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-stone-800/80 transition-colors text-stone-300"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5" />
          <Battery className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {showStatusMenu && (
          <div className="absolute top-8 right-2 w-64 bg-stone-900 border border-stone-700 rounded-lg p-3 shadow-2xl z-50 space-y-3">
            {/* Volume Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                <span>Sound Volume</span>
                <span>{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 h-1 bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-stone-800 space-y-1">
              <button
                onClick={() => {
                  onToggleFullscreen();
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-300 text-xs text-left"
              >
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen Mode'}</span>
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  onToggleDarkMode(!isDarkMode);
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-300 text-xs text-left"
              >
                <span>{isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}</span>
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  onOpenApp('settings');
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-300 text-xs text-left"
              >
                <span>Settings</span>
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  v86Service.restart();
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-300 text-xs text-left"
              >
                <span>Reboot Linux VM</span>
                <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
