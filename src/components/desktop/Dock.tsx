import React from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Code2,
  FileCode,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Grid,
  Sliders,
  Terminal,
  Trash2,
} from 'lucide-react';
import { WindowId, WindowState } from '../../types';

interface DockProps {
  position: 'left' | 'bottom';
  windows: WindowState[];
  onOpenApp: (id: WindowId) => void;
  onToggleLauncher: () => void;
}

export const Dock: React.FC<DockProps> = ({
  position,
  windows,
  onOpenApp,
  onToggleLauncher,
}) => {
  // Pinned apps on the home screen dock: Terminal, Files, System Monitor, Calculator, Settings
  // Other apps from Show Applications appear dynamically in the dock when running.
  const allKnownApps: { id: WindowId; label: string; icon: React.FC<{ className?: string }>; color: string; pinned?: boolean }[] = [
    { id: 'terminal', label: 'Terminal (unigrova@user)', icon: Terminal, color: 'text-orange-400 bg-stone-900', pinned: true },
    { id: 'files', label: 'Files (File Manager)', icon: Folder, color: 'text-blue-400 bg-stone-900', pinned: true },
    { id: 'monitor', label: 'System Monitor', icon: Activity, color: 'text-rose-400 bg-stone-900', pinned: true },
    { id: 'calc', label: 'Calculator', icon: Calculator, color: 'text-amber-400 bg-stone-900', pinned: true },
    { id: 'settings', label: 'Settings', icon: Sliders, color: 'text-teal-400 bg-stone-900', pinned: true },
    { id: 'browser', label: 'Firefox Browser', icon: Globe, color: 'text-amber-400 bg-stone-900' },
    { id: 'editor', label: 'Text Editor', icon: FileText, color: 'text-emerald-400 bg-stone-900' },
    { id: 'python', label: 'Python Editor', icon: FileCode, color: 'text-yellow-400 bg-stone-900' },
    { id: 'ide', label: 'C/C++ Programming Lab', icon: Code2, color: 'text-cyan-400 bg-stone-900' },
    { id: 'lab', label: 'Linux Practice Lab', icon: GraduationCap, color: 'text-purple-400 bg-stone-900' },
  ];

  const dockApps = allKnownApps.filter((app) => {
    if (app.pinned) return true;
    const win = windows.find((w) => w.id === app.id);
    return win && win.isOpen;
  });

  const isLeft = position === 'left';

  return (
    <aside
      className={`bg-black/60 backdrop-blur-xl border-black/40 flex z-30 select-none ${
        isLeft
          ? 'w-16 h-[calc(100vh-2rem)] flex-col justify-between items-center py-3 border-r'
          : 'h-16 w-full flex-row justify-center items-center px-4 border-t gap-2'
      }`}
    >
      {/* App Icons List */}
      <div
        className={`flex ${
          isLeft ? 'flex-col gap-2' : 'flex-row gap-2'
        } items-center`}
      >
        {dockApps.map((app) => {
          const win = windows.find((w) => w.id === app.id);
          const isOpen = win && win.isOpen;
          const IconComponent = app.icon;

          return (
            <div key={app.id} className="relative group flex items-center justify-center">
              {/* Running dot indicator on left or bottom */}
              {isOpen && (
                <span
                  className={`absolute ${
                    isLeft
                      ? 'left-1 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
                      : 'bottom-1 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
                  }`}
                />
              )}

              <button
                onClick={() => onOpenApp(app.id)}
                className={`p-2.5 rounded-2xl border transition-all duration-150 ${
                  isOpen
                    ? 'bg-stone-800/90 border-stone-700/80 text-white shadow-lg scale-105'
                    : 'bg-stone-900/60 border-stone-800/60 hover:bg-stone-800/90 hover:border-stone-700/80 hover:scale-105'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${app.color}`} />
              </button>

              {/* Tooltip */}
              <div
                className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 px-2.5 py-1 bg-stone-900 text-stone-100 text-[11px] font-medium rounded shadow-xl border border-stone-700 whitespace-nowrap ${
                  isLeft ? 'left-16 top-1/2 -translate-y-1/2' : 'bottom-16 left-1/2 -translate-x-1/2'
                }`}
              >
                {app.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Launcher Button */}
      <div className="relative group">
        <button
          onClick={onToggleLauncher}
          title="Show Applications"
          className="p-2.5 rounded-2xl bg-stone-900/80 hover:bg-teal-600 hover:text-white text-stone-300 border border-stone-800 transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <Grid className="w-5 h-5" />
        </button>
        <div
          className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 px-2.5 py-1 bg-stone-900 text-stone-100 text-[11px] font-medium rounded shadow-xl border border-stone-700 whitespace-nowrap ${
            isLeft ? 'left-16 top-1/2 -translate-y-1/2' : 'bottom-16 left-1/2 -translate-x-1/2'
          }`}
        >
          Show Applications
        </div>
      </div>
    </aside>
  );
};
