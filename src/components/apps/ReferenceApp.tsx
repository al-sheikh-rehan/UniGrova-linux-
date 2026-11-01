import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  ExternalLink,
  Play,
  Search,
  Terminal,
  Check,
} from 'lucide-react';
import { LINUX_COMMANDS } from '../../data/linuxData';
import { LinuxCommand } from '../../types';

interface ReferenceAppProps {
  onRunInTerminal?: (cmd: string) => void;
}

export const ReferenceApp: React.FC<ReferenceAppProps> = ({ onRunInTerminal }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCommand, setSelectedCommand] = useState<LinuxCommand>(LINUX_COMMANDS[0]);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Commands' },
    { id: 'files', label: 'Files & Folders' },
    { id: 'text', label: 'Text & Grep' },
    { id: 'system', label: 'System & Hardware' },
    { id: 'process', label: 'Processes' },
    { id: 'permissions', label: 'Permissions' },
  ];

  const filteredCommands = LINUX_COMMANDS.filter((cmd) => {
    const matchesCat = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.summary.toLowerCase().includes(search.toLowerCase()) ||
      cmd.example.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Search & Category Filter Toolbar */}
      <div className="p-3 bg-stone-950 border-b border-stone-800 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 50+ Linux commands (e.g., grep, chmod, ls, ps, kill)..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-md text-stone-100 placeholder-stone-500 outline-none focus:border-orange-500 text-xs"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white font-medium'
                  : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Command List Left, Details Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Command Sidebar List */}
        <div className="w-56 bg-stone-950/70 border-r border-stone-800 overflow-y-auto divide-y divide-stone-800/30">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-stone-500">No matching commands</div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.name}
                onClick={() => setSelectedCommand(cmd)}
                className={`w-full text-left px-3 py-2 flex flex-col transition-colors ${
                  selectedCommand.name === cmd.name
                    ? 'bg-orange-600/15 border-l-2 border-orange-500 text-white'
                    : 'hover:bg-stone-800/50 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-orange-400 text-xs">{cmd.name}</span>
                  <span className="text-[10px] text-stone-500 uppercase">{cmd.category}</span>
                </div>
                <span className="text-[11px] text-stone-400 truncate mt-0.5">{cmd.summary}</span>
              </button>
            ))
          )}
        </div>

        {/* Command Details Panel */}
        <div className="flex-1 p-4 overflow-y-auto bg-stone-900 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-xl font-bold font-mono text-stone-100 flex items-center gap-2">
                <span>{selectedCommand.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-sans font-normal uppercase">
                  {selectedCommand.category}
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-1">{selectedCommand.summary}</p>
            </div>

            {onRunInTerminal && (
              <button
                onClick={() => onRunInTerminal(`${selectedCommand.example}\n`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium shadow transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Run Example</span>
              </button>
            )}
          </div>

          {/* Syntax Box */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Syntax
            </span>
            <div className="p-2.5 rounded bg-stone-950 border border-stone-800 font-mono text-stone-200 text-xs">
              {selectedCommand.syntax}
            </div>
          </div>

          {/* Example Box with Copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Example Usage
              </span>
              <button
                onClick={() => handleCopy(selectedCommand.example)}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded bg-stone-950 border border-stone-800 font-mono text-orange-400 text-xs">
              $ {selectedCommand.example}
            </div>
          </div>

          {/* Flags & Options */}
          {selectedCommand.options.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Common Options & Flags
              </span>
              <div className="divide-y divide-stone-800 rounded border border-stone-800 bg-stone-950/60 overflow-hidden">
                {selectedCommand.options.map((opt) => (
                  <div key={opt.flag} className="px-3 py-2 flex items-start gap-3">
                    <span className="font-mono text-stone-200 font-semibold shrink-0 text-xs text-orange-400 w-16">
                      {opt.flag}
                    </span>
                    <span className="text-stone-400 text-xs">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
