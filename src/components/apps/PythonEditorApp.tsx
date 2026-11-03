import React, { useState } from 'react';
import {
  Code,
  Copy,
  FileCode,
  Play,
  RotateCcw,
  Save,
  Terminal,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { vfsService } from '../../services/vfsService';
import { defaultShell } from '../../services/shellService';

const PYTHON_SNIPPETS = [
  {
    id: 'sysinfo',
    title: 'System Information',
    desc: 'Query Linux platform, CPU info, and environment',
    code: `# Python 3 - Linux System Information
import sys
import os
import platform

print("=== UniGrova Linux Python Environment ===")
print(f"Python Version : {sys.version.split()[0]}")
print(f"Operating Sys  : {platform.system()} {platform.release()}")
print(f"Architecture   : {platform.machine()}")
print(f"Current User   : {os.environ.get('USER', 'unigrova')}")
print(f"Hostname       : {platform.node() or 'user'}")
print(f"Working Dir    : {os.getcwd()}")
print("==========================================")
`,
  },
  {
    id: 'filesystem',
    title: 'Filesystem Inspector',
    desc: 'List and inspect files in /home/unigrova',
    code: `# Inspect /home/unigrova files
import os

path = "/home/unigrova"
print(f"Scanning directory: {path}")
print("-" * 40)

for root, dirs, files in os.walk(path):
    indent = "  " * root.count("/")
    print(f"{indent}[DIR]  {os.path.basename(root)}/")
    for f in files:
        full_path = os.path.join(root, f)
        size = os.path.getsize(full_path) if os.path.exists(full_path) else 0
        print(f"{indent}  ├── {f} ({size} bytes)")
`,
  },
  {
    id: 'calculator',
    title: 'Data & Statistics',
    desc: 'Compute mathematical series and statistics',
    code: `# Math & Statistics in Linux Python
import math

numbers = [12, 45, 67, 89, 34, 23, 78, 90, 56, 100]

print("Input data:", numbers)
total = sum(numbers)
mean = total / len(numbers)
variance = sum((x - mean) ** 2 for x in numbers) / len(numbers)
std_dev = math.sqrt(variance)

print(f"Count      : {len(numbers)}")
print(f"Sum        : {total}")
print(f"Average    : {mean:.2f}")
print(f"Min / Max  : {min(numbers)} / {max(numbers)}")
print(f"Std Dev    : {std_dev:.2f}")
`,
  },
  {
    id: 'fileio',
    title: 'File Creator & Writer',
    desc: 'Generate a new file in /home/unigrova/Documents',
    code: `# Generate a report file
import datetime

report_path = "/home/unigrova/Documents/python_report.txt"
timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

content = f"""UniGrova Linux Automated Report
Generated: {timestamp}
Status   : All services running normally
Memory   : 2048 MB VirtIO
Host     : user
User     : unigrova
"""

with open(report_path, "w") as f:
    f.write(content)

print(f"Successfully generated {report_path}")
print("Content written:")
print(content)
`,
  },
];

interface PythonEditorAppProps {
  onOpenInTerminal?: (cmd: string) => void;
}

export const PythonEditorApp: React.FC<PythonEditorAppProps> = ({ onOpenInTerminal }) => {
  const [selectedSnippet, setSelectedSnippet] = useState(PYTHON_SNIPPETS[0]);
  const [code, setCode] = useState<string>(() => {
    const existing = vfsService.readFile('/home/unigrova/Projects/app.py');
    return existing || PYTHON_SNIPPETS[0].code;
  });
  const [output, setOutput] = useState<string>('Python 3.10.12 interactive sandbox ready.\nClick "Run Script" to execute.');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Ready');

  const handleSelectSnippet = (snippet: typeof PYTHON_SNIPPETS[0]) => {
    setSelectedSnippet(snippet);
    setCode(snippet.code);
    setOutput(`Loaded snippet "${snippet.title}". Ready to run.`);
    setExitCode(null);
    setExecutionTimeMs(null);
  };

  const handleSave = () => {
    const path = '/home/unigrova/Projects/app.py';
    vfsService.writeFile(path, code);
    setSaveStatus('Saved to ' + path);
    setTimeout(() => setSaveStatus('Ready'), 2000);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setExitCode(null);
    const startTime = performance.now();
    const targetPath = '/home/unigrova/Projects/app.py';

    // Persist file
    vfsService.writeFile(targetPath, code);

    setOutput(`[PYTHON3] Executing /usr/bin/python3 ${targetPath}...\n----------------------------------------\n`);

    try {
      const response = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `python3 "${targetPath}"`,
          cwd: '/home/unigrova',
          user: 'unigrova',
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        let resultText = data.stdout || '';
        if (data.stderr) {
          resultText += (resultText ? '\n' : '') + data.stderr;
        }
        setOutput(
          (prev) =>
            prev +
            (resultText || '(Script completed with no output)') +
            `\n----------------------------------------\n[Process completed in ${elapsed}ms with exit code ${data.exitCode}]`
        );
        setExitCode(data.exitCode);
      } else {
        setOutput((prev) => prev + `[Server error]: HTTP status ${response.status}`);
        setExitCode(1);
      }
      setExecutionTimeMs(elapsed);
    } catch (err: any) {
      setOutput((prev) => prev + `[Runtime Exception]: ${err.message || err}`);
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text font-mono text-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-b border-stone-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-900 border border-stone-800 text-yellow-400 font-semibold text-xs">
            <Code className="w-3.5 h-3.5 text-yellow-400" />
            <span>Python 3.10 IDE</span>
          </div>

          {/* Snippet Picker */}
          <div className="flex items-center gap-1">
            {PYTHON_SNIPPETS.map((snip) => (
              <button
                key={snip.id}
                onClick={() => handleSelectSnippet(snip)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedSnippet.id === snip.id
                    ? 'bg-yellow-500/20 text-yellow-300 font-medium border border-yellow-500/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {snip.title}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-500 hidden sm:inline">{saveStatus}</span>

          <button
            onClick={handleSave}
            title="Save to /home/unigrova/Projects/app.py"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy script"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onOpenInTerminal && (
            <button
              onClick={() => onOpenInTerminal('python3 /home/unigrova/Projects/app.py')}
              title="Run in Terminal"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">In Terminal</span>
            </button>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-xs transition-all shadow-md ${
              isRunning
                ? 'bg-yellow-600/50 text-stone-300 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Script'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Python Code Editor */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-800">
          <div className="flex items-center justify-between px-3 py-1 bg-stone-950/80 border-b border-stone-800/80 text-[11px] text-stone-400 select-none">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-stone-300">/home/unigrova/Projects/app.py</span>
            </div>
            <span>UTF-8 · Python 3</span>
          </div>

          <div className="flex-1 relative flex">
            {/* Line numbers */}
            <div className="w-10 bg-stone-950/40 select-none py-3 text-right pr-2 text-stone-600 font-mono text-xs border-r border-stone-800/40">
              {code.split('\n').map((_, i) => (
                <div key={i} className="leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 h-full p-3 bg-stone-900/90 text-stone-100 font-mono text-xs leading-5 resize-none outline-none focus:ring-0 select-text"
            />
          </div>
        </div>

        {/* Output Console */}
        <div className="w-full lg:w-96 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-3 py-1 bg-stone-950/80 border-b border-stone-800/80 text-[11px] text-stone-400 select-none">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold text-stone-300">Python Console</span>
              {exitCode !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  Exit: {exitCode}
                </span>
              )}
            </div>

            <button
              onClick={() => setOutput('')}
              title="Clear console"
              className="p-1 hover:text-white rounded hover:bg-stone-800 text-stone-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <pre className="flex-1 p-3 overflow-y-auto text-xs text-stone-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};
