import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Trash2,
} from 'lucide-react';
import { v86Service } from '../../services/v86Service';
import { defaultShell } from '../../services/shellService';

interface ProcessItem {
  pid: string;
  user: string;
  stat: string;
  vsx: string;
  command: string;
}

export const SystemMonitorApp: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [memTotal, setMemTotal] = useState<number>(64);
  const [memUsed, setMemUsed] = useState<number>(18);
  const [diskTotal, setDiskTotal] = useState<number>(12);
  const [diskUsed, setDiskUsed] = useState<number>(6.2);
  const [processes, setProcesses] = useState<ProcessItem[]>([
    { pid: '1', user: 'root', stat: 'S', vsx: '1840', command: '/bin/init' },
    { pid: '2', user: 'root', stat: 'S', vsx: '0', command: '[kthreadd]' },
    { pid: '3', user: 'root', stat: 'I', vsx: '0', command: '[rcu_gp]' },
    { pid: '4', user: 'root', stat: 'I', vsx: '0', command: '[rcu_par_gp]' },
    { pid: '12', user: 'root', stat: 'S', vsx: '2100', command: '/bin/syslogd' },
    { pid: '18', user: 'root', stat: 'S', vsx: '1980', command: '/bin/klogd' },
    { pid: '35', user: 'root', stat: 'S', vsx: '2456', command: '-sh' },
  ]);
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMetrics = () => {
    setIsLoading(true);
    try {
      const freeRes = defaultShell.execute('free -m');
      const freeLines = freeRes.output.split('\n');
      for (const line of freeLines) {
        if (line.includes('Mem:')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const total = parseInt(parts[1], 10) || 128;
            const used = parseInt(parts[2], 10) || 48;
            setMemTotal(total);
            setMemUsed(used);
          }
        }
      }

      const psRes = defaultShell.execute('ps aux');
      const psLines = psRes.output.split('\n');
      const parsed: ProcessItem[] = [];

      for (const line of psLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4 && !line.includes('PID')) {
          parsed.push({
            pid: parts[0],
            user: parts[1] || 'root',
            vsx: parts[2] || '0',
            stat: 'S',
            command: parts.slice(3).join(' ') || parts[2],
          });
        }
      }

      if (parsed.length > 0) {
        setProcesses(parsed);
      }

      setCpuUsage(Math.floor(6 + Math.random() * 12));
    } catch (e) {
      console.warn('System monitor fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid: string) => {
    if (pid === '1') {
      alert('Cannot terminate PID 1 (/bin/init) - system kernel requirement.');
      return;
    }
    if (!confirm(`Send SIGTERM to process PID ${pid}?`)) return;

    try {
      if (v86Service.isReady()) {
        await v86Service.execCommand(`kill -9 ${pid}`);
      }
      setProcesses((prev) => prev.filter((p) => p.pid !== pid));
      setSelectedPid(null);
    } catch (e) {
      console.error('Failed to kill process:', e);
    }
  };

  const memPercent = Math.round((memUsed / memTotal) * 100);
  const diskPercent = Math.round((diskUsed / diskTotal) * 100);

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-none overflow-hidden text-xs">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-stone-200">Linux System Monitor</span>
        </div>
        <button
          onClick={fetchMetrics}
          title="Refresh statistics"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-stone-950/60 border-b border-stone-800">
        {/* CPU Gauge */}
        <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-stone-400 font-medium">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>CPU Activity</span>
            </span>
            <span className="font-mono text-stone-200 font-semibold">{cpuUsage}%</span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
          <div className="text-[10px] text-stone-500 mt-2 flex justify-between font-mono">
            <span>x86 JIT Core</span>
            <span>100% capacity</span>
          </div>
        </div>

        {/* Memory Gauge */}
        <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-stone-400 font-medium">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>RAM Allocation</span>
            </span>
            <span className="font-mono text-stone-200 font-semibold">
              {memUsed}MB / {memTotal}MB ({memPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${memPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-stone-500 mt-2 flex justify-between font-mono">
            <span>{memTotal - memUsed}MB Free</span>
            <span>Virtual Memory</span>
          </div>
        </div>

        {/* Storage Gauge */}
        <div className="bg-stone-900 p-3 rounded-lg border border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-stone-400 font-medium">
              <HardDrive className="w-4 h-4 text-orange-400" />
              <span>Root Partition</span>
            </span>
            <span className="font-mono text-stone-200 font-semibold">
              {diskUsed}MB / {diskTotal}MB ({diskPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${diskPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-stone-500 mt-2 flex justify-between font-mono">
            <span>/dev/ram0 (ramdisk)</span>
            <span>rw, noatime</span>
          </div>
        </div>
      </div>

      {/* Process Table Header & List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-12 px-3 py-1.5 bg-stone-950 font-semibold text-stone-400 border-b border-stone-800 text-[11px]">
          <div className="col-span-2">PID</div>
          <div className="col-span-2">User</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">VSZ (KB)</div>
          <div className="col-span-4">Command</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-800/40">
          {processes.map((p) => (
            <div
              key={p.pid}
              onClick={() => setSelectedPid(p.pid)}
              className={`grid grid-cols-12 px-3 py-1.5 items-center cursor-pointer transition-colors text-stone-300 font-mono text-[11px] ${
                selectedPid === p.pid
                  ? 'bg-orange-500/20 text-white'
                  : 'hover:bg-stone-800/50'
              }`}
            >
              <div className="col-span-2 font-semibold text-orange-400">{p.pid}</div>
              <div className="col-span-2">{p.user}</div>
              <div className="col-span-2">
                <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300">
                  {p.stat}
                </span>
              </div>
              <div className="col-span-2">{p.vsx}</div>
              <div className="col-span-4 truncate text-stone-200">{p.command}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer & Process Actions */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-950 border-t border-stone-800 text-xs">
        <div className="flex items-center gap-3 text-stone-400 font-mono text-[11px]">
          <span>Processes: {processes.length}</span>
          <span>·</span>
          <span>Kernel: Linux 5.6.15</span>
          <span>·</span>
          <span>Uptime: Active</span>
        </div>

        {selectedPid && (
          <button
            onClick={() => handleKill(selectedPid)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>End Process (PID {selectedPid})</span>
          </button>
        )}
      </div>
    </div>
  );
};
