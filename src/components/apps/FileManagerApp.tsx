import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Download,
  File,
  FileCode,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Grid,
  List,
} from 'lucide-react';
import { vfsService, VFSEntry } from '../../services/vfsService';

interface FileManagerAppProps {
  onOpenFileInEditor?: (path: string) => void;
}

export const FileManagerApp: React.FC<FileManagerAppProps> = ({ onOpenFileInEditor }) => {
  const [currentPath, setCurrentPath] = useState<string>('/home/sheikh');
  const [items, setItems] = useState<VFSEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<VFSEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newDialog, setNewDialog] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('Ready');

  const loadDirectory = (path: string) => {
    const resolved = vfsService.resolvePath(path, '/');
    const dirItems = vfsService.readDir(resolved);
    setItems(dirItems);
    setStatusText(`${dirItems.length} items in ${resolved}`);
  };

  useEffect(() => {
    loadDirectory(currentPath);
    // Real-time synchronization whenever terminal or text editor modifies VFS
    const unsubscribe = vfsService.subscribe(() => {
      loadDirectory(currentPath);
    });
    return () => unsubscribe();
  }, [currentPath]);

  const handleNavigate = (item: VFSEntry) => {
    if (item.isDirectory) {
      setCurrentPath(item.path);
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      if (onOpenFileInEditor) {
        onOpenFileInEditor(item.path);
      }
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parent = vfsService.getParentPath(currentPath);
    setCurrentPath(parent);
    setSelectedItem(null);
  };

  const handleCreateNew = () => {
    if (!newName.trim() || !newDialog) return;
    const targetPath = vfsService.resolvePath(newName.trim(), currentPath);

    if (newDialog === 'folder') {
      vfsService.makeDir(targetPath, true);
    } else {
      vfsService.writeFile(targetPath, '');
    }

    setNewDialog(null);
    setNewName('');
    loadDirectory(currentPath);
  };

  const handleDelete = (item: VFSEntry) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    vfsService.remove(item.path, true);
    setSelectedItem(null);
    loadDirectory(currentPath);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatusText(`Uploading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const targetPath = vfsService.resolvePath(file.name, currentPath);
      vfsService.writeFile(targetPath, content);
      setStatusText(`Uploaded ${file.name}`);
      loadDirectory(currentPath);
    };
    reader.readAsText(file);
  };

  const handleDownload = (item: VFSEntry) => {
    const content = vfsService.readFile(item.path) ?? '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
    setStatusText(`Downloaded ${item.name}`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-none overflow-hidden text-xs">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-950 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoUp}
            disabled={currentPath === '/'}
            title="Go up to parent directory"
            className="p-1.5 rounded hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-transparent text-stone-300 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadDirectory(currentPath)}
            title="Refresh directory"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Path Breadcrumb Input */}
        <div className="flex-1 flex items-center bg-stone-900 px-3 py-1 rounded border border-stone-800 font-mono text-stone-300">
          <HardDrive className="w-3.5 h-3.5 text-stone-500 mr-2 shrink-0" />
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
            className="w-full bg-transparent outline-none text-xs text-orange-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewDialog('file')}
            title="New File"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>

          <button
            onClick={() => setNewDialog('folder')}
            title="New Folder"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <label
            title="Upload file into Linux"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>

          <div className="h-4 w-px bg-stone-800 mx-1" />

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} view`}
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Filesystem View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Quick Navigation Places */}
        <div className="w-44 bg-stone-950/60 border-r border-stone-800 p-2 space-y-1 hidden md:block">
          <div className="text-[10px] uppercase font-semibold text-stone-500 px-2 py-1">Places</div>
          {[
            { name: 'Home (/home/sheikh)', path: '/home/sheikh' },
            { name: 'Documents', path: '/home/sheikh/Documents' },
            { name: 'Downloads', path: '/home/sheikh/Downloads' },
            { name: 'Projects', path: '/home/sheikh/Projects' },
            { name: 'Root (/)', path: '/' },
            { name: 'Root User (/root)', path: '/root' },
            { name: 'Config (/etc)', path: '/etc' },
            { name: 'Binaries (/bin)', path: '/bin' },
            { name: 'Temporary (/tmp)', path: '/tmp' },
            { name: 'System (/proc)', path: '/proc' },
          ].map((place) => (
            <button
              key={place.path}
              onClick={() => setCurrentPath(place.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                currentPath === place.path
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{place.name}</span>
            </button>
          ))}
        </div>

        {/* Directory Contents */}
        <div className="flex-1 p-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-500">
              <Folder className="w-12 h-12 mb-2 stroke-1" />
              <p>Directory is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) => (
                <div
                  key={item.path}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => handleNavigate(item)}
                  className={`flex flex-col items-center p-2.5 rounded-lg cursor-pointer text-center border transition-all ${
                    selectedItem?.path === item.path
                      ? 'bg-orange-500/15 border-orange-500/50 text-white'
                      : 'border-transparent hover:bg-stone-800/60 text-stone-300'
                  }`}
                >
                  {item.isDirectory ? (
                    <Folder className="w-10 h-10 text-orange-400 mb-1 fill-orange-400/20" />
                  ) : item.name.endsWith('.c') || item.name.endsWith('.sh') || item.name.endsWith('.py') ? (
                    <FileCode className="w-10 h-10 text-emerald-400 mb-1" />
                  ) : (
                    <FileText className="w-10 h-10 text-stone-400 mb-1" />
                  )}
                  <span className="w-full text-xs truncate font-medium">{item.name}</span>
                  {!item.isDirectory && (
                    <span className="text-[10px] text-stone-500">{item.size} B</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-12 px-2 py-1 text-stone-500 font-semibold border-b border-stone-800 text-[11px]">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Permissions</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2 text-right">Modified</div>
              </div>
              {items.map((item) => (
                <div
                  key={item.path}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => handleNavigate(item)}
                  className={`grid grid-cols-12 items-center px-2 py-1.5 rounded cursor-pointer border transition-colors ${
                    selectedItem?.path === item.path
                      ? 'bg-orange-500/15 border-orange-500/50 text-white'
                      : 'border-transparent hover:bg-stone-800/40 text-stone-300'
                  }`}
                >
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    {item.isDirectory ? (
                      <Folder className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="col-span-2 font-mono text-[11px] text-stone-400">
                    {item.permissions}
                  </div>
                  <div className="col-span-2 font-mono text-[11px] text-stone-400">
                    {item.isDirectory ? '-' : `${item.size} B`}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[11px] text-stone-500">
                    {new Date(item.modified).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Item Action Bar / Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400">
        <div>{statusText}</div>
        {selectedItem && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-stone-300">{selectedItem.name}</span>
            {!selectedItem.isDirectory && (
              <>
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                {onOpenFileInEditor && (
                  <button
                    onClick={() => onOpenFileInEditor(selectedItem.path)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => handleDelete(selectedItem)}
              className="p-1 rounded hover:bg-red-950 hover:text-red-400 text-stone-400"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal for New File / Folder */}
      {newDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-80 bg-stone-900 border border-stone-700 rounded-lg p-4 shadow-2xl">
            <h3 className="font-semibold text-stone-100 text-sm mb-3">
              {newDialog === 'folder' ? 'Create New Directory' : 'Create New File'}
            </h3>
            <input
              type="text"
              autoFocus
              placeholder={newDialog === 'folder' ? 'folder_name' : 'filename.txt'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
              className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs mb-4 outline-none focus:border-orange-500 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNewDialog(null);
                  setNewName('');
                }}
                className="px-3 py-1 rounded bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-500 font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
