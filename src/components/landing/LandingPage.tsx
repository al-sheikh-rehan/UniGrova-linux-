import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  FileCode,
  Folder,
  GraduationCap,
  HardDrive,
  Layers,
  Play,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDesktop: () => void;
  onLaunchTerminal: () => void;
  onLaunchLab: () => void;
  onLaunchIDE: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDesktop,
  onLaunchTerminal,
  onLaunchLab,
  onLaunchIDE,
}) => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans select-text">
      {/* Top Bar Contract: Brand — 4-5 Links — 1 Primary Action */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-stone-100">
            UniGrova Linux Lab
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
          <a href="#features" className="hover:text-stone-100 transition-colors whitespace-nowrap shrink-0">
            Features
          </a>
          <a href="#comparison" className="hover:text-stone-100 transition-colors whitespace-nowrap shrink-0">
            Real vs Fake
          </a>
          <button
            onClick={onLaunchLab}
            className="hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            Practice Lab
          </button>
          <button
            onClick={onLaunchIDE}
            className="hover:text-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            Coding Lab
          </button>
          <a href="#architecture" className="hover:text-stone-100 transition-colors whitespace-nowrap shrink-0">
            Architecture
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLaunchDesktop}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 shadow-md shadow-orange-600/20"
          >
            Launch Linux
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="text-orange-400 font-semibold uppercase tracking-wider">
                WebAssembly Virtual Machine
              </span>
              <span aria-hidden="true">·</span>
              <span>Linux 5.6 Kernel</span>
              <span aria-hidden="true">·</span>
              <span>v86 JIT Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-100 leading-[1.1] text-balance">
              Real Linux. Anywhere. <br />
              <span className="text-orange-500">Free to Practice.</span>
            </h1>

            <p className="text-stone-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Experience a full Linux operating system running directly inside your browser. No
              virtual machines to install, no dual-booting, and no simulated toys. A real Linux kernel,
              real filesystem, real shell, and genuine system calls.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLaunchDesktop}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-xl shadow-orange-600/25 hover:scale-[1.02]"
              >
                <span>Launch Linux Desktop</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLaunchTerminal}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-sm transition-all"
              >
                <Terminal className="w-4 h-4 text-orange-400" />
                <span>Open Direct Terminal</span>
              </button>
            </div>

            {/* Quick Proof Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-900 text-xs">
              <div>
                <span className="block font-bold text-lg text-stone-100 font-mono">100% Real</span>
                <span className="text-stone-500">Kernel Syscalls & IPC</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-stone-100 font-mono">64MB+ RAM</span>
                <span className="text-stone-500">VirtIO WebAssembly</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-stone-100 font-mono">IndexedDB</span>
                <span className="text-stone-500">Persistent Storage</span>
              </div>
            </div>
          </div>

          {/* Hero Visual: Live Desktop Preview Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-900">
              {/* Preview Window Header */}
              <div className="bg-stone-950 px-4 py-2.5 flex items-center justify-between border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-stone-400 ml-2">root@unigrova:~#</span>
                </div>
                <span className="text-[11px] text-stone-500 font-mono">ttyS0 · x86</span>
              </div>

              {/* Preview Content */}
              <div className="p-4 font-mono text-xs text-stone-300 space-y-2.5 bg-stone-950/90 min-h-[300px]">
                <div className="text-orange-400 font-semibold">
                  # Linux buildroot 5.6.15 i686 GNU/Linux
                </div>
                <div>
                  <span className="text-stone-500">$</span> uname -a
                </div>
                <div className="text-stone-400 text-[11px] pl-2 border-l border-stone-800">
                  Linux unigrova-lab 5.6.15 #16 Mon Jul 20 19:33:46 CDT 2020 i686 GNU/Linux
                </div>

                <div>
                  <span className="text-stone-500">$</span> ls -la /root
                </div>
                <div className="text-stone-400 text-[11px] pl-2 border-l border-stone-800">
                  drwx------    3 root     root          1024 Oct 31 14:30 .<br />
                  drwxr-xr-x   16 root     root          1024 Oct 31 14:30 ..<br />
                  -rw-r--r--    1 root     root           312 Oct 31 14:31 main.c<br />
                  -rwxr-xr-x    1 root     root           245 Oct 31 14:32 script.sh
                </div>

                <div>
                  <span className="text-stone-500">$</span> cat /root/main.c | grep printf
                </div>
                <div className="text-emerald-400 text-[11px] pl-2 border-l border-stone-800">
                  printf("Hello from a real Linux C program!\n");
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Press "Launch Linux" to begin</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: Real Linux Kernel vs Fake JS Mock Shells */}
      <section id="comparison" className="px-6 lg:px-12 py-16 bg-stone-900/40 border-y border-stone-800/60">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-orange-400 font-mono text-xs uppercase tracking-wider">
              Authentic Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
              Why Real Kernel Emulation Matters
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm">
              Most online tutorials use simulated string-matching parsers that break when you try
              real commands, complex pipes, or scripts. UniGrova runs real compiled x86 Linux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fake Shell Column */}
            <div className="p-6 rounded-xl bg-stone-950 border border-stone-800 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono text-[11px] font-semibold">
                  TRADITIONAL / FAKE SHELLS
                </span>
              </div>
              <ul className="space-y-3 text-xs text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Hardcoded if-statements matching predefined command strings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Fake filesystem stored in mock JSON object without true file modes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Pipes (|) and redirection (&gt;, &gt;&gt;) fail or produce bogus outputs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Ctrl+C, signals, and background jobs do not exist.</span>
                </li>
              </ul>
            </div>

            {/* UniGrova Real Linux Column */}
            <div className="p-6 rounded-xl bg-stone-950 border border-orange-500/40 space-y-4 shadow-xl shadow-orange-600/5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-400 font-mono text-[11px] font-semibold">
                  UNIGROVA LINUX LAB
                </span>
              </div>
              <ul className="space-y-3 text-xs text-stone-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real x86 compiled Linux kernel executing genuine CPU instructions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>True POSIX filesystem with inode metadata, permissions, and directories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Full pipeline chaining, input/output redirection, and shell scripting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Persistent files saved to browser IndexedDB storage across sessions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-orange-400 font-mono text-xs uppercase tracking-wider">
            Complete Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
            A Complete Linux Environment in Your Tab
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm">
            Everything you need to learn, develop, and master the world's most powerful operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">xterm.js Serial Terminal</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Connected directly to /dev/ttyS0 over serial emulation. Full VT100 colors, tab completion,
              multiple tabs, and history navigation.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Folder className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">Filesystem Manager</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Explore Linux directories, upload local files from your PC into the virtual machine,
              and export files created in Linux.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">C & Script Programming Lab</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Write C code, Python routines, or Bash automation scripts with syntax styling, compile buttons,
              and direct Linux stdout capture.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">Learning Lab & MCQs</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Step-by-step challenges for Beginner, Intermediate, and Advanced tiers with automated command
              verification and certification quizzes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">Ubuntu Desktop Shell</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Polished Ubuntu Yaru interface with draggable resizable windows, top panel, left dock,
              wallpapers, and right-click context menu.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base">IndexedDB Persistence</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Your files, terminal command history, custom configurations, and lab achievements are
              automatically retained across browser restarts.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Deep Dive */}
      <section id="architecture" className="px-6 lg:px-12 py-16 bg-stone-900/30 border-t border-stone-800/60">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-orange-400 font-mono text-xs uppercase tracking-wider">
              Under the Hood
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
              Virtualization Architecture
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm">
              UniGrova Linux Lab combines standard web standards into an operating system platform:
            </p>
          </div>

          <div className="p-6 rounded-xl bg-stone-950 border border-stone-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="text-stone-400 font-semibold">Virtual Machine Specification</span>
              <span className="text-emerald-400">Active / Operational</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-300">
              <div>
                <span className="text-stone-500 block">CPU Architecture:</span>
                <span>x86 32-bit (i686) JIT WebAssembly</span>
              </div>
              <div>
                <span className="text-stone-500 block">BIOS Firmware:</span>
                <span>SeaBIOS 1.14 (128 KB) + VGABIOS</span>
              </div>
              <div>
                <span className="text-stone-500 block">Kernel Binary:</span>
                <span>Linux 5.6.15 bzImage (compiled Buildroot)</span>
              </div>
              <div>
                <span className="text-stone-500 block">Primary Display:</span>
                <span>/dev/ttyS0 Serial Console via xterm.js</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-stone-800 text-xs text-stone-500 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-stone-300">UniGrova Linux Lab</span> — Real Linux. Anywhere. Free to Practice.
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLaunchDesktop} className="hover:text-stone-300">Desktop</button>
          <button onClick={onLaunchTerminal} className="hover:text-stone-300">Terminal</button>
          <button onClick={onLaunchLab} className="hover:text-stone-300">Practice</button>
          <button onClick={onLaunchIDE} className="hover:text-stone-300">IDE</button>
        </div>
      </footer>
    </div>
  );
};
