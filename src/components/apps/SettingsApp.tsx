import React, { useState } from 'react';
import {
  Check,
  HardDrive,
  Image,
  Layout,
  Moon,
  RefreshCw,
  Sliders,
  Sun,
  Trash2,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { v86Service } from '../../services/v86Service';

interface SettingsAppProps {
  currentWallpaper: string;
  onSelectWallpaper: (url: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: (dark: boolean) => void;
  dockPosition: 'left' | 'bottom';
  onChangeDockPosition: (pos: 'left' | 'bottom') => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  isDarkMode,
  onToggleDarkMode,
  dockPosition,
  onChangeDockPosition,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'dock' | 'system'>('appearance');
  const [vmMemory, setVmMemory] = useState<number>(v86Service.getConfig().memorySizeMB);
  const [customWallpaperInput, setCustomWallpaperInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const wallpapers = [
    {
      id: 'jammy',
      name: 'Ubuntu Jammy Crest',
      desc: 'Default aubergine origami folds with warm orange accents',
      url: '/src/assets/images/ubuntu_jammy_wallpaper_1793457587205.jpg',
    },
    {
      id: 'minimal',
      name: 'Dark Slate Topography',
      desc: 'Obsidian charcoal with subtle elevation contour lines',
      url: '/src/assets/images/linux_minimal_dark_1793457587001.jpg',
    },
    {
      id: 'desert',
      name: 'Light Desert Horizon',
      desc: 'Sandstone cream daylight architectural curves',
      url: '/src/assets/images/linux_light_desert_1793457587140.jpg',
    },
  ];

  const handleApplyMemory = () => {
    v86Service.setConfig({ memorySizeMB: vmMemory });
    setStatusMessage('Memory allocation saved. Restart VM to apply.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clean all stored files, terminal history, and lab progress?')) {
      await storageService.clearAllData();
      alert('System storage cleaned. Page will reload.');
      window.location.reload();
    }
  };

  const handleRestartVM = async () => {
    if (confirm('Reboot Linux Virtual Machine?')) {
      await v86Service.restart();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-none overflow-hidden text-xs">
      {/* Settings Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-stone-200">System Settings</span>
        </div>
        {statusMessage && (
          <span className="text-[11px] text-emerald-400 font-mono">{statusMessage}</span>
        )}
      </div>

      {/* Main Split: Navigation Left, Settings View Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Tabs */}
        <div className="w-44 bg-stone-950/70 border-r border-stone-800 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
              activeTab === 'appearance'
                ? 'bg-orange-600/15 text-orange-400 font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('dock')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
              activeTab === 'dock'
                ? 'bg-orange-600/15 text-orange-400 font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Dock & Panels</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
              activeTab === 'system'
                ? 'bg-orange-600/15 text-orange-400 font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Virtual Machine</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-stone-100 text-sm mb-1">Desktop Background</h3>
                <p className="text-stone-400 text-xs">
                  Choose an authentic Ubuntu or developer wallpaper for the Linux desktop.
                </p>
              </div>

              {/* Wallpaper Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {wallpapers.map((wp) => (
                  <div
                    key={wp.id}
                    onClick={() => onSelectWallpaper(wp.url)}
                    className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      currentWallpaper === wp.url
                        ? 'border-orange-500 shadow-lg'
                        : 'border-stone-800 hover:border-stone-600'
                    }`}
                  >
                    <div className="h-28 overflow-hidden bg-stone-950">
                      <img
                        src={wp.url}
                        alt={wp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2.5 bg-stone-950/80">
                      <div className="font-semibold text-stone-200 text-xs flex items-center justify-between">
                        <span>{wp.name}</span>
                        {currentWallpaper === wp.url && (
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 truncate">{wp.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="pt-4 border-t border-stone-800">
                <h4 className="font-semibold text-stone-200 text-xs mb-2">Window Theme</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleDarkMode(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                      isDarkMode
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Theme (Yaru Dark)</span>
                  </button>

                  <button
                    onClick={() => onToggleDarkMode(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                      !isDarkMode
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light Theme (Yaru Light)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dock' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-stone-100 text-sm mb-1">Dock Configuration</h3>
                <p className="text-stone-400 text-xs">Customize the Ubuntu launcher position and behavior.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-stone-300">
                  Position on Screen
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onChangeDockPosition('left')}
                    className={`px-3 py-1.5 rounded border transition-colors ${
                      dockPosition === 'left'
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    Left Side (Classic Ubuntu)
                  </button>
                  <button
                    onClick={() => onChangeDockPosition('bottom')}
                    className={`px-3 py-1.5 rounded border transition-colors ${
                      dockPosition === 'bottom'
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    Bottom Taskbar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-stone-100 text-sm mb-1">Linux Hardware Virtualization</h3>
                <p className="text-stone-400 text-xs">
                  Configure memory, bootloader settings, or perform a clean system wipe.
                </p>
              </div>

              {/* RAM Allocation */}
              <div className="space-y-2 p-3 bg-stone-950/60 rounded border border-stone-800">
                <label className="block text-xs font-semibold text-stone-200">
                  Virtual RAM Allocation: {vmMemory} MB
                </label>
                <p className="text-[11px] text-stone-500">
                  Allocates WebAssembly linear memory for the x86 Linux guest.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  {[64, 128, 256].map((mb) => (
                    <button
                      key={mb}
                      onClick={() => setVmMemory(mb)}
                      className={`px-3 py-1 rounded border transition-colors ${
                        vmMemory === mb
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      {mb} MB
                    </button>
                  ))}
                  <button
                    onClick={handleApplyMemory}
                    className="ml-auto px-3 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Restart VM */}
              <div className="flex items-center justify-between p-3 bg-stone-950/60 rounded border border-stone-800">
                <div>
                  <h4 className="font-semibold text-stone-200 text-xs">Reboot Virtual Machine</h4>
                  <p className="text-[11px] text-stone-500">
                    Re-executes the SeaBIOS and Linux kernel boot sequence.
                  </p>
                </div>
                <button
                  onClick={handleRestartVM}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reboot VM</span>
                </button>
              </div>

              {/* Reset Storage */}
              <div className="flex items-center justify-between p-3 bg-red-950/20 rounded border border-red-900/40">
                <div>
                  <h4 className="font-semibold text-red-300 text-xs">Reset All Persistent Storage</h4>
                  <p className="text-[11px] text-red-400/70">
                    Deletes all IndexedDB files, terminal logs, and exercises.
                  </p>
                </div>
                <button
                  onClick={handleClearData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Everything</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
