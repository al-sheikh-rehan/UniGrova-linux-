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
    const existing = vfsService.readFile(`/home/unigrova/Projects/${PROJECT_TEMPLATES[0].defaultFile}`);
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
    const existing = vfsService.readFile(`/home/unigrova/Projects/${template.defaultFile}`);
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
    const targetPath = `/home/unigrova/Projects/${activeFile}`;

    setOutput(`[BUILD] Preparing ${activeFile} on Linux filesystem...\n`);

    // Save to real Virtual Filesystem and disk
    vfsService.writeFile(targetPath, code);
    setOutput((prev) => `${prev}[DISK] Saved source to ${targetPath}\n`);

    try {
      let command = '';
      if (selectedTemplate.language === 'bash') {
        setOutput((prev) => `${prev}[EXEC] /bin/bash ${targetPath}\n----------------------------------------\n`);
        command = `bash "${targetPath}"`;
      } else if (selectedTemplate.language === 'c') {
        setOutput((prev) => `${prev}[COMPILER] gcc -Wall -O2 "${targetPath}" -o /tmp/prog\n[EXEC] Running /tmp/prog\n----------------------------------------\n`);
        command = `gcc -Wall -O2 "${targetPath}" -o /tmp/prog && /tmp/prog`;
      } else if (selectedTemplate.language === 'python') {
        setOutput((prev) => `${prev}[EXEC] /usr/bin/python3 "${targetPath}"\n----------------------------------------\n`);
        command = `python3 "${targetPath}"`;
      }

      const response = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          cwd: '/home/unigrova',
          user: 'unigrova',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let resultText = data.stdout || '';
        if (data.stderr) {
          resultText += (resultText ? '\n' : '') + data.stderr;
        }
        setOutput((prev) => `${prev}${resultText || '(Process exited with no output)'}\n----------------------------------------\n[PROCESS] Finished with exit code ${data.exitCode}`);
        setExitCode(data.exitCode);
      } else {
        setOutput((prev) => `${prev}[ERROR] Backend compiler server returned status ${response.status}`);
        setExitCode(1);
      }
    } catch (err: any) {
      setOutput((prev) => `${prev}\n[ERROR] Execution failed: ${err.message || String(err)}`);
      setExitCode(1);
    } finally {
      const endTime = performance.now();
      setExecutionTimeMs(Math.round(endTime - startTime));
      setIsRunning(false);
    }
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
