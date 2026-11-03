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
  RefreshCw,
} from 'lucide-react';

interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
}

interface TerminalAppProps {
  initialCommand?: string;
  onCommandRun?: (cmd: string) => void;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ initialCommand }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      title: 'unigrova@user: ~',
      cwd: '/home/unigrova',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [fontSize, setFontSize] = useState<number>(14);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Reference for currently active tab
  const activeTabIdRef = useRef<string>(activeTabId);
  activeTabIdRef.current = activeTabId;

  // Initialize and connect terminal session
  useEffect(() => {
    if (!containerRef.current) return;

    // Create xterm terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'DejaVu Sans Mono', monospace",
      fontSize: fontSize,
      theme: {
        background: '#1c1917', // stone-900 Ubuntu style dark
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
      scrollback: 10000,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonRef.current = fitAddon;
    term.focus();

    // Establish WebSocket connection to backend real PTY session
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/terminal/ws?tabId=${activeTabId}&cols=${term.cols}&rows=${term.rows}&cwd=/home/unigrova&user=unigrova`;

    let socket: WebSocket | null = null;
    let isTermDisposed = false;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
          setIsConnected(true);
          // Send initial size
          socket?.send(
            JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows,
            })
          );

          if (initialCommand) {
            setTimeout(() => {
              socket?.send(
                JSON.stringify({
                  type: 'stdin',
                  data: initialCommand + '\r',
                })
              );
            }, 400);
          }
        };

        socket.onmessage = (event) => {
          if (isTermDisposed) return;
          if (typeof event.data === 'string') {
            term.write(event.data);
          } else if (event.data instanceof ArrayBuffer) {
            const text = new TextDecoder('utf-8').decode(event.data);
            term.write(text);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Terminal WebSocket connection failed:', err);
      }
    };

    connectWebSocket();

    // Forward keystrokes directly to bash PTY session
    const onDataDisposable = term.onData((data) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'stdin', data }));
      }
    });

    // Forward terminal resize events
    const onResizeDisposable = term.onResize(({ cols, rows }) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    // Live resize observer for window responsiveness
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (containerRef.current && fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      } catch {}
    });
    resizeObserver.observe(containerRef.current);

    // Keep focus when clicking anywhere in terminal area
    const handleContainerClick = () => {
      term.focus();
    };
    const el = containerRef.current;
    el.addEventListener('click', handleContainerClick);

    return () => {
      isTermDisposed = true;
      el.removeEventListener('click', handleContainerClick);
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      onResizeDisposable.dispose();

      if (socket) {
        socket.close();
        socketRef.current = null;
      }
      term.dispose();
      termInstance.current = null;
      fitAddonRef.current = null;
    };
  }, [activeTabId]);

  // Adjust font size dynamically
  const handleZoomIn = () => {
    if (fontSize < 24) {
      const newSize = fontSize + 2;
      setFontSize(newSize);
      if (termInstance.current && fitAddonRef.current) {
        termInstance.current.options.fontSize = newSize;
        fitAddonRef.current.fit();
      }
    }
  };

  const handleZoomOut = () => {
    if (fontSize > 10) {
      const newSize = fontSize - 2;
      setFontSize(newSize);
      if (termInstance.current && fitAddonRef.current) {
        termInstance.current.options.fontSize = newSize;
        fitAddonRef.current.fit();
      }
    }
  };

  // Copy selection from terminal
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

  // Clear terminal screen
  const handleClear = () => {
    if (termInstance.current) {
      termInstance.current.clear();
      // Send Ctrl+L to shell to refresh prompt
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'stdin', data: '\x0c' }));
      }
    }
  };

  // Reconnect shell
  const handleReconnect = () => {
    if (termInstance.current) {
      termInstance.current.reset();
    }
    // Toggle active tab to trigger reconnection
    const current = activeTabId;
    setActiveTabId('');
    setTimeout(() => setActiveTabId(current), 50);
  };

  // New tab
  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      title: `unigrova@user: ~`,
      cwd: '/home/unigrova',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // Close tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1c1917] text-stone-200 select-none overflow-hidden font-mono text-sm">
      {/* Terminal Title Bar / Tabs Header */}
      <div className="flex items-center justify-between bg-stone-900 border-b border-stone-800 px-3 py-1.5 shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1 rounded text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/60'
                    : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                }`}
              >
                <TermIcon size={13} className={isActive ? 'text-orange-400' : 'text-stone-500'} />
                <span className="truncate max-w-[140px] font-medium">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-stone-700 rounded text-stone-400 hover:text-stone-200"
                    title="Close tab"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleNewTab}
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Open new terminal tab"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Status Indicator */}
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'
            }`}
            title={isConnected ? 'Connected to Linux PTY' : 'Connecting to shell...'}
          />

          <button
            onClick={handleCopySelection}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Copy selection"
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Clear terminal (Ctrl+L)"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Increase font size"
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Decrease font size"
          >
            <ZoomOut size={14} />
          </button>

          <button
            onClick={handleReconnect}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition"
            title="Reconnect shell session"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full p-2 overflow-hidden bg-[#1c1917] cursor-text"
        tabIndex={0}
      />
    </div>
  );
};
