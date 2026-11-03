/**
 * Virtual Filesystem (VFS) Service
 * Provides persistent POSIX-like hierarchical filesystem with permissions, directories,
 * user/group ownership (unigrova / root), and real-time synchronization between
 * Terminal, File Manager, Text Editor, and IDE.
 */

export interface VFSEntry {
  name: string;
  path: string; // Normalized absolute path, e.g. "/home/unigrova/welcome.txt"
  isDirectory: boolean;
  content?: string;
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified: string;
}

const STORAGE_KEY = 'unigrova_linux_vfs_v5';

class VFSService {
  private files: Map<string, VFSEntry> = new Map();
  private subscribers: Set<() => void> = new Set();
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    this.loadFromStorage();
    if (this.files.size === 0 || !this.files.has('/home/unigrova')) {
      this.populateDefaultFilesystem();
      this.saveToStorage();
    }
    this.isLoaded = true;
    this.syncFromDisk('/home/unigrova');
  }

  public async syncFromDisk(dirPath: string = '/home/unigrova'): Promise<void> {
    try {
      const res = await fetch(`/api/fs/list?path=${encodeURIComponent(dirPath)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            this.files.set(item.path, item);
          }
          this.notify();
        }
      }
    } catch {
      // Backend not yet available, keep local VFS
    }
  }

  private populateDefaultFilesystem() {
    const now = new Date().toISOString();

    const addDir = (path: string, permissions = 'drwxr-xr-x', owner = 'root', group = 'root') => {
      const parts = path.split('/').filter(Boolean);
      const name = parts.length === 0 ? '/' : parts[parts.length - 1];
      this.files.set(path, {
        name,
        path,
        isDirectory: true,
        size: 4096,
        permissions,
        owner,
        group,
        modified: now,
      });
    };

    const addFile = (
      path: string,
      content: string,
      permissions = '-rw-r--r--',
      owner = 'root',
      group = 'root'
    ) => {
      const parts = path.split('/').filter(Boolean);
      const name = parts[parts.length - 1];
      this.files.set(path, {
        name,
        path,
        isDirectory: false,
        content,
        size: new TextEncoder().encode(content).length,
        permissions,
        owner,
        group,
        modified: now,
      });
    };

    // Root Hierarchy
    addDir('/');
    addDir('/root', 'drwx------', 'root', 'root');
    addDir('/home', 'drwxr-xr-x', 'root', 'root');
    addDir('/home/unigrova', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Desktop', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Documents', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Downloads', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Music', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Pictures', 'drwxr-xr-x', 'unigrova', 'unigrova');
    addDir('/home/unigrova/Projects', 'drwxr-xr-x', 'unigrova', 'unigrova');

    addDir('/etc', 'drwxr-xr-x', 'root', 'root');
    addDir('/etc/apt', 'drwxr-xr-x', 'root', 'root');
    addDir('/bin', 'drwxr-xr-x', 'root', 'root');
    addDir('/sbin', 'drwxr-xr-x', 'root', 'root');
    addDir('/usr', 'drwxr-xr-x', 'root', 'root');
    addDir('/usr/bin', 'drwxr-xr-x', 'root', 'root');
    addDir('/usr/sbin', 'drwxr-xr-x', 'root', 'root');
    addDir('/usr/lib', 'drwxr-xr-x', 'root', 'root');
    addDir('/var', 'drwxr-xr-x', 'root', 'root');
    addDir('/var/log', 'drwxr-xr-x', 'root', 'root');
    addDir('/tmp', 'drwxrwxrwt', 'root', 'root');
    addDir('/dev', 'drwxr-xr-x', 'root', 'root');
    addDir('/proc', 'dr-xr-xr-x', 'root', 'root');
    addDir('/sys', 'dr-xr-xr-x', 'root', 'root');

    // /etc system files with unigrova user and sudoers
    addFile('/etc/hostname', 'user\n');
    addFile(
      '/etc/hosts',
      '127.0.0.1\tlocalhost\n127.0.1.1\tuser\n::1\t\tlocalhost ip6-localhost ip6-loopback\n'
    );
    addFile(
      '/etc/os-release',
      'NAME="Ubuntu"\nVERSION="22.04.4 LTS (Jammy Jellyfish)"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 22.04.4 LTS"\nVERSION_ID="22.04"\nHOME_URL="https://www.ubuntu.com/"\nSUPPORT_URL="https://help.ubuntu.com/"\nBUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"\nUBUNTU_CODENAME=jammy\n'
    );
    addFile(
      '/etc/passwd',
      'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nunigrova:x:1000:1000:unigrova,,,:/home/unigrova:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n'
    );
    addFile(
      '/etc/group',
      'root:x:0:\nadm:x:4:unigrova\nsudo:x:27:unigrova\nunigrova:x:1000:\nnogroup:x:65534:\n'
    );
    addFile(
      '/etc/sudoers',
      '# /etc/sudoers\nDefaults\tenv_reset\nDefaults\tmail_badpass\nroot\tALL=(ALL:ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\nunigrova\tALL=(ALL:ALL) ALL\n',
      '-r--r-----'
    );

    // /proc virtual files
    addFile(
      '/proc/version',
      'Linux version 5.15.0-107-generic (buildd@lcy02-amd64-058) (gcc version 12.3.0) #117-Ubuntu SMP x86_64\n'
    );
    addFile(
      '/proc/cpuinfo',
      'processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 142\nmodel name\t: Intel(R) Core(TM) i7-10510U CPU @ 1.80GHz\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss syscall nx lm constant_tsc rep_good nopl xtopology cpuid tsc_known_freq pni pclmulqdq vmx ssse3 fma cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch invpcid_single ssbd ibrs ibpb stibp tpr_shadow vnmi flexpriority ept vpid ept_ad fsgsbase tsc_adjust bmi1 avx2 smep bmi2 erms invpcid rdseed adx smap clflushopt xsaveopt xsavec xgetbv1 xsaves arat md_clear flush_l1d arch_capabilities\nbogomips\t: 4600.00\nclflush size\t: 64\ncache_alignment\t: 64\naddress sizes\t: 39 bits physical, 48 bits virtual\n'
    );
    addFile(
      '/proc/meminfo',
      'MemTotal:         2097152 kB\nMemFree:          1245800 kB\nMemAvailable:     1564200 kB\nBuffers:           114200 kB\nCached:            489100 kB\nActive:            380400 kB\nInactive:          210500 kB\nSwapTotal:        2097148 kB\nSwapFree:         2097148 kB\n'
    );
    addFile('/proc/uptime', '3620.45 7120.12\n');

    // /dev virtual devices
    addFile('/dev/null', '', 'crw-rw-rw-');
    addFile('/dev/zero', '', 'crw-rw-rw-');
    addFile('/dev/urandom', '', 'crw-rw-rw-');
    addFile('/dev/tty', '', 'crw-rw-rw-');
    addFile('/dev/ttyS0', '', 'crw-rw----');

    // Binaries in /bin and /usr/bin
    const bins = [
      'bash', 'sh', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'echo',
      'grep', 'touch', 'pwd', 'date', 'cal', 'uname', 'hostname', 'chmod',
      'chown', 'chgrp', 'sudo', 'su', 'id', 'groups', 'ps', 'top', 'kill',
      'pkill', 'free', 'df', 'du', 'head', 'tail', 'less', 'more', 'find',
      'tree', 'file', 'stat', 'sort', 'uniq', 'wc', 'cut', 'tr', 'diff',
      'nano', 'vi', 'uptime', 'nice', 'renice', 'umask', 'which', 'whoami',
      'ping', 'ip', 'curl', 'wget', 'ssh', 'netstat', 'ss', 'history', 'help',
      'man', 'gcc', 'g++', 'make', 'python3', 'python', 'apt', 'apt-get'
    ];
    for (const b of bins) {
      addFile(`/bin/${b}`, `#!/bin/sh\n# ELF 64-bit binary placeholder: ${b}\n`, '-rwxr-xr-x');
      addFile(`/usr/bin/${b}`, `#!/bin/sh\n# ELF 64-bit binary placeholder: ${b}\n`, '-rwxr-xr-x');
    }

    // Default Home for unigrova
    addFile(
      '/home/unigrova/Documents/welcome.txt',
      '=======================================================\n  Welcome to UniGrova Linux Lab!  \n=======================================================\n\nYou are logged in as: unigrova (UID 1000)\nHostname: user\nYour home directory is: /home/unigrova\n\nYou have sudo privileges enabled.\nTo run administrative commands, use: sudo <command>\n\nTry running:\n  whoami\n  hostname\n  pwd\n  ls\n  mkdir test\n  cd test\n  touch hello.txt\n  echo "Hello UniGrova" > hello.txt\n  cat hello.txt\n  gcc --version\n  python3 --version\n  uname -a\n  tree /home/unigrova\n  history\n\nAll changes to files and directories persist across browser sessions.\n',
      '-rw-r--r--',
      'unigrova',
      'unigrova'
    );

    addFile(
      '/home/unigrova/.bashrc',
      '# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1="\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "\nalias ls="ls --color=auto"\nalias ll="ls -la"\nalias la="ls -A"\nalias l="ls -CF"\n',
      '-rw-r--r--',
      'unigrova',
      'unigrova'
    );

    addFile(
      '/home/unigrova/.profile',
      '# ~/.profile: executed by Bourne-compatible login shells.\nif [ -n "$BASH_VERSION" ]; then\n    if [ -f "$HOME/.bashrc" ]; then\n        . "$HOME/.bashrc"\n    fi\nfi\nPATH="$HOME/bin:$HOME/.local/bin:$PATH"\n',
      '-rw-r--r--',
      'unigrova',
      'unigrova'
    );

    addFile(
      '/home/unigrova/Projects/main.c',
      '#include <stdio.h>\n#include <unistd.h>\n\nint main(void) {\n    printf("========================================\\n");\n    printf("  Hello from real Linux C program!\\n");\n    printf("  User: unigrova @ Host: user\\n");\n    printf("========================================\\n");\n    printf("Process PID: %d\\n", getpid());\n    return 0;\n}\n',
      '-rw-r--r--',
      'unigrova',
      'unigrova'
    );

    addFile(
      '/home/unigrova/Projects/script.sh',
      '#!/bin/bash\n# System Health Script for unigrova\necho "Checking Linux System Status:"\nuname -a\nhostname\ndate\nfree -h\ndf -h\necho "Status: All subsystems operational."\n',
      '-rwxr-xr-x',
      'unigrova',
      'unigrova'
    );

    addFile(
      '/home/unigrova/Projects/app.py',
      '# Python 3 demo script\nimport sys\nimport os\nimport platform\n\nprint("========================================")\nprint(f"Python: {sys.version.split()[0]}")\nprint(f"Platform: {platform.system()} {platform.machine()}")\nprint(f"User: unigrova | Host: user")\nprint(f"Working Directory: {os.getcwd()}")\nprint("========================================")\n',
      '-rwxr-xr-x',
      'unigrova',
      'unigrova'
    );

    // Root folder items
    addFile(
      '/root/notes.txt',
      'Root user configuration files and backups.\n',
      '-rw-------',
      'root',
      'root'
    );
  }

  private saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data: Record<string, VFSEntry> = {};
      this.files.forEach((v, k) => {
        data[k] = v;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('VFS saveToStorage error:', e);
    }
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, VFSEntry> = JSON.parse(raw);
        this.files.clear();
        for (const [key, val] of Object.entries(parsed)) {
          this.files.set(key, val);
        }
      }
    } catch (e) {
      console.warn('VFS loadFromStorage error:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.subscribers.forEach((l) => l());
  }

  /**
   * Resolves paths against current working directory and user's home (~).
   */
  public resolvePath(target: string, cwd: string = '/home/unigrova', userHome: string = '/home/unigrova'): string {
    let raw = target.trim();
    if (!raw) return cwd;

    if (raw === '~') {
      raw = userHome;
    } else if (raw.startsWith('~/')) {
      raw = userHome + raw.slice(1);
    }

    let absolute = raw.startsWith('/') ? raw : `${cwd === '/' ? '' : cwd}/${raw}`;

    // Normalize . and ..
    const parts = absolute.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    return '/' + resolved.join('/');
  }

  public getEntry(path: string): VFSEntry | null {
    const normalized = this.resolvePath(path, '/');
    return this.files.get(normalized) || null;
  }

  public exists(path: string): boolean {
    return this.getEntry(path) !== null;
  }

  public isDirectory(path: string): boolean {
    const entry = this.getEntry(path);
    return !!entry && entry.isDirectory;
  }

  public readDir(dirPath: string): VFSEntry[] {
    const normalized = this.resolvePath(dirPath, '/');
    const result: VFSEntry[] = [];

    const prefix = normalized === '/' ? '/' : `${normalized}/`;

    this.files.forEach((entry, path) => {
      if (path === normalized) return;
      if (path.startsWith(prefix)) {
        const sub = path.slice(prefix.length);
        if (!sub.includes('/')) {
          result.push(entry);
        }
      }
    });

    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  public readFile(filePath: string): string | null {
    const entry = this.getEntry(filePath);
    if (!entry) return null;
    if (entry.isDirectory) return null;
    return entry.content ?? '';
  }

  public writeFile(
    filePath: string,
    content: string,
    permissions = '-rw-r--r--',
    owner = 'unigrova',
    group = 'unigrova'
  ): boolean {
    const normalized = this.resolvePath(filePath, '/');
    if (normalized === '/') return false;

    const parentPath = this.getParentPath(normalized);
    const parent = this.getEntry(parentPath);
    if (!parent || !parent.isDirectory) {
      return false;
    }

    const parts = normalized.split('/').filter(Boolean);
    const name = parts[parts.length - 1];
    const now = new Date().toISOString();

    const existing = this.files.get(normalized);

    this.files.set(normalized, {
      name,
      path: normalized,
      isDirectory: false,
      content,
      size: new TextEncoder().encode(content).length,
      permissions: existing ? existing.permissions : permissions,
      owner: existing ? existing.owner : owner,
      group: existing ? existing.group : group,
      modified: now,
    });

    this.notify();

    // Sync to real Linux disk
    fetch('/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: normalized, content }),
    }).catch(() => {});

    return true;
  }

  public makeDir(
    dirPath: string,
    recursive = false,
    permissions = 'drwxr-xr-x',
    owner = 'unigrova',
    group = 'unigrova'
  ): boolean {
    const normalized = this.resolvePath(dirPath, '/');
    if (normalized === '/') return true;

    if (this.exists(normalized)) {
      return true;
    }

    const parentPath = this.getParentPath(normalized);
    if (!this.exists(parentPath)) {
      if (!recursive) return false;
      this.makeDir(parentPath, true, permissions, owner, group);
    }

    const parts = normalized.split('/').filter(Boolean);
    const name = parts[parts.length - 1];
    const now = new Date().toISOString();

    this.files.set(normalized, {
      name,
      path: normalized,
      isDirectory: true,
      size: 4096,
      permissions,
      owner,
      group,
      modified: now,
    });

    this.notify();

    // Sync directory to real Linux disk
    fetch('/api/fs/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: normalized }),
    }).catch(() => {});

    return true;
  }

  public remove(targetPath: string, recursive = false): boolean {
    const normalized = this.resolvePath(targetPath, '/');
    if (normalized === '/') return false;

    const entry = this.getEntry(normalized);
    if (!entry) return false;

    if (entry.isDirectory) {
      const children = this.readDir(normalized);
      if (children.length > 0 && !recursive) {
        return false;
      }

      const prefix = `${normalized}/`;
      const keysToDelete: string[] = [normalized];
      this.files.forEach((_, p) => {
        if (p.startsWith(prefix)) {
          keysToDelete.push(p);
        }
      });

      keysToDelete.forEach((k) => this.files.delete(k));
    } else {
      this.files.delete(normalized);
    }

    this.notify();

    // Sync removal to real Linux disk
    fetch('/api/fs/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: normalized }),
    }).catch(() => {});

    return true;
  }

  public copy(srcPath: string, destPath: string, recursive = false): boolean {
    const src = this.resolvePath(srcPath, '/');
    let dest = this.resolvePath(destPath, '/');

    const srcEntry = this.getEntry(src);
    if (!srcEntry) return false;

    if (this.isDirectory(dest)) {
      dest = `${dest === '/' ? '' : dest}/${srcEntry.name}`;
    }

    if (srcEntry.isDirectory) {
      if (!recursive) return false;
      this.makeDir(dest, true, srcEntry.permissions, srcEntry.owner, srcEntry.group);
      const children = this.readDir(src);
      for (const child of children) {
        this.copy(child.path, `${dest}/${child.name}`, true);
      }
    } else {
      this.writeFile(dest, srcEntry.content || '', srcEntry.permissions, srcEntry.owner, srcEntry.group);
    }

    this.notify();
    return true;
  }

  public move(srcPath: string, destPath: string): boolean {
    const src = this.resolvePath(srcPath, '/');
    let dest = this.resolvePath(destPath, '/');

    if (src === dest) return true;
    const srcEntry = this.getEntry(src);
    if (!srcEntry) return false;

    if (this.isDirectory(dest)) {
      dest = `${dest === '/' ? '' : dest}/${srcEntry.name}`;
    }

    const copied = this.copy(src, dest, true);
    if (copied) {
      this.remove(src, true);
      return true;
    }
    return false;
  }

  public chmod(targetPath: string, mode: string): boolean {
    const normalized = this.resolvePath(targetPath, '/');
    const entry = this.getEntry(normalized);
    if (!entry) return false;

    let newPerms = entry.permissions;
    if (mode === '+x') {
      newPerms = entry.isDirectory ? 'drwxr-xr-x' : '-rwxr-xr-x';
    } else if (mode === '-x') {
      newPerms = entry.isDirectory ? 'drw-r--r--' : '-rw-r--r--';
    } else if (mode === '755') {
      newPerms = entry.isDirectory ? 'drwxr-xr-x' : '-rwxr-xr-x';
    } else if (mode === '644') {
      newPerms = entry.isDirectory ? 'drwxr-xr-x' : '-rw-r--r--';
    } else if (mode === '777') {
      newPerms = entry.isDirectory ? 'drwxrwxrwx' : '-rwxrwxrwx';
    } else if (mode === '600') {
      newPerms = entry.isDirectory ? 'drwx------' : '-rw-------';
    }

    entry.permissions = newPerms;
    this.notify();
    return true;
  }

  public chown(targetPath: string, user: string, group?: string): boolean {
    const normalized = this.resolvePath(targetPath, '/');
    const entry = this.getEntry(normalized);
    if (!entry) return false;
    entry.owner = user;
    if (group) entry.group = group;
    this.notify();
    return true;
  }

  public getParentPath(path: string): string {
    const normalized = this.resolvePath(path, '/');
    if (normalized === '/') return '/';
    const parts = normalized.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : `/${parts.join('/')}`;
  }

  public resetFilesystem() {
    this.files.clear();
    localStorage.removeItem(STORAGE_KEY);
    this.populateDefaultFilesystem();
    this.notify();
  }
}

export const vfsService = new VFSService();
