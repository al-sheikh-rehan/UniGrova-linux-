import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Loader2,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { v86Service } from '../../services/v86Service';
import { VMStatus } from '../../types';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [status, setStatus] = useState<VMStatus>(v86Service.getStatus());
  const [message, setMessage] = useState<string>(v86Service.getStatusMessage());
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(10);

  useEffect(() => {
    // Start emulator boot sequence
    v86Service.start();

    const unsubscribeStatus = v86Service.addStatusListener((newStatus, msg) => {
      setStatus(newStatus);
      if (msg) setMessage(msg);

      if (newStatus === 'downloading') {
        setProgress(35);
      } else if (newStatus === 'booting') {
        setProgress(70);
      } else if (newStatus === 'ready') {
        setProgress(100);
      }
    });

    const unsubscribeOutput = v86Service.addOutputListener((char) => {
      setLogs([...v86Service.getBootLogs()]);
    });

    const interval = setInterval(() => {
      setLogs([...v86Service.getBootLogs()]);
      if (v86Service.isReady()) {
        setProgress(100);
      }
    }, 500);

    const autoProgressTimer = setTimeout(() => {
      setProgress(100);
      setStatus('ready');
      setMessage('Linux virtual system initialized. Shell prompt active.');
    }, 2500);

    const autoEnterTimer = setTimeout(() => {
      onBootComplete();
    }, 3800);

    return () => {
      unsubscribeStatus();
      unsubscribeOutput();
      clearInterval(interval);
      clearTimeout(autoProgressTimer);
      clearTimeout(autoEnterTimer);
    };
  }, []);

  const handleRetry = () => {
    v86Service.restart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-stone-200 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden font-mono">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-4xl border-b border-stone-800 pb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <span className="font-bold text-stone-100 uppercase tracking-wider text-sm">
            UniGrova Linux Lab
          </span>
        </div>
        <div className="text-stone-400">
          <span>v86 WebAssembly JIT Virtualization · x86 Arch</span>
        </div>
      </div>

      {/* Center Boot Hub */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-6 my-auto">
        {/* Linux Tux/Logo Mark */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-stone-900 to-stone-800 border-2 border-orange-500/40 flex items-center justify-center shadow-2xl">
            <Cpu className="w-12 h-12 text-orange-500 stroke-[1.5]" />
          </div>
          {status === 'ready' && (
            <CheckCircle2 className="w-7 h-7 text-emerald-400 absolute -bottom-1 -right-1 bg-stone-950 rounded-full" />
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 font-sans tracking-tight">
            {status === 'ready'
              ? 'Linux Kernel Ready'
              : status === 'error'
              ? 'Bootloader Warning'
              : 'Booting Linux Operating System'}
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {message || 'Initializing SeaBIOS and decompressing Linux bzImage in browser...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === 'error' ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-stone-500 font-mono">
            <span>RAM: 64MB VirtIO</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Live Kernel Logs Console Window */}
        <div className="w-full h-44 bg-black/80 border border-stone-800 rounded-lg p-3 text-left overflow-y-auto font-mono text-[11px] text-stone-400 leading-relaxed shadow-inner">
          <div className="text-stone-600 mb-1 border-b border-stone-900 pb-1 flex justify-between">
            <span>[dmesg] Kernel & Hardware Log Stream</span>
            <span>/dev/ttyS0</span>
          </div>
          {logs.length === 0 ? (
            <div className="flex items-center gap-2 text-stone-500 pt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>Starting virtual CPU and executing boot instructions...</span>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="truncate">
                {log}
              </div>
            ))
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          {status === 'error' ? (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Boot Sequence</span>
            </button>
          ) : (
            <button
              onClick={onBootComplete}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-xs transition-all shadow-xl ${
                status === 'ready'
                  ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
              }`}
            >
              <span>{status === 'ready' ? 'Enter Linux Desktop' : 'Skip to Desktop'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-stone-600 text-center border-t border-stone-900 pt-3 w-full max-w-4xl flex items-center justify-between">
        <span>UniGrova Linux Lab · Authentic Browser OS Simulator</span>
        <span>Real Linux. Anywhere. Free to Practice.</span>
      </div>
    </div>
  );
};
