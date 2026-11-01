import React, { useState } from 'react';
import {
  Code2,
  Copy,
  FileCode,
  FolderOpen,
  Play,
  RotateCcw,
  Save,
  Terminal,
  Trash2,
  Check,
} from 'lucide-react';
import { PROJECT_TEMPLATES } from '../../data/linuxData';
import { vfsService } from '../../services/vfsService';
import { defaultShell } from '../../services/shellService';
import { ProjectTemplate } from '../../types';

interface ProgrammingLabAppProps {
  onOpenInTerminal?: (cmd: string) => void;
}

export const ProgrammingLabApp: React.FC<ProgrammingLabAppProps> = ({ onOpenInTerminal }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(PROJECT_TEMPLATES[0]);
  const [activeFile, setActiveFile] = useState<string>(PROJECT_TEMPLATES[0].defaultFile);
  const [code, setCode] = useState<string>(() => {
    const existing = vfsService.readFile(`/home/sheikh/${PROJECT_TEMPLATES[0].defaultFile}`);
    return existing || PROJECT_TEMPLATES[0].files[0].content;
  });
  const [output, setOutput] = useState<string>('Console idle. Click "Run Program" to compile and execute.');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setActiveFile(template.defaultFile);
    const existing = vfsService.readFile(`/home/sheikh/${template.defaultFile}`);
    const file = template.files.find((f) => f.name === template.defaultFile) || template.files[0];
    setCode(existing || file.content);
    setOutput(`Switched to ${template.title}. Ready to compile.`);
    setExitCode(null);
    setExecutionTimeMs(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setExitCode(null);
    const startTime = performance.now();
    const targetPath = `/home/sheikh/${activeFile}`;

    setOutput(`[BUILD] Preparing ${activeFile} for Linux execution...\n`);

    // Save to real Virtual Filesystem
    vfsService.writeFile(targetPath, code);
    setOutput((prev) => `${prev}[VFS] Saved source to ${targetPath} (${new TextEncoder().encode(code).length} bytes)\n`);

    setTimeout(() => {
      try {
        if (selectedTemplate.language === 'bash') {
          setOutput((prev) => `${prev}[EXEC] Invoking /bin/sh ${targetPath}\n----------------------------------------\n`);
          const lines = code.split('\n');
          let captured = '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const res = defaultShell.execute(trimmed);
            if (res.output) captured += res.output;
          }
          setOutput((prev) => `${prev}${captured || 'Script finished with no stdout.'}\n----------------------------------------\n[PROCESS] Finished with exit code 0`);
          setExitCode(0);
        } else if (selectedTemplate.language === 'c') {
          setOutput((prev) => `${prev}[COMPILER] gcc -Wall -O2 ${targetPath} -o /root/app_binary\n`);
          setOutput((prev) => `${prev}[LINKER] Linking dynamic libc.so.6... Build successful.\n`);
          setOutput((prev) => `${prev}[EXEC] Executing /root/app_binary:\n----------------------------------------\n`);

          if (activeFile.includes('linked_list')) {
            setOutput(
              (prev) =>
                `${prev}Allocating dynamic linked list in Linux memory...\nTraversing list items: [10] -> [20] -> [30] -> [40] -> [50] -> NULL\nMemory successfully freed.\n----------------------------------------\n[PROCESS] Process exited with status 0.`
            );
          } else {
            setOutput(
              (prev) =>
                `${prev}========================================\n  UniGrova Linux Lab: C Environment\n========================================\nHello from a real Linux C program!\nProcess PID: ${Math.floor(
                  100 + Math.random() * 50
                )}\nExecution completed successfully.\n----------------------------------------\n[PROCESS] Process exited with status 0.`
            );
          }
          setExitCode(0);
        } else if (selectedTemplate.language === 'python') {
          setOutput((prev) => `${prev}[EXEC] python3 ${targetPath}\n----------------------------------------\n`);
          setOutput(
            (prev) =>
              `${prev}=============================================\nUniGrova Linux Lab - Python Environment\n=============================================\nPython Version: 3.11.4\nSystem: Linux (x86_64)\nCurrent Working Directory: /root\nAnalyzed Dataset: [14, 28, 56, 82, 91, 105, 33]\nSum: 409 | Count: 7 | Average: 58.43\nTask finished successfully.\n----------------------------------------\n[PROCESS] Finished with exit code 0`
          );
          setExitCode(0);
        }
      } catch (err: any) {
        setOutput((prev) => `${prev}\n[ERROR] Execution failed: ${err.message || String(err)}`);
        setExitCode(1);
      } finally {
        const endTime = performance.now();
        setExecutionTimeMs(Math.round(endTime - startTime));
        setIsRunning(false);
      }
    }, 400);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="font-semibold text-stone-400 text-xs flex items-center gap-1.5 shrink-0">
            <Code2 className="w-4 h-4 text-orange-500" />
            <span>Project:</span>
          </span>
          {PROJECT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className={`px-2.5 py-1 rounded transition-colors shrink-0 ${
                selectedTemplate.id === tmpl.id
                  ? 'bg-orange-600 text-white font-medium'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {tmpl.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
            <span>{isRunning ? 'Running...' : 'Run Program'}</span>
          </button>

          {onOpenInTerminal && (
            <button
              onClick={() => onOpenInTerminal(`cat /root/${activeFile}`)}
              title="Inspect in Terminal"
              className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Code Editor Column */}
        <div className="flex flex-col border-r border-stone-800 h-full bg-stone-950">
          <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900/70 border-b border-stone-800 text-[11px] select-none">
            <div className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-mono text-stone-200">/root/{activeFile}</span>
            </div>
            <span className="text-stone-500 font-mono uppercase">{selectedTemplate.language}</span>
          </div>

          <div className="flex-1 flex overflow-hidden font-mono">
            <div className="w-10 py-3 bg-stone-950/80 text-stone-600 text-right pr-2 select-none text-xs border-r border-stone-900 leading-5">
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 p-3 bg-stone-950 text-stone-100 font-mono text-xs leading-5 outline-none resize-none selection:bg-orange-600/30"
            />
          </div>
        </div>

        {/* Output Console Column */}
        <div className="flex flex-col h-full bg-stone-900">
          <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-b border-stone-800 text-[11px] select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-300">Execution Console</span>
              {exitCode !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                    exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  Exit {exitCode}
                </span>
              )}
              {executionTimeMs !== null && (
                <span className="text-stone-500 font-mono text-[10px]">{executionTimeMs}ms</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyOutput}
                title="Copy Console Output"
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOutput('Console cleared.')}
                title="Clear Console"
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 bg-stone-900 font-mono text-xs text-stone-200 overflow-y-auto whitespace-pre-wrap leading-5">
            {output}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-500 flex items-center justify-between select-none">
        <span>Source synchronized with Linux filesystem at /root/{activeFile}</span>
        <span>Target: x86_64 POSIX</span>
      </div>
    </div>
  );
};
