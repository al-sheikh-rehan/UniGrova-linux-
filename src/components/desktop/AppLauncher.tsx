import React, { useEffect, useState } from 'react';
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

interface AppItem {
  id: WindowId;
  title: string;
  desc: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  bgGradient: string;
  iconColor: string;
  isFrequent?: boolean;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({
  isOpen,
  onClose,
  onOpenApp,
}) => {
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'frequent' | 'all'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allApps: AppItem[] = [
    {
      id: 'terminal',
      title: 'Terminal',
      desc: 'unigrova@user interactive shell',
      category: 'System',
      icon: Terminal,
      bgGradient: 'from-stone-900 to-stone-800 border-orange-500/40 shadow-orange-500/10',
      iconColor: 'text-orange-400',
      isFrequent: true,
    },
    {
      id: 'files',
      title: 'Files',
      desc: 'GNOME Nautilus File Manager',
      category: 'Utilities',
      icon: Folder,
      bgGradient: 'from-blue-950/60 to-blue-900/40 border-blue-500/40 shadow-blue-500/10',
      iconColor: 'text-blue-400',
      isFrequent: true,
    },
    {
      id: 'browser',
      title: 'Firefox Browser',
      desc: 'Web & Linux documentation viewer',
      category: 'Internet',
      icon: Globe,
      bgGradient: 'from-orange-950/60 to-amber-900/40 border-amber-500/40 shadow-amber-500/10',
      iconColor: 'text-amber-400',
      isFrequent: true,
    },
    {
      id: 'editor',
      title: 'Text Editor',
      desc: 'GNOME Gedit plain text & script editor',
      category: 'Utilities',
      icon: FileText,
      bgGradient: 'from-teal-950/60 to-emerald-900/40 border-emerald-500/40 shadow-emerald-500/10',
      iconColor: 'text-emerald-400',
      isFrequent: true,
    },
    {
      id: 'python',
      title: 'Python Editor',
      desc: 'Python 3.10 interactive IDE & sandbox',
      category: 'Development',
      icon: FileCode,
      bgGradient: 'from-yellow-950/60 to-amber-900/40 border-yellow-500/40 shadow-yellow-500/10',
      iconColor: 'text-yellow-400',
      isFrequent: true,
    },
    {
      id: 'ide',
      title: 'C/C++ Lab',
      desc: 'GCC compiler & C programming environment',
      category: 'Development',
      icon: Code2,
      bgGradient: 'from-cyan-950/60 to-blue-900/40 border-cyan-500/40 shadow-cyan-500/10',
      iconColor: 'text-cyan-400',
      isFrequent: true,
    },
    {
      id: 'lab',
      title: 'LPU CSE65D OS Lab',
      desc: 'Complete 9 Practicals (2026–27), Real System Calls & Report',
      category: 'Education',
      icon: GraduationCap,
      bgGradient: 'from-purple-950/60 to-indigo-900/40 border-purple-500/40 shadow-purple-500/10',
      iconColor: 'text-purple-400',
      isFrequent: true,
    },
    {
      id: 'monitor',
      title: 'System Monitor',
      desc: 'Live CPU, memory, and process viewer',
      category: 'System',
      icon: Activity,
      bgGradient: 'from-rose-950/60 to-pink-900/40 border-rose-500/40 shadow-rose-500/10',
      iconColor: 'text-rose-400',
      isFrequent: false,
    },
    {
      id: 'calc',
      title: 'Calculator',
      desc: 'Standard & Programmer base converter',
      category: 'Utilities',
      icon: Calculator,
      bgGradient: 'from-stone-900 to-stone-800 border-stone-700 shadow-stone-800/10',
      iconColor: 'text-stone-300',
      isFrequent: false,
    },
    {
      id: 'reference',
      title: 'Command Library',
      desc: 'Searchable 50+ Linux commands reference',
      category: 'Documentation',
      icon: BookOpen,
      bgGradient: 'from-indigo-950/60 to-blue-900/40 border-indigo-500/40 shadow-indigo-500/10',
      iconColor: 'text-indigo-400',
      isFrequent: false,
    },
    {
      id: 'settings',
      title: 'Settings',
      desc: 'Desktop themes, wallpapers & VM config',
      category: 'System',
      icon: Sliders,
      bgGradient: 'from-stone-900 to-stone-800 border-stone-700 shadow-stone-800/10',
      iconColor: 'text-stone-400',
      isFrequent: false,
    },
  ];

  const displayedApps = allApps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.desc.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());

    if (search.trim()) return matchesSearch;
    return activeTab === 'all' ? true : app.isFrequent;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && displayedApps.length > 0) {
      onOpenApp(displayedApps[0].id);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-200"
    >
      {/* Top Search Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg relative mt-4"
      >
        <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Type to search..."
          className="w-full pl-12 pr-10 py-3 bg-stone-900/90 border border-stone-700/80 rounded-full text-stone-100 placeholder-stone-500 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-2xl transition-all"
        />
        {search ? (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-3.5 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="absolute right-4 top-3.5 text-[11px] text-stone-500 font-mono">
            ESC
          </div>
        )}
      </div>

      {/* Grid of GNOME Applications */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center w-full max-w-5xl my-6 overflow-y-auto px-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 w-full justify-items-center">
          {displayedApps.map((app) => {
            const IconComp = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => {
                  onOpenApp(app.id);
                  onClose();
                }}
                className="flex flex-col items-center text-center p-3.5 rounded-3xl hover:bg-stone-800/50 border border-transparent hover:border-stone-700/50 transition-all duration-150 hover:scale-105 active:scale-95 group w-36 sm:w-40"
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b border flex items-center justify-center shadow-xl mb-3 ${app.bgGradient} group-hover:shadow-2xl transition-all`}
                >
                  <IconComp className={`w-8 h-8 sm:w-10 sm:h-10 ${app.iconColor}`} />
                </div>
                <span className="font-semibold text-stone-100 text-xs sm:text-sm group-hover:text-teal-300 transition-colors">
                  {app.title}
                </span>
                <span className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                  {app.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GNOME Bottom Switcher: Frequent vs All Apps */}
      {!search && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 p-1 bg-stone-900/90 border border-stone-800 rounded-full shadow-2xl mb-2 backdrop-blur-md"
        >
          <button
            onClick={() => setActiveTab('frequent')}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'frequent'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Frequent
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
