import React from 'react';
import {
  Activity,
  Code2,
  FilePlus,
  Folder,
  GraduationCap,
  Image,
  Sliders,
  Terminal,
} from 'lucide-react';
import { WindowId } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenApp: (id: WindowId) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onOpenApp,
}) => {
  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-52 bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-lg shadow-2xl p-1 text-xs text-stone-200 select-none divide-y divide-stone-800"
    >
      <div className="space-y-0.5 pb-1">
        <button
          onClick={() => {
            onOpenApp('terminal');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span>Open in Terminal</span>
        </button>

        <button
          onClick={() => {
            onOpenApp('files');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Folder className="w-3.5 h-3.5 text-orange-400" />
          <span>Open Files</span>
        </button>

        <button
          onClick={() => {
            onOpenApp('editor');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5 text-blue-400" />
          <span>New Document</span>
        </button>
      </div>

      <div className="space-y-0.5 py-1">
        <button
          onClick={() => {
            onOpenApp('ide');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>C / Script Lab</span>
        </button>

        <button
          onClick={() => {
            onOpenApp('lab');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Practice Exercises</span>
        </button>

        <button
          onClick={() => {
            onOpenApp('monitor');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>System Monitor</span>
        </button>
      </div>

      <div className="space-y-0.5 pt-1">
        <button
          onClick={() => {
            onOpenApp('settings');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Image className="w-3.5 h-3.5 text-stone-400" />
          <span>Change Background...</span>
        </button>

        <button
          onClick={() => {
            onOpenApp('settings');
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-stone-800 text-stone-200 text-left transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-stone-400" />
          <span>Display Settings</span>
        </button>
      </div>
    </div>
  );
};
