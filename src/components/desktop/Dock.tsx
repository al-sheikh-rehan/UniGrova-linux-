import React from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Code2,
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
  const dockApps: { id: WindowId; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'terminal', label: 'Terminal (xterm.js)', icon: Terminal, color: 'text-orange-400 bg-stone-900' },
    { id: 'files', label: 'Files (Linux Filesystem)', icon: Folder, color: 'text-orange-400 bg-stone-900' },
    { id: 'editor', label: 'Text Editor', icon: FileText, color: 'text-blue-400 bg-stone-900' },
    { id: 'ide', label: 'C / Script Programming Lab', icon: Code2, color: 'text-emerald-400 bg-stone-900' },
    { id: 'lab', label: 'Linux Practice Lab', icon: GraduationCap, color: 'text-yellow-400 bg-stone-900' },
    { id: 'monitor', label: 'System Monitor', icon: Activity, color: 'text-purple-400 bg-stone-900' },
    { id: 'reference', label: 'Command Reference', icon: BookOpen, color: 'text-cyan-400 bg-stone-900' },
    { id: 'browser', label: 'Web Browser', icon: Globe, color: 'text-blue-500 bg-stone-900' },
    { id: 'calc', label: 'Calculator', icon: Calculator, color: 'text-stone-300 bg-stone-900' },
    { id: 'settings', label: 'System Settings', icon: Sliders, color: 'text-stone-400 bg-stone-900' },
  ];

  const isLeft = position === 'left';

  return (
    <aside
      className={`bg-stone-950/80 backdrop-blur-md border-stone-800/80 flex z-30 select-none ${
        isLeft
          ? 'w-14 h-[calc(100vh-1.75rem)] flex-col justify-between items-center py-2 border-r'
          : 'h-14 w-full flex-row justify-center items-center px-4 border-t gap-2'
      }`}
    >
      {/* App Icons List */}
      <div
        className={`flex ${
          isLeft ? 'flex-col gap-1.5' : 'flex-row gap-2'
        } items-center`}
      >
        {dockApps.map((app) => {
          const win = windows.find((w) => w.id === app.id);
          const isOpen = win && win.isOpen;
          const IconComponent = app.icon;

          return (
            <div key={app.id} className="relative group flex items-center justify-center">
              {/* Running orange dot indicator on left or bottom */}
              {isOpen && (
                <span
                  className={`absolute ${
                    isLeft
                      ? 'left-0.5 w-1 h-3 rounded-r-full bg-orange-500'
                      : 'bottom-0.5 w-3 h-1 rounded-t-full bg-orange-500'
                  }`}
                />
              )}

              <button
                onClick={() => onOpenApp(app.id)}
                className={`p-2.5 rounded-xl border border-stone-800/60 shadow-sm transition-all duration-150 ${
                  isOpen
                    ? 'bg-stone-800/90 text-white hover:scale-105 hover:bg-stone-700'
                    : 'bg-stone-900/60 hover:bg-stone-800 hover:scale-105'
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
          className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-orange-600 hover:text-white text-stone-300 border border-stone-800 transition-all hover:scale-105"
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
