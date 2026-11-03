import React, { useEffect, useState } from 'react';
import {
  Download,
  FileCode,
  FileText,
  FolderOpen,
  Plus,
  Save,
  Check,
} from 'lucide-react';
import { vfsService } from '../../services/vfsService';

interface TextEditorAppProps {
  initialPath?: string;
}

export const TextEditorApp: React.FC<TextEditorAppProps> = ({ initialPath }) => {
  const [filePath, setFilePath] = useState<string>(initialPath || '/home/unigrova/Documents/welcome.txt');
  const [content, setContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('Ready');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openPathInput, setOpenPathInput] = useState<string>('/home/unigrova');

  useEffect(() => {
    const target = initialPath || '/home/unigrova/Documents/welcome.txt';
    loadFile(target);
  }, [initialPath]);

  const loadFile = (path: string) => {
    const resolved = vfsService.resolvePath(path, '/home/unigrova');
    setSaveStatus(`Loading ${resolved}...`);

    const fileData = vfsService.readFile(resolved);
    if (fileData !== null) {
      setContent(fileData);
      setFilePath(resolved);
      setIsSaved(true);
      setSaveStatus(`Opened ${resolved}`);
    } else {
      setSaveStatus(`New file: ${resolved}`);
      setFilePath(resolved);
      setContent('');
      setIsSaved(true);
    }
  };

  const handleSave = () => {
    const resolved = vfsService.resolvePath(filePath, '/home/unigrova');
    setSaveStatus('Saving to Linux filesystem...');

    const ok = vfsService.writeFile(resolved, content);
    if (ok) {
      setIsSaved(true);
      setSaveStatus('File saved successfully');
      setTimeout(() => setSaveStatus('Ready'), 2500);
    } else {
      setSaveStatus('Failed to save file: parent directory missing');
    }
  };

  const handleNew = () => {
    const newName = `/root/file_${Date.now().toString().slice(-4)}.txt`;
    setFilePath(newName);
    setContent('');
    setIsSaved(true);
    setSaveStatus('New file created');
  };

  const handleDownload = () => {
    const filename = filePath.split('/').pop() || 'document.txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute stats
  const lines = content.split('\n');
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Top Menu Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNew}
            title="Create new file"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <button
            onClick={() => setOpenModal(true)}
            title="Open existing file"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={handleSave}
            title="Save file to Linux"
            className="flex items-center gap-1 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download file to computer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Current File Path */}
        <div className="flex items-center gap-2 font-mono text-stone-400 bg-stone-900 px-3 py-0.5 rounded border border-stone-800 text-[11px]">
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          <input
            type="text"
            value={filePath}
            onChange={(e) => {
              setFilePath(e.target.value);
              setIsSaved(false);
            }}
            className="bg-transparent outline-none text-stone-200 w-44 sm:w-64"
          />
          {!isSaved && <span className="text-orange-400 text-xs font-bold">●</span>}
        </div>
      </div>

      {/* Editor Main Text Area with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono bg-stone-950">
        {/* Line Numbers */}
        <div className="w-12 py-3 bg-stone-950/80 text-stone-600 text-right pr-3 select-none text-xs border-r border-stone-900 leading-5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Content Area */}
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Start typing file content..."
          spellCheck={false}
          className="flex-1 p-3 bg-stone-950 text-stone-100 font-mono text-xs leading-5 outline-none resize-none selection:bg-orange-600/30"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>{saveStatus}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{lines.length} lines</span>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span className="text-stone-500">UTF-8</span>
        </div>
      </div>

      {/* Open File Modal */}
      {openModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-80 bg-stone-900 border border-stone-700 rounded-lg p-4 shadow-2xl">
            <h3 className="font-semibold text-stone-100 text-sm mb-3">Open File from Linux</h3>
            <input
              type="text"
              autoFocus
              value={openPathInput}
              onChange={(e) => setOpenPathInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadFile(openPathInput);
                  setOpenModal(false);
                }
              }}
              placeholder="/root/welcome.txt"
              className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs mb-4 outline-none focus:border-orange-500 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenModal(false)}
                className="px-3 py-1 rounded bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  loadFile(openPathInput);
                  setOpenModal(false);
                }}
                className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-500 font-medium"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
