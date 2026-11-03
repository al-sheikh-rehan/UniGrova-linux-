export type WindowId =
  | 'terminal'
  | 'files'
  | 'editor'
  | 'ide'
  | 'python'
  | 'monitor'
  | 'calc'
  | 'settings'
  | 'browser'
  | 'reference'
  | 'lab';

export interface WindowState {
  id: WindowId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type VMStatus = 'idle' | 'downloading' | 'booting' | 'ready' | 'error' | 'stopped';

export interface VMConfig {
  image: 'buildroot' | 'linux4';
  memorySizeMB: number;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
  permissions?: string;
}

export interface TerminalTab {
  id: string;
  title: string;
}

export interface LabTask {
  id: string;
  title: string;
  instruction: string;
  commandHint: string;
  verificationCmd?: string;
  verificationPattern?: string;
}

export interface LabLesson {
  id: string;
  tier: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  tasks: LabTask[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LinuxCommand {
  name: string;
  category: 'files' | 'system' | 'process' | 'text' | 'network' | 'permissions';
  summary: string;
  syntax: string;
  example: string;
  options: { flag: string; desc: string }[];
}

export interface ProjectTemplate {
  id: string;
  title: string;
  language: 'c' | 'python' | 'bash';
  description: string;
  defaultFile: string;
  files: { name: string; content: string }[];
}
