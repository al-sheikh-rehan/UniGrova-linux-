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
  Search,
  Sliders,
  Terminal,
  X,
} from 'lucide-react';
import { WindowId } from '../../types';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (id: WindowId) => void;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({
  isOpen,
  onClose,
  onOpenApp,
}) => {
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const allApps: {
    id: WindowId;
    title: string;
    desc: string;
    icon: React.FC<{ className?: string }>;
    color: string;
  }[] = [
    {
      id: 'terminal',
      title: 'Terminal',
      desc: 'xterm.js Linux serial shell (/dev/ttyS0)',
      icon: Terminal,
      color: 'text-orange-400 bg-stone-900 border-orange-500/30',
    },
    {
      id: 'files',
      title: 'Files',
      desc: 'Linux filesystem browser & manager',
      icon: Folder,
      color: 'text-orange-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'ide',
      title: 'C & Script IDE',
      desc: 'C Compiler & Bash programming lab',
      icon: Code2,
      color: 'text-emerald-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'editor',
      title: 'Text Editor',
      desc: 'Gedit-style plain text & script editor',
      icon: FileText,
      color: 'text-blue-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'lab',
      title: 'Practice Lab',
      desc: 'Guided challenges & Linux MCQs',
      icon: GraduationCap,
      color: 'text-yellow-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'monitor',
      title: 'System Monitor',
      desc: 'Live CPU, memory, and process manager',
      icon: Activity,
      color: 'text-purple-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'reference',
      title: 'Command Manual',
      desc: 'Searchable 50+ Linux commands reference',
      icon: BookOpen,
      color: 'text-cyan-400 bg-stone-900 border-stone-800',
    },
    {
      id: 'browser',
      title: 'Web Browser',
      desc: 'Offline Linux docs & manpage viewer',
      icon: Globe,
      color: 'text-blue-500 bg-stone-900 border-stone-800',
    },
    {
      id: 'calc',
      title: 'Calculator',
      desc: 'Standard & Programmer base converter',
      icon: Calculator,
      color: 'text-stone-300 bg-stone-900 border-stone-800',
    },
    {
      id: 'settings',
      title: 'Settings',
      desc: 'Themes, wallpapers, and VM allocation',
      icon: Sliders,
      color: 'text-stone-400 bg-stone-900 border-stone-800',
    },
  ];

  const filtered = allApps.filter(
    (app) =>
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xl flex flex-col items-center p-8 select-none"
    >
      {/* Top Search Input */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative mb-10 mt-6"
      >
        <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3" />
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to search Linux applications..."
          className="w-full pl-12 pr-10 py-2.5 bg-stone-900/90 border border-stone-700 rounded-full text-stone-100 placeholder-stone-500 text-sm outline-none focus:border-orange-500 shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3 text-stone-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Apps */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-4xl w-full"
      >
        {filtered.map((app) => {
          const IconComp = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => {
                onOpenApp(app.id);
                onClose();
              }}
              className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-stone-800/60 border border-transparent hover:border-stone-700/60 transition-all hover:scale-105 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg mb-2.5 ${app.color} group-hover:shadow-orange-500/10`}
              >
                <IconComp className="w-7 h-7" />
              </div>
              <span className="font-semibold text-stone-200 text-xs">{app.title}</span>
              <span className="text-[10px] text-stone-400 line-clamp-1 mt-0.5 max-w-[120px]">
                {app.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
