import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import {
  Copy,
  Plus,
  Terminal as TermIcon,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
  Check,
} from 'lucide-react';
import { CommandResult, ShellSession } from '../../services/shellService';
import { vfsService } from '../../services/vfsService';

interface TerminalTabState {
  id: string;
  title: string;
  shell: ShellSession;
  history: string[];
}

interface TerminalAppProps {
  initialCommand?: string;
  onCommandRun?: (cmd: string) => void;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ initialCommand }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Tabs state
  const [tabs, setTabs] = useState<TerminalTabState[]>([
    {
      id: 'tab-1',
      title: 'sheikh@linux:~',
      shell: new ShellSession('sheikh', '/home/sheikh'),
      history: [],
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [fontSize, setFontSize] = useState<number>(14);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // State refs for terminal input processing
  const currentLineRef = useRef<string>('');
  const cursorPosRef = useRef<number>(0);
  const historyIdxRef = useRef<number>(-1);
  const activeTabIdRef = useRef<string>(activeTabId);
  const tabsRef = useRef<TerminalTabState[]>(tabs);
  const pendingPasswordCallbackRef = useRef<((password: string) => CommandResult) | null>(null);
  const passwordInputRef = useRef<string>('');

  activeTabIdRef.current = activeTabId;
  tabsRef.current = tabs;

  const getActiveTab = (): TerminalTabState => {
    return (
      tabsRef.current.find((t) => t.id === activeTabIdRef.current) || tabsRef.current[0]
    );
  };

  const quickCommands = [
    { label: 'whoami', cmd: 'whoami' },
    { label: 'pwd', cmd: 'pwd' },
    { label: 'ls -la', cmd: 'ls -la' },
    { label: 'uname -a', cmd: 'uname -a' },
    { label: 'gcc --version', cmd: 'gcc --version' },
    { label: 'python3 --version', cmd: 'python3 --version' },
    { label: 'sudo whoami', cmd: 'sudo whoami' },
    { label: 'free -m', cmd: 'free -m' },
    { label: 'df -h', cmd: 'df -h' },
    { label: 'tree ~', cmd: 'tree ~' },
  ];

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: fontSize,
      theme: {
        background: '#1c1917', // stone-900
        foreground: '#f5f5f4', // stone-100
        cursor: '#f97316', // orange-500
        cursorAccent: '#1c1917',
        selectionBackground: 'rgba(249, 115, 22, 0.35)',
        black: '#292524',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f5f5f4',
        brightBlack: '#78716c',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fde047',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafaf9',
      },
      convertEol: true,
      scrollback: 5000,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner and initial prompt
    term.writeln('\x1b[1;38;5;208mUniGrova Linux Lab – Real Linux Simulator\x1b[0m');
    term.writeln('\x1b[90mLinux version 5.15.0-107-generic (x86_64) · Connected as sheikh@linux\x1b[0m');
    term.writeln('\x1b[90mType "help" for command list or "sudo -i" for root shell\x1b[0m');
    term.writeln('');

    const activeTab = getActiveTab();
    term.write(activeTab.shell.getPrompt());

    // Focus automatically
    term.focus();

    // Setup input listener
    const onDataDisposable = term.onData((data) => {
      handleTerminalInput(data);
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(terminalRef.current);

    if (initialCommand) {
      setTimeout(() => {
        executeCommandString(initialCommand);
      }, 300);
    }

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termInstance.current = null;
    };
  }, []);

  // Update font size when changed
  useEffect(() => {
    if (termInstance.current && fitAddonRef.current) {
      termInstance.current.options.fontSize = fontSize;
      try {
        fitAddonRef.current.fit();
      } catch {}
    }
  }, [fontSize]);

  const redrawCurrentLine = (prompt: string, line: string, cursorPos: number) => {
    const term = termInstance.current;
    if (!term) return;
    // Carriage return, clear line, re-print prompt and line, reposition cursor
    term.write('\r\x1b[K' + prompt + line);
    const diff = line.length - cursorPos;
    if (diff > 0) {
      term.write(`\x1b[${diff}D`);
    }
  };

  const updateTabTitleForShell = (tab: TerminalTabState) => {
    const currentCwd = tab.shell.getCwd();
    const currentUser = tab.shell.getUser();
    const userHome = currentUser === 'root' ? '/root' : `/home/${currentUser}`;
    let shortCwd: string;
    if (currentCwd === userHome) {
      shortCwd = '~';
    } else if (currentCwd.startsWith(userHome + '/')) {
      shortCwd = '~' + currentCwd.slice(userHome.length);
    } else {
      shortCwd = currentCwd;
    }
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tab.id ? { ...t, title: `${currentUser}@linux:${shortCwd}` } : t
      )
    );
  };

  const handleTerminalInput = (data: string) => {
    const term = termInstance.current;
    if (!term) return;
    const tab = getActiveTab();
    const prompt = tab.shell.getPrompt();

    // Handling interactive password prompt (e.g. sudo or su)
    if (pendingPasswordCallbackRef.current) {
      if (data === '\r' || data === '\n') {
        term.writeln('');
        const enteredPassword = passwordInputRef.current;
        passwordInputRef.current = '';
        const callback = pendingPasswordCallbackRef.current;
        pendingPasswordCallbackRef.current = null;

        const result = callback(enteredPassword);
        if (result.clearScreen) {
          term.clear();
        } else if (result.output) {
          const formatted = result.output.replace(/\r?\n/g, '\r\n');
          term.write(formatted);
          if (!formatted.endsWith('\r\n')) {
            term.writeln('');
          }
        }

        updateTabTitleForShell(tab);
        term.write(tab.shell.getPrompt());
        return;
      }

      if (data === '\x7f' || data === '\b') {
        if (passwordInputRef.current.length > 0) {
          passwordInputRef.current = passwordInputRef.current.slice(0, -1);
        }
        return;
      }

      if (data === '\x03') {
        term.writeln('^C');
        pendingPasswordCallbackRef.current = null;
        passwordInputRef.current = '';
        term.write(prompt);
        return;
      }

      if (data.length === 1 && data.charCodeAt(0) >= 32) {
        // Silently append without echoing to maintain Linux sudo security convention
        passwordInputRef.current += data;
      }
      return;
    }

    // 1. Enter key
    if (data === '\r' || data === '\n') {
      term.writeln('');
      const cmd = currentLineRef.current;
      currentLineRef.current = '';
      cursorPosRef.current = 0;
      historyIdxRef.current = -1;

      if (cmd.trim()) {
        const result = tab.shell.execute(cmd);
        if (result.clearScreen) {
          term.clear();
        } else if (result.needsPasswordPrompt) {
          term.write(result.needsPasswordPrompt.prompt);
          pendingPasswordCallbackRef.current = result.needsPasswordPrompt.onPassword;
          passwordInputRef.current = '';
          return;
        } else if (result.output) {
          // Format newlines as CRLF for xterm
          const formatted = result.output.replace(/\r?\n/g, '\r\n');
          term.write(formatted);
          if (!formatted.endsWith('\r\n')) {
            term.writeln('');
          }
        }
      }

      // Update tab title if cwd or user changed
      updateTabTitleForShell(tab);

      term.write(tab.shell.getPrompt());
      return;
    }

    // 2. Backspace
    if (data === '\x7f' || data === '\b') {
      if (cursorPosRef.current > 0) {
        const line = currentLineRef.current;
        const pos = cursorPosRef.current;
        currentLineRef.current = line.slice(0, pos - 1) + line.slice(pos);
        cursorPosRef.current--;
        redrawCurrentLine(prompt, currentLineRef.current, cursorPosRef.current);
      }
      return;
    }

    // 3. Ctrl+C (Interrupt)
    if (data === '\x03') {
      term.writeln('^C');
      currentLineRef.current = '';
      cursorPosRef.current = 0;
      historyIdxRef.current = -1;
      term.write(prompt);
      return;
    }

    // 4. Ctrl+L (Clear screen)
    if (data === '\x0c') {
      term.clear();
      term.write(prompt + currentLineRef.current);
      return;
    }

    // 5. Arrow keys (ANSI escape sequences)
    if (data === '\x1b[A') {
      // Up Arrow: History backward
      const history = tab.shell.getHistory();
      if (history.length === 0) return;

      if (historyIdxRef.current === -1) {
        historyIdxRef.current = history.length - 1;
      } else if (historyIdxRef.current > 0) {
        historyIdxRef.current--;
      }

      const item = history[historyIdxRef.current] || '';
      currentLineRef.current = item;
      cursorPosRef.current = item.length;
      redrawCurrentLine(prompt, item, cursorPosRef.current);
      return;
    }

    if (data === '\x1b[B') {
      // Down Arrow: History forward
      const history = tab.shell.getHistory();
      if (historyIdxRef.current !== -1) {
        if (historyIdxRef.current < history.length - 1) {
          historyIdxRef.current++;
          const item = history[historyIdxRef.current];
          currentLineRef.current = item;
          cursorPosRef.current = item.length;
          redrawCurrentLine(prompt, item, cursorPosRef.current);
        } else {
          historyIdxRef.current = -1;
          currentLineRef.current = '';
          cursorPosRef.current = 0;
          redrawCurrentLine(prompt, '', 0);
        }
      }
      return;
    }

    if (data === '\x1b[D') {
      // Left Arrow
      if (cursorPosRef.current > 0) {
        cursorPosRef.current--;
        term.write('\x1b[D');
      }
      return;
    }

    if (data === '\x1b[C') {
      // Right Arrow
      if (cursorPosRef.current < currentLineRef.current.length) {
        cursorPosRef.current++;
        term.write('\x1b[C');
      }
      return;
    }

    // 6. Tab completion
    if (data === '\t') {
      const line = currentLineRef.current;
      const parts = line.split(' ');
      const lastToken = parts[parts.length - 1];

      // Auto-complete files in cwd
      const entries = vfsService.readDir(tab.shell.getCwd());
      const matches = entries.filter((e) => e.name.startsWith(lastToken));

      if (matches.length === 1) {
        const completion = matches[0].name.slice(lastToken.length) + (matches[0].isDirectory ? '/' : ' ');
        currentLineRef.current += completion;
        cursorPosRef.current += completion.length;
        term.write(completion);
      } else if (matches.length > 1) {
        term.writeln('');
        term.writeln(matches.map((m) => m.name).join('  '));
        term.write(prompt + currentLineRef.current);
      }
      return;
    }

    // 7. Standard printable character input
    if (data.length === 1 && data.charCodeAt(0) >= 32) {
      const line = currentLineRef.current;
      const pos = cursorPosRef.current;
      currentLineRef.current = line.slice(0, pos) + data + line.slice(pos);
      cursorPosRef.current++;
      redrawCurrentLine(prompt, currentLineRef.current, cursorPosRef.current);
    }
  };

  const executeCommandString = (cmd: string) => {
    const term = termInstance.current;
    if (!term) return;
    const tab = getActiveTab();

    currentLineRef.current = cmd;
    term.write(cmd);
    handleTerminalInput('\r');
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TerminalTabState = {
      id: newId,
      title: 'sheikh@linux:~',
      shell: new ShellSession('sheikh', '/home/sheikh'),
      history: [],
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);

    setTimeout(() => {
      if (termInstance.current) {
        termInstance.current.clear();
        termInstance.current.writeln(`\x1b[1;38;5;208m--- Session Switched to New Shell (${newId}) ---\x1b[0m\r\n`);
        termInstance.current.write(newTab.shell.getPrompt());
        termInstance.current.focus();
      }
    }, 50);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    const target = tabs.find((t) => t.id === tabId);
    if (target && termInstance.current) {
      termInstance.current.clear();
      termInstance.current.writeln(`\x1b[1;38;5;208m--- Switched to ${target.title} ---\x1b[0m\r\n`);
      termInstance.current.write(target.shell.getPrompt());
      termInstance.current.focus();
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      handleSelectTab(nextTabs[0].id);
    }
  };

  const handleCopySelection = () => {
    if (termInstance.current) {
      const selection = termInstance.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const handleClear = () => {
    if (termInstance.current) {
      termInstance.current.clear();
      const tab = getActiveTab();
      termInstance.current.write(tab.shell.getPrompt());
      currentLineRef.current = '';
      cursorPosRef.current = 0;
      termInstance.current.focus();
    }
  };

  return (
    <div
      onClick={() => termInstance.current?.focus()}
      className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden"
    >
      {/* Terminal Title Bar & Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-b border-stone-800 text-xs select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-colors ${
                activeTabId === tab.id
                  ? 'bg-stone-800 text-orange-400 font-medium'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <TermIcon className="w-3.5 h-3.5" />
              <span>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="hover:text-red-400 p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleAddTab}
            title="Open new terminal tab"
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] text-stone-400 mr-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>ttyS0 · /bin/sh</span>
          </div>

          <button
            onClick={() => setFontSize((prev) => Math.min(22, prev + 1))}
            title="Increase font size"
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFontSize((prev) => Math.max(10, prev - 1))}
            title="Decrease font size"
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopySelection}
            title="Copy selection"
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClear}
            title="Clear Terminal (Ctrl+L)"
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Command Snippets Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-950/60 border-b border-stone-800 text-[11px] text-stone-400 overflow-x-auto scrollbar-none select-none">
        <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] shrink-0">
          Quick:
        </span>
        {quickCommands.map((qc) => (
          <button
            key={qc.label}
            onClick={() => executeCommandString(qc.cmd)}
            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-orange-600 hover:text-white transition-colors shrink-0 font-mono text-stone-300"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        className="flex-1 w-full p-2 overflow-hidden bg-stone-900 cursor-text"
      />

      {/* Terminal Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-stone-950 text-[11px] text-stone-400 border-t border-stone-800 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>Linux 5.15.0 (x86_64)</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Interactive POSIX Shell</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ctrl+C (Interrupt)</span>
          <span>·</span>
          <span>Tab (Autocomplete)</span>
        </div>
      </div>
    </div>
  );
};
