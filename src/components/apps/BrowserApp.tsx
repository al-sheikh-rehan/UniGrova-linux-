import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Home,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState<string>('https://unigrova.org/docs/linux-architecture');
  const [inputUrl, setInputUrl] = useState<string>('https://unigrova.org/docs/linux-architecture');
  const [history, setHistory] = useState<string[]>(['https://unigrova.org/docs/linux-architecture']);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  const navigateTo = (newUrl: string) => {
    setUrl(newUrl);
    setInputUrl(newUrl);
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(newUrl);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setUrl(target);
      setInputUrl(target);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setUrl(target);
      setInputUrl(target);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Navigation Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950 border-b border-stone-800">
        <button
          onClick={handleBack}
          disabled={historyIdx <= 0}
          className="p-1 rounded hover:bg-stone-800 disabled:opacity-40 text-stone-400 hover:text-stone-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleForward}
          disabled={historyIdx >= history.length - 1}
          className="p-1 rounded hover:bg-stone-800 disabled:opacity-40 text-stone-400 hover:text-stone-200"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setUrl(url)}
          className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* URL Bar */}
        <div className="flex-1 flex items-center bg-stone-900 px-3 py-1 rounded-full border border-stone-800 text-[11px] font-mono mx-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo(inputUrl)}
            className="w-full bg-transparent outline-none text-stone-200"
          />
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-stone-950/70 border-b border-stone-800 text-[11px] text-stone-400 overflow-x-auto scrollbar-none">
        <button
          onClick={() => navigateTo('https://unigrova.org/docs/linux-architecture')}
          className="hover:text-orange-400 transition-colors shrink-0"
        >
          Architecture & v86
        </button>
        <span>·</span>
        <button
          onClick={() => navigateTo('https://kernel.org/docs')}
          className="hover:text-orange-400 transition-colors shrink-0"
        >
          Kernel Documentation
        </button>
        <span>·</span>
        <button
          onClick={() => navigateTo('https://man7.org/linux/man-pages')}
          className="hover:text-orange-400 transition-colors shrink-0"
        >
          Linux Manpages
        </button>
        <span>·</span>
        <button
          onClick={() => navigateTo('https://alpinelinux.org')}
          className="hover:text-orange-400 transition-colors shrink-0"
        >
          Alpine & Buildroot
        </button>
      </div>

      {/* Rendered Web Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-stone-900 space-y-6">
        {url.includes('linux-architecture') ? (
          <div className="max-w-2xl mx-auto space-y-4 text-stone-300 leading-relaxed">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-orange-400 font-mono text-xs uppercase tracking-wider">
                Technical Documentation
              </span>
              <h1 className="text-2xl font-bold text-stone-100 mt-1">
                How Real Linux Runs in the Browser via v86
              </h1>
            </div>

            <p>
              Unlike JavaScript mock shells that merely match string inputs with predetermined
              responses, <strong>UniGrova Linux Lab</strong> executes a genuine, unmodified Linux
              kernel (32-bit x86 architecture) inside a WebAssembly virtual machine emulator
              created by Fabian Hemmer (v86).
            </p>

            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-2">
              <h3 className="font-semibold text-stone-200 text-sm">Key Architecture Components</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-stone-400 font-mono">
                <li>SeaBIOS: Open-source 16-bit x86 BIOS layer initialized first.</li>
                <li>v86.wasm: JIT compiler translating x86 opcodes into WebAssembly.</li>
                <li>Linux Kernel: bzImage with VirtIO drivers & ramdisk rootfs.</li>
                <li>Serial Console: Attached to /dev/ttyS0 streaming into xterm.js.</li>
                <li>IndexedDB: Persistent file block storage across browser sessions.</li>
              </ul>
            </div>

            <h3 className="text-lg font-bold text-stone-100 pt-2">Why This Approach Matters</h3>
            <p>
              Because you are interacting with real Linux syscalls (<code>fork</code>,{' '}
              <code>execve</code>, <code>pipe</code>, <code>open</code>, <code>read</code>), all
              standard Unix behaviors work authentic to real hardware:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-400 pl-2">
              <li>Piping outputs with <code>|</code> creates real kernel IPC pipes.</li>
              <li>Input and output redirection (<code>&gt;</code>, <code>&gt;&gt;</code>) invokes true filesystem writes.</li>
              <li>Signals like Ctrl+C send actual <code>SIGINT</code> to running process groups.</li>
              <li>Permissions (<code>chmod</code>, <code>chown</code>) alter actual inode metadata bits.</li>
            </ul>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4 text-stone-300">
            <h2 className="text-xl font-bold text-stone-100">Linux System Resource: {url}</h2>
            <p className="text-xs text-stone-400">
              Offline Linux manual reference cached within UniGrova Linux Lab.
            </p>
            <div className="p-4 bg-stone-950 rounded border border-stone-800 text-xs font-mono">
              Displaying offline documentation snapshot for current page. You can execute commands in
              the Terminal or Practice Lab to see these principles in real-time.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
