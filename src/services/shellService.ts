/**
 * Shell Execution Service
 * Implements a full Linux command interpreter connected directly to the Virtual Filesystem (VFS).
 * Runs as user 'sheikh' with home '/home/sheikh' by default, supporting sudo, pipelines (|),
 * redirection (>, >>), command chaining (&&, ||, ;), and full Linux command suite.
 */

import { vfsService, VFSEntry } from './vfsService';

export interface CommandResult {
  output: string;
  exitCode: number;
  clearScreen?: boolean;
  needsPasswordPrompt?: {
    prompt: string;
    onPassword: (password: string) => CommandResult;
  };
}

export class ShellSession {
  private cwd: string = '/home/sheikh';
  private user: string = 'sheikh';
  private hostname: string = 'linux';
  private userHome: string = '/home/sheikh';
  private history: string[] = [];
  private sudoAuthenticated: boolean = false;
  private umaskValue: string = '0022';
  private env: Record<string, string> = {
    USER: 'sheikh',
    HOME: '/home/sheikh',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    LANG: 'en_US.UTF-8',
    LOGNAME: 'sheikh',
  };

  constructor(initialUser = 'sheikh', initialCwd = '/home/sheikh') {
    this.user = initialUser;
    this.userHome = initialUser === 'root' ? '/root' : `/home/${initialUser}`;
    this.cwd = initialCwd;
    this.env.USER = this.user;
    this.env.LOGNAME = this.user;
    this.env.HOME = this.userHome;
    this.env.PWD = this.cwd;
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(path: string): void {
    this.cwd = vfsService.resolvePath(path, this.cwd, this.userHome);
    this.env.PWD = this.cwd;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(username: string): void {
    this.user = username;
    this.userHome = username === 'root' ? '/root' : `/home/${username}`;
    this.env.USER = username;
    this.env.LOGNAME = username;
    this.env.HOME = this.userHome;
  }

  public getHostname(): string {
    return this.hostname;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public getPrompt(): string {
    let displayPath: string;
    if (this.cwd === this.userHome) {
      displayPath = '~';
    } else if (this.cwd.startsWith(this.userHome + '/')) {
      displayPath = '~' + this.cwd.slice(this.userHome.length);
    } else {
      displayPath = this.cwd;
    }

    const promptChar = this.user === 'root' ? '#' : '$';
    const userColor = this.user === 'root' ? '\x1b[1;31m' : '\x1b[1;32m';

    return `${userColor}${this.user}@${this.hostname}\x1b[0m:\x1b[1;34m${displayPath}\x1b[0m${promptChar} `;
  }

  /**
   * Main entry point to execute a shell command line.
   */
  public execute(rawCommand: string): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0 };
    }

    this.history.push(trimmed);

    // Support command chaining: &&, ||, ;
    const chainTokens = this.splitChaining(trimmed);
    let cumulativeOutput = '';
    let lastExit = 0;

    for (const token of chainTokens) {
      if (token.type === '&&' && lastExit !== 0) continue;
      if (token.type === '||' && lastExit === 0) continue;

      const res = this.executePipeline(token.cmd);
      if (res.clearScreen) {
        return res;
      }
      if (res.needsPasswordPrompt) {
        return res;
      }

      cumulativeOutput += res.output;
      lastExit = res.exitCode;
    }

    return { output: cumulativeOutput, exitCode: lastExit };
  }

  private splitChaining(cmd: string): { cmd: string; type: ';' | '&&' | '||' }[] {
    const list: { cmd: string; type: ';' | '&&' | '||' }[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let nextType: ';' | '&&' | '||' = ';';

    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      const next = cmd[i + 1];

      if (c === "'" && !inDouble) {
        inSingle = !inSingle;
        current += c;
      } else if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        current += c;
      } else if (!inSingle && !inDouble && c === '&' && next === '&') {
        list.push({ cmd: current.trim(), type: nextType });
        current = '';
        nextType = '&&';
        i++;
      } else if (!inSingle && !inDouble && c === '|' && next === '|') {
        list.push({ cmd: current.trim(), type: nextType });
        current = '';
        nextType = '||';
        i++;
      } else if (!inSingle && !inDouble && c === ';') {
        list.push({ cmd: current.trim(), type: nextType });
        current = '';
        nextType = ';';
      } else {
        current += c;
      }
    }
    if (current.trim()) {
      list.push({ cmd: current.trim(), type: nextType });
    }
    return list;
  }

  private executePipeline(pipelineCmd: string): CommandResult {
    const segments = this.splitPipes(pipelineCmd);
    let pipelineInput = '';
    let lastResult: CommandResult = { output: '', exitCode: 0 };

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      const isLast = i === segments.length - 1;

      // Check for output redirection
      const redirMatch = segment.match(/^(.*?)\s*(>>|>)\s*(.+)$/);
      let execSegment = segment;
      let redirectFile = '';
      let isAppend = false;

      if (redirMatch) {
        execSegment = redirMatch[1].trim();
        isAppend = redirMatch[2] === '>>';
        redirectFile = redirMatch[3].trim();
      }

      lastResult = this.executeSingle(execSegment, pipelineInput);
      if (lastResult.clearScreen || lastResult.needsPasswordPrompt) {
        return lastResult;
      }

      if (lastResult.exitCode !== 0 && !isLast) {
        return lastResult;
      }

      if (redirectFile) {
        const destPath = vfsService.resolvePath(redirectFile, this.cwd, this.userHome);
        let contentToWrite = lastResult.output;
        if (contentToWrite.endsWith('\r\n')) contentToWrite = contentToWrite.slice(0, -2);
        if (contentToWrite.endsWith('\n')) contentToWrite = contentToWrite.slice(0, -1);
        contentToWrite += '\n';

        if (isAppend) {
          const existing = vfsService.readFile(destPath) || '';
          vfsService.writeFile(destPath, existing + contentToWrite, '-rw-r--r--', this.user, this.user);
        } else {
          vfsService.writeFile(destPath, contentToWrite, '-rw-r--r--', this.user, this.user);
        }
        return { output: '', exitCode: 0 };
      }

      pipelineInput = lastResult.output;
    }

    return lastResult;
  }

  private splitPipes(cmd: string): string[] {
    const segments: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < cmd.length; i++) {
      const char = cmd[i];
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += char;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
      } else if (char === '|' && !inSingleQuote && !inDoubleQuote) {
        segments.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) segments.push(current);
    return segments;
  }

  private parseArgs(commandStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < commandStr.length; i++) {
      const char = commandStr[i];
      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (char === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (char === ' ' && !inSingle && !inDouble) {
        if (current.length > 0) {
          args.push(this.expandEnv(current));
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.length > 0) {
      args.push(this.expandEnv(current));
    }
    return args;
  }

  private expandEnv(str: string): string {
    return str.replace(/\$([A-Za-z0-9_]+)/g, (_, varName) => {
      if (varName === 'USER') return this.user;
      if (varName === 'HOME') return this.userHome;
      if (varName === 'PWD') return this.cwd;
      return this.env[varName] || '';
    });
  }

  private executeSingle(cmdStr: string, stdin: string): CommandResult {
    const args = this.parseArgs(cmdStr);
    if (args.length === 0) {
      return { output: '', exitCode: 0 };
    }

    const command = args[0];
    const params = args.slice(1);

    // Sudo handling
    if (command === 'sudo') {
      return this.handleSudo(params);
    }

    // Su handling
    if (command === 'su') {
      return this.handleSu(params);
    }

    // Exit
    if (command === 'exit') {
      if (this.user === 'root') {
        this.setUser('sheikh');
        this.setCwd('/home/sheikh');
        return { output: 'exit\n', exitCode: 0 };
      }
      return { output: 'logout\n', exitCode: 0 };
    }

    switch (command) {
      case 'pwd':
        return { output: `${this.cwd}\n`, exitCode: 0 };

      case 'whoami':
        return { output: `${this.user}\n`, exitCode: 0 };

      case 'id':
        return this.cmdId(params);

      case 'groups':
        return this.cmdGroups();

      case 'hostname':
        return { output: `${this.hostname}\n`, exitCode: 0 };

      case 'uname':
        return this.cmdUname(params);

      case 'date':
        return { output: `${new Date().toUTCString()}\n`, exitCode: 0 };

      case 'cal':
        return this.cmdCal();

      case 'uptime':
        return { output: ` 11:15:02 up 1:02,  1 user,  load average: 0.12, 0.08, 0.02\n`, exitCode: 0 };

      case 'clear':
        return { output: '', exitCode: 0, clearScreen: true };

      case 'echo':
        return this.cmdEcho(params);

      case 'printf':
        return this.cmdPrintf(params);

      case 'ls':
        return this.cmdLs(params);

      case 'cd':
        return this.cmdCd(params);

      case 'mkdir':
        return this.cmdMkdir(params);

      case 'rmdir':
        return this.cmdRmdir(params);

      case 'touch':
        return this.cmdTouch(params);

      case 'cat':
        return this.cmdCat(params, stdin);

      case 'less':
      case 'more':
        return this.cmdCat(params, stdin);

      case 'head':
        return this.cmdHead(params, stdin);

      case 'tail':
        return this.cmdTail(params, stdin);

      case 'find':
        return this.cmdFind(params);

      case 'tree':
        return this.cmdTree(params);

      case 'file':
        return this.cmdFile(params);

      case 'stat':
        return this.cmdStat(params);

      case 'rm':
        return this.cmdRm(params);

      case 'cp':
        return this.cmdCp(params);

      case 'mv':
        return this.cmdMv(params);

      case 'chmod':
        return this.cmdChmod(params);

      case 'chown':
        return this.cmdChown(params);

      case 'chgrp':
        return this.cmdChgrp(params);

      case 'umask':
        return this.cmdUmask(params);

      case 'grep':
        return this.cmdGrep(params, stdin);

      case 'sed':
        return this.cmdSed(params, stdin);

      case 'awk':
        return this.cmdAwk(params, stdin);

      case 'sort':
        return this.cmdSort(params, stdin);

      case 'uniq':
        return this.cmdUniq(params, stdin);

      case 'wc':
        return this.cmdWc(params, stdin);

      case 'cut':
        return this.cmdCut(params, stdin);

      case 'tr':
        return this.cmdTr(params, stdin);

      case 'diff':
        return this.cmdDiff(params);

      case 'ps':
        return this.cmdPs(params);

      case 'top':
        return this.cmdTop();

      case 'free':
        return this.cmdFree(params);

      case 'df':
        return this.cmdDf(params);

      case 'du':
        return this.cmdDu(params);

      case 'kill':
      case 'pkill':
        return this.cmdKill(params);

      case 'nice':
      case 'renice':
        return { output: '', exitCode: 0 };

      case 'ip':
        return this.cmdIp(params);

      case 'ping':
        return this.cmdPing(params);

      case 'curl':
      case 'wget':
        return this.cmdNetFetch(command, params);

      case 'ssh':
        return this.cmdSsh(params);

      case 'netstat':
      case 'ss':
        return this.cmdNetstat();

      case 'apt':
      case 'apt-get':
        return this.cmdApt(params);

      case 'gcc':
      case 'g++':
        return this.cmdGcc(command, params);

      case 'make':
        return this.cmdMake(params);

      case 'python3':
      case 'python':
        return this.cmdPython(params);

      case 'bash':
      case 'sh':
        return this.cmdBash(params);

      case 'which':
        return this.cmdWhich(params);

      case 'history':
        return this.cmdHistory();

      case 'help':
        return this.cmdHelp();

      case 'man':
        return this.cmdMan(params);

      case 'nano':
      case 'vi':
        return this.cmdEditor(command, params);

      default:
        // Execute script or local binary
        if (command.startsWith('./') || command.startsWith('/')) {
          const scriptPath = vfsService.resolvePath(command, this.cwd, this.userHome);
          const entry = vfsService.getEntry(scriptPath);
          if (entry) {
            if (!entry.permissions.includes('x') && this.user !== 'root') {
              return { output: `bash: ${command}: Permission denied\n`, exitCode: 126 };
            }
            if (entry.content) {
              const lines = entry.content.split('\n');
              let scriptOut = '';
              for (const line of lines) {
                const tr = line.trim();
                if (!tr || tr.startsWith('#')) continue;
                const r = this.execute(tr);
                scriptOut += r.output;
              }
              return { output: scriptOut, exitCode: 0 };
            }
          }
        }
        return {
          output: `bash: ${command}: command not found\n`,
          exitCode: 127,
        };
    }
  }

  // --- Sudo & User Switching ---

  private handleSudo(params: string[]): CommandResult {
    if (params.length === 0) {
      return { output: 'usage: sudo -h | -K | -k | -V\nusage: sudo -v [-AknS] [-g group] [-h host] [-p prompt] [-u user]\n', exitCode: 1 };
    }

    if (params[0] === '-s' || params[0] === '-i' || params[0] === 'su' || params[0] === 'bash') {
      const runElevation = () => {
        this.setUser('root');
        this.setCwd('/root');
        return { output: '', exitCode: 0 };
      };

      if (this.sudoAuthenticated || this.user === 'root') {
        return runElevation();
      }

      return {
        output: '',
        exitCode: 0,
        needsPasswordPrompt: {
          prompt: `[sudo] password for ${this.user}: `,
          onPassword: (pwd: string) => {
            this.sudoAuthenticated = true;
            return runElevation();
          },
        },
      };
    }

    const targetCmd = params.join(' ');
    const runAsRoot = () => {
      const prevUser = this.user;
      const prevHome = this.userHome;
      this.user = 'root';
      this.userHome = '/root';
      const res = this.executeSingle(targetCmd, '');
      this.user = prevUser;
      this.userHome = prevHome;
      return res;
    };

    if (this.sudoAuthenticated || this.user === 'root') {
      return runAsRoot();
    }

    return {
      output: '',
      exitCode: 0,
      needsPasswordPrompt: {
        prompt: `[sudo] password for ${this.user}: `,
        onPassword: (pwd: string) => {
          this.sudoAuthenticated = true;
          return runAsRoot();
        },
      },
    };
  }

  private handleSu(params: string[]): CommandResult {
    const targetUser = params[0] && !params[0].startsWith('-') ? params[0] : 'root';
    return {
      output: '',
      exitCode: 0,
      needsPasswordPrompt: {
        prompt: `Password: `,
        onPassword: () => {
          this.setUser(targetUser);
          this.setCwd(targetUser === 'root' ? '/root' : `/home/${targetUser}`);
          return { output: '', exitCode: 0 };
        },
      },
    };
  }

  private cmdId(params: string[]): CommandResult {
    if (this.user === 'root') {
      return { output: 'uid=0(root) gid=0(root) groups=0(root)\n', exitCode: 0 };
    }
    return {
      output: 'uid=1000(sheikh) gid=1000(sheikh) groups=1000(sheikh),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)\n',
      exitCode: 0,
    };
  }

  private cmdGroups(): CommandResult {
    if (this.user === 'root') {
      return { output: 'root\n', exitCode: 0 };
    }
    return { output: 'sheikh adm cdrom sudo dip plugdev\n', exitCode: 0 };
  }

  private cmdUname(params: string[]): CommandResult {
    if (params.includes('-a')) {
      return {
        output: `Linux ${this.hostname} 5.15.0-107-generic #117-Ubuntu SMP Wed May 8 21:51:33 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux\n`,
        exitCode: 0,
      };
    }
    if (params.includes('-r')) return { output: '5.15.0-107-generic\n', exitCode: 0 };
    if (params.includes('-m')) return { output: 'x86_64\n', exitCode: 0 };
    if (params.includes('-s')) return { output: 'Linux\n', exitCode: 0 };
    return { output: 'Linux\n', exitCode: 0 };
  }

  private cmdCal(): CommandResult {
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const header = `    ${month} ${year}   \nSu Mo Tu We Th Fr Sa\n`;

    const firstDay = new Date(year, now.getMonth(), 1).getDay();
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();

    let grid = '';
    for (let i = 0; i < firstDay; i++) {
      grid += '   ';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, ' ');
      if (day === now.getDate()) {
        grid += `\x1b[7m${dayStr}\x1b[0m `;
      } else {
        grid += `${dayStr} `;
      }
      if ((firstDay + day) % 7 === 0) {
        grid += '\n';
      }
    }
    grid += '\n';
    return { output: header + grid, exitCode: 0 };
  }

  private cmdEcho(params: string[]): CommandResult {
    let noNewline = false;
    let interpretEscapes = false;
    const words: string[] = [];

    for (const p of params) {
      if (p === '-n') noNewline = true;
      else if (p === '-e') interpretEscapes = true;
      else words.push(p);
    }

    let text = words.join(' ');
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }

    if (interpretEscapes) {
      text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }

    return { output: noNewline ? text : `${text}\n`, exitCode: 0 };
  }

  private cmdPrintf(params: string[]): CommandResult {
    if (params.length === 0) return { output: '', exitCode: 0 };
    let format = params[0];
    if ((format.startsWith('"') && format.endsWith('"')) || (format.startsWith("'") && format.endsWith("'"))) {
      format = format.slice(1, -1);
    }
    format = format.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    return { output: format, exitCode: 0 };
  }

  private cmdLs(params: string[]): CommandResult {
    let showAll = false;
    let longFormat = false;
    let targetDir = this.cwd;

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('a') || p.includes('A')) showAll = true;
        if (p.includes('l')) longFormat = true;
      } else {
        targetDir = vfsService.resolvePath(p, this.cwd, this.userHome);
      }
    }

    const entry = vfsService.getEntry(targetDir);
    if (!entry) {
      return { output: `ls: cannot access '${targetDir}': No such file or directory\n`, exitCode: 2 };
    }

    if (!entry.isDirectory) {
      return { output: `${entry.name}\n`, exitCode: 0 };
    }

    let items = vfsService.readDir(targetDir);

    if (showAll) {
      const dot: VFSEntry = {
        name: '.',
        path: targetDir,
        isDirectory: true,
        size: 4096,
        permissions: entry.permissions,
        owner: entry.owner,
        group: entry.group,
        modified: entry.modified,
      };
      const dotdot: VFSEntry = {
        name: '..',
        path: vfsService.getParentPath(targetDir),
        isDirectory: true,
        size: 4096,
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        modified: entry.modified,
      };
      items = [dot, dotdot, ...items];
    } else {
      items = items.filter((i) => !i.name.startsWith('.'));
    }

    if (longFormat) {
      let output = `total ${items.length * 4}\n`;
      for (const item of items) {
        const coloredName = item.isDirectory
          ? `\x1b[1;34m${item.name}\x1b[0m`
          : item.permissions.includes('x')
          ? `\x1b[1;32m${item.name}\x1b[0m`
          : item.name;

        const dateStr = new Date(item.modified).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        output += `${item.permissions}  1 ${item.owner.padEnd(6)} ${item.group.padEnd(6)} ${String(
          item.size
        ).padStart(6)} ${dateStr} ${coloredName}\n`;
      }
      return { output, exitCode: 0 };
    } else {
      if (items.length === 0) return { output: '', exitCode: 0 };
      const formatted = items.map((i) => {
        return i.isDirectory
          ? `\x1b[1;34m${i.name}\x1b[0m`
          : i.permissions.includes('x')
          ? `\x1b[1;32m${i.name}\x1b[0m`
          : i.name;
      });
      return { output: `${formatted.join('  ')}\n`, exitCode: 0 };
    }
  }

  private cmdCd(params: string[]): CommandResult {
    const target = params[0] || '~';
    const resolved = vfsService.resolvePath(target, this.cwd, this.userHome);

    const entry = vfsService.getEntry(resolved);
    if (!entry) {
      return { output: `bash: cd: ${target}: No such file or directory\n`, exitCode: 1 };
    }
    if (!entry.isDirectory) {
      return { output: `bash: cd: ${target}: Not a directory\n`, exitCode: 1 };
    }

    // Permission check
    if (this.user !== 'root' && entry.owner === 'root' && entry.permissions.startsWith('drwx------')) {
      return { output: `bash: cd: ${target}: Permission denied\n`, exitCode: 1 };
    }

    this.cwd = resolved;
    this.env.PWD = resolved;
    return { output: '', exitCode: 0 };
  }

  private cmdMkdir(params: string[]): CommandResult {
    let recursive = false;
    const paths: string[] = [];

    for (const p of params) {
      if (p === '-p') recursive = true;
      else if (!p.startsWith('-')) paths.push(p);
    }

    if (paths.length === 0) {
      return { output: 'mkdir: missing operand\nTry \'mkdir --help\' for more information.\n', exitCode: 1 };
    }

    for (const p of paths) {
      const resolved = vfsService.resolvePath(p, this.cwd, this.userHome);
      if (vfsService.exists(resolved) && !recursive) {
        return { output: `mkdir: cannot create directory '${p}': File exists\n`, exitCode: 1 };
      }
      const ok = vfsService.makeDir(resolved, recursive, 'drwxr-xr-x', this.user, this.user);
      if (!ok) {
        return { output: `mkdir: cannot create directory '${p}': No such file or directory\n`, exitCode: 1 };
      }
    }

    return { output: '', exitCode: 0 };
  }

  private cmdRmdir(params: string[]): CommandResult {
    if (params.length === 0) return { output: 'rmdir: missing operand\n', exitCode: 1 };
    for (const p of params) {
      const resolved = vfsService.resolvePath(p, this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);
      if (!entry) return { output: `rmdir: failed to remove '${p}': No such file or directory\n`, exitCode: 1 };
      if (!entry.isDirectory) return { output: `rmdir: failed to remove '${p}': Not a directory\n`, exitCode: 1 };
      const children = vfsService.readDir(resolved);
      if (children.length > 0) return { output: `rmdir: failed to remove '${p}': Directory not empty\n`, exitCode: 1 };
      vfsService.remove(resolved, false);
    }
    return { output: '', exitCode: 0 };
  }

  private cmdTouch(params: string[]): CommandResult {
    const files = params.filter((p) => !p.startsWith('-'));
    if (files.length === 0) {
      return { output: 'touch: missing file operand\nTry \'touch --help\' for more information.\n', exitCode: 1 };
    }

    for (const f of files) {
      const resolved = vfsService.resolvePath(f, this.cwd, this.userHome);
      if (vfsService.exists(resolved)) {
        const entry = vfsService.getEntry(resolved);
        if (entry) entry.modified = new Date().toISOString();
      } else {
        const ok = vfsService.writeFile(resolved, '', '-rw-r--r--', this.user, this.user);
        if (!ok) {
          return { output: `touch: cannot touch '${f}': No such file or directory\n`, exitCode: 1 };
        }
      }
    }
    return { output: '', exitCode: 0 };
  }

  private cmdCat(params: string[], stdin: string): CommandResult {
    const files = params.filter((p) => !p.startsWith('-'));

    if (files.length === 0) {
      if (stdin) return { output: stdin, exitCode: 0 };
      return { output: '', exitCode: 0 };
    }

    let output = '';
    for (const file of files) {
      const resolved = vfsService.resolvePath(file, this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);
      if (!entry) {
        return { output: `cat: ${file}: No such file or directory\n`, exitCode: 1 };
      }
      if (entry.isDirectory) {
        return { output: `cat: ${file}: Is a directory\n`, exitCode: 1 };
      }
      output += entry.content || '';
    }
    if (output && !output.endsWith('\n')) output += '\n';
    return { output, exitCode: 0 };
  }

  private cmdHead(params: string[], stdin: string): CommandResult {
    let lines = 10;
    let file = '';

    for (let i = 0; i < params.length; i++) {
      if (params[i] === '-n' && params[i + 1]) {
        lines = parseInt(params[i + 1], 10) || 10;
        i++;
      } else if (!params[i].startsWith('-')) {
        file = params[i];
      }
    }

    let text = stdin;
    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (!entry) return { output: `head: cannot open '${file}' for reading: No such file or directory\n`, exitCode: 1 };
      text = entry.content || '';
    }

    const splitLines = text.split('\n');
    const result = splitLines.slice(0, lines).join('\n');
    return { output: result ? `${result}\n` : '', exitCode: 0 };
  }

  private cmdTail(params: string[], stdin: string): CommandResult {
    let lines = 10;
    let file = '';

    for (let i = 0; i < params.length; i++) {
      if (params[i] === '-n' && params[i + 1]) {
        lines = parseInt(params[i + 1], 10) || 10;
        i++;
      } else if (!params[i].startsWith('-')) {
        file = params[i];
      }
    }

    let text = stdin;
    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (!entry) return { output: `tail: cannot open '${file}' for reading: No such file or directory\n`, exitCode: 1 };
      text = entry.content || '';
    }

    const splitLines = text.split('\n');
    const result = splitLines.slice(-lines).join('\n');
    return { output: result ? `${result}\n` : '', exitCode: 0 };
  }

  private cmdFind(params: string[]): CommandResult {
    let startPath = this.cwd;
    let namePattern = '';

    for (let i = 0; i < params.length; i++) {
      if (params[i] === '-name' && params[i + 1]) {
        namePattern = params[i + 1].replace(/"/g, '').replace(/'/g, '');
        i++;
      } else if (!params[i].startsWith('-')) {
        startPath = vfsService.resolvePath(params[i], this.cwd, this.userHome);
      }
    }

    const matched: string[] = [];
    const traverse = (p: string) => {
      const entry = vfsService.getEntry(p);
      if (!entry) return;
      if (!namePattern || entry.name.includes(namePattern.replace(/\*/g, ''))) {
        matched.push(p);
      }
      if (entry.isDirectory) {
        const children = vfsService.readDir(p);
        for (const c of children) {
          traverse(c.path);
        }
      }
    };

    traverse(startPath);
    return { output: matched.join('\n') + (matched.length > 0 ? '\n' : ''), exitCode: 0 };
  }

  private cmdTree(params: string[]): CommandResult {
    const target = params[0] || this.cwd;
    const resolved = vfsService.resolvePath(target, this.cwd, this.userHome);
    const rootEntry = vfsService.getEntry(resolved);
    if (!rootEntry) return { output: `${target} [error opening dir]\n\n0 directories, 0 files\n`, exitCode: 1 };

    let output = `${resolved}\n`;
    let dirCount = 0;
    let fileCount = 0;

    const printTree = (dirPath: string, prefix = '') => {
      const items = vfsService.readDir(dirPath).filter((i) => !i.name.startsWith('.'));
      items.forEach((item, idx) => {
        const isLast = idx === items.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');

        const coloredName = item.isDirectory
          ? `\x1b[1;34m${item.name}\x1b[0m`
          : item.permissions.includes('x')
          ? `\x1b[1;32m${item.name}\x1b[0m`
          : item.name;

        output += `${prefix}${branch}${coloredName}\n`;
        if (item.isDirectory) {
          dirCount++;
          printTree(item.path, nextPrefix);
        } else {
          fileCount++;
        }
      });
    };

    printTree(resolved);
    output += `\n${dirCount} directories, ${fileCount} files\n`;
    return { output, exitCode: 0 };
  }

  private cmdFile(params: string[]): CommandResult {
    if (params.length === 0) return { output: 'Usage: file [-bcikLnvz] [file ...]\n', exitCode: 1 };
    let out = '';
    for (const f of params) {
      const resolved = vfsService.resolvePath(f, this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);
      if (!entry) {
        out += `${f}: cannot open (No such file or directory)\n`;
      } else if (entry.isDirectory) {
        out += `${f}: directory\n`;
      } else if (entry.name.endsWith('.c')) {
        out += `${f}: C source, ASCII text\n`;
      } else if (entry.name.endsWith('.sh') || entry.content?.startsWith('#!')) {
        out += `${f}: POSIX shell script, ASCII text executable\n`;
      } else if (entry.name.endsWith('.py')) {
        out += `${f}: Python script, ASCII text executable\n`;
      } else if (entry.permissions.includes('x')) {
        out += `${f}: ELF 64-bit LSB executable, x86-64, version 1 (SYSV)\n`;
      } else {
        out += `${f}: ASCII text\n`;
      }
    }
    return { output: out, exitCode: 0 };
  }

  private cmdStat(params: string[]): CommandResult {
    if (params.length === 0) return { output: 'stat: missing operand\n', exitCode: 1 };
    const resolved = vfsService.resolvePath(params[0], this.cwd, this.userHome);
    const entry = vfsService.getEntry(resolved);
    if (!entry) return { output: `stat: cannot stat '${params[0]}': No such file or directory\n`, exitCode: 1 };

    const out =
      `  File: ${entry.name}\n` +
      `  Size: ${entry.size}      Blocks: 8          IO Block: 4096   ${entry.isDirectory ? 'directory' : 'regular file'}\n` +
      `Device: 801h/2049d      Inode: 489102      Links: 1\n` +
      `Access: (${entry.permissions}/-${entry.permissions.slice(1)})  Uid: (${this.user === 'root' ? 0 : 1000}/${entry.owner})   Gid: (${this.user === 'root' ? 0 : 1000}/${entry.group})\n` +
      `Modify: ${entry.modified}\n` +
      ` Change: ${entry.modified}\n`;
    return { output: out, exitCode: 0 };
  }

  private cmdRm(params: string[]): CommandResult {
    let recursive = false;
    let force = false;
    const targets: string[] = [];

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('r') || p.includes('R')) recursive = true;
        if (p.includes('f')) force = true;
      } else {
        targets.push(p);
      }
    }

    if (targets.length === 0 && !force) {
      return { output: 'rm: missing operand\n', exitCode: 1 };
    }

    for (const target of targets) {
      const resolved = vfsService.resolvePath(target, this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);

      if (!entry) {
        if (!force) return { output: `rm: cannot remove '${target}': No such file or directory\n`, exitCode: 1 };
        continue;
      }

      if (entry.isDirectory && !recursive) {
        return { output: `rm: cannot remove '${target}': Is a directory\n`, exitCode: 1 };
      }

      vfsService.remove(resolved, recursive);
    }

    return { output: '', exitCode: 0 };
  }

  private cmdCp(params: string[]): CommandResult {
    let recursive = false;
    const paths: string[] = [];

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('r') || p.includes('R')) recursive = true;
      } else {
        paths.push(p);
      }
    }

    if (paths.length < 2) {
      return { output: `cp: missing destination file operand after '${paths[0] || ''}'\n`, exitCode: 1 };
    }

    const src = paths[0];
    const dest = paths[1];
    const ok = vfsService.copy(
      vfsService.resolvePath(src, this.cwd, this.userHome),
      vfsService.resolvePath(dest, this.cwd, this.userHome),
      recursive
    );

    if (!ok) {
      return { output: `cp: cannot copy '${src}' to '${dest}'\n`, exitCode: 1 };
    }
    return { output: '', exitCode: 0 };
  }

  private cmdMv(params: string[]): CommandResult {
    const paths = params.filter((p) => !p.startsWith('-'));
    if (paths.length < 2) {
      return { output: 'mv: missing destination file operand\n', exitCode: 1 };
    }
    const src = paths[0];
    const dest = paths[1];
    const ok = vfsService.move(
      vfsService.resolvePath(src, this.cwd, this.userHome),
      vfsService.resolvePath(dest, this.cwd, this.userHome)
    );

    if (!ok) {
      return { output: `mv: cannot move '${src}' to '${dest}'\n`, exitCode: 1 };
    }
    return { output: '', exitCode: 0 };
  }

  private cmdChmod(params: string[]): CommandResult {
    const args = params.filter((p) => !p.startsWith('-R'));
    if (args.length < 2) return { output: 'chmod: missing operand\n', exitCode: 1 };
    const mode = args[0];
    const target = args[1];
    const ok = vfsService.chmod(vfsService.resolvePath(target, this.cwd, this.userHome), mode);
    if (!ok) return { output: `chmod: cannot access '${target}': No such file or directory\n`, exitCode: 1 };
    return { output: '', exitCode: 0 };
  }

  private cmdChown(params: string[]): CommandResult {
    if (params.length < 2) return { output: 'chown: missing operand\n', exitCode: 1 };
    const [userGroup, target] = params;
    const [u, g] = userGroup.split(':');
    const ok = vfsService.chown(vfsService.resolvePath(target, this.cwd, this.userHome), u, g);
    if (!ok) return { output: `chown: cannot access '${target}': No such file or directory\n`, exitCode: 1 };
    return { output: '', exitCode: 0 };
  }

  private cmdChgrp(params: string[]): CommandResult {
    if (params.length < 2) return { output: 'chgrp: missing operand\n', exitCode: 1 };
    const [group, target] = params;
    const ok = vfsService.chown(vfsService.resolvePath(target, this.cwd, this.userHome), this.user, group);
    if (!ok) return { output: `chgrp: cannot access '${target}': No such file or directory\n`, exitCode: 1 };
    return { output: '', exitCode: 0 };
  }

  private cmdUmask(params: string[]): CommandResult {
    if (params.length === 0) return { output: `${this.umaskValue}\n`, exitCode: 0 };
    this.umaskValue = params[0];
    return { output: '', exitCode: 0 };
  }

  private cmdGrep(params: string[], stdin: string): CommandResult {
    let ignoreCase = false;
    let invertMatch = false;
    let countOnly = false;
    const args: string[] = [];

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('i')) ignoreCase = true;
        if (p.includes('v')) invertMatch = true;
        if (p.includes('c')) countOnly = true;
      } else {
        args.push(p);
      }
    }

    if (args.length === 0) return { output: 'Usage: grep [OPTION]... PATTERNS [FILE]...\n', exitCode: 2 };

    const patternStr = args[0];
    const files = args.slice(1);

    let textToSearch = stdin;
    if (files.length > 0) {
      textToSearch = '';
      for (const f of files) {
        const entry = vfsService.getEntry(vfsService.resolvePath(f, this.cwd, this.userHome));
        if (entry && !entry.isDirectory) {
          textToSearch += entry.content || '';
        } else {
          return { output: `grep: ${f}: No such file or directory\n`, exitCode: 2 };
        }
      }
    }

    const lines = textToSearch.split('\n');
    const matched: string[] = [];
    const regex = new RegExp(patternStr, ignoreCase ? 'i' : '');

    for (const line of lines) {
      if (!line && lines.length === 1) continue;
      const m = regex.test(line);
      if (invertMatch ? !m : m) {
        matched.push(line);
      }
    }

    if (countOnly) return { output: `${matched.length}\n`, exitCode: matched.length > 0 ? 0 : 1 };
    if (matched.length === 0) return { output: '', exitCode: 1 };
    return { output: matched.join('\n') + '\n', exitCode: 0 };
  }

  private cmdSed(params: string[], stdin: string): CommandResult {
    const expr = params[0];
    const file = params[1];
    let text = stdin;

    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (!entry) return { output: `sed: can't read ${file}: No such file or directory\n`, exitCode: 2 };
      text = entry.content || '';
    }

    if (!expr) return { output: text, exitCode: 0 };
    const sMatch = expr.match(/^s\/(.*?)\/(.*?)\/?([g|i]*)$/);
    if (sMatch) {
      const find = sMatch[1];
      const replace = sMatch[2];
      const flags = sMatch[3];
      const reg = new RegExp(find, flags.includes('g') ? 'g' : '');
      const replaced = text.replace(reg, replace);
      return { output: replaced, exitCode: 0 };
    }
    return { output: text, exitCode: 0 };
  }

  private cmdAwk(params: string[], stdin: string): CommandResult {
    const script = params[0];
    const file = params[1];
    let text = stdin;

    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (entry) text = entry.content || '';
    }

    const colMatch = script.match(/\$([0-9]+)/);
    if (colMatch) {
      const colIdx = parseInt(colMatch[1], 10);
      const lines = text.split('\n').filter(Boolean);
      const out = lines.map((l) => {
        const parts = l.trim().split(/\s+/);
        if (colIdx === 0) return l;
        return parts[colIdx - 1] || '';
      }).join('\n');
      return { output: out + '\n', exitCode: 0 };
    }

    return { output: text, exitCode: 0 };
  }

  private cmdSort(params: string[], stdin: string): CommandResult {
    let reverse = false;
    let numeric = false;
    let file = '';

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('r')) reverse = true;
        if (p.includes('n')) numeric = true;
      } else {
        file = p;
      }
    }

    let text = stdin;
    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (!entry) return { output: `sort: cannot read: ${file}: No such file or directory\n`, exitCode: 2 };
      text = entry.content || '';
    }

    const lines = text.split('\n').filter(Boolean);
    lines.sort((a, b) => {
      if (numeric) return (parseFloat(a) || 0) - (parseFloat(b) || 0);
      return a.localeCompare(b);
    });

    if (reverse) lines.reverse();
    return { output: lines.join('\n') + '\n', exitCode: 0 };
  }

  private cmdUniq(params: string[], stdin: string): CommandResult {
    let count = false;
    let file = '';

    for (const p of params) {
      if (p === '-c') count = true;
      else if (!p.startsWith('-')) file = p;
    }

    let text = stdin;
    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (entry) text = entry.content || '';
    }

    const lines = text.split('\n').filter(Boolean);
    const result: string[] = [];
    let currentLine = '';
    let currentCount = 0;

    for (const line of lines) {
      if (line === currentLine) {
        currentCount++;
      } else {
        if (currentLine) {
          result.push(count ? `${String(currentCount).padStart(7)} ${currentLine}` : currentLine);
        }
        currentLine = line;
        currentCount = 1;
      }
    }
    if (currentLine) {
      result.push(count ? `${String(currentCount).padStart(7)} ${currentLine}` : currentLine);
    }

    return { output: result.join('\n') + (result.length > 0 ? '\n' : ''), exitCode: 0 };
  }

  private cmdWc(params: string[], stdin: string): CommandResult {
    let countLines = false;
    let countWords = false;
    let countBytes = false;
    const files: string[] = [];

    for (const p of params) {
      if (p.startsWith('-')) {
        if (p.includes('l')) countLines = true;
        if (p.includes('w')) countWords = true;
        if (p.includes('c')) countBytes = true;
      } else {
        files.push(p);
      }
    }

    if (!countLines && !countWords && !countBytes) {
      countLines = true;
      countWords = true;
      countBytes = true;
    }

    let text = stdin;
    let fileName = '';

    if (files.length > 0) {
      fileName = files[0];
      const entry = vfsService.getEntry(vfsService.resolvePath(fileName, this.cwd, this.userHome));
      if (!entry) return { output: `wc: ${fileName}: No such file or directory\n`, exitCode: 1 };
      text = entry.content || '';
    }

    const linesCount = text ? text.split('\n').length - (text.endsWith('\n') ? 1 : 0) : 0;
    const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const bytesCount = new TextEncoder().encode(text).length;

    let res = '';
    if (countLines) res += `${String(linesCount).padStart(8)} `;
    if (countWords) res += `${String(wordsCount).padStart(8)} `;
    if (countBytes) res += `${String(bytesCount).padStart(8)} `;
    if (fileName) res += `${fileName}`;

    return { output: `${res.trim()}\n`, exitCode: 0 };
  }

  private cmdCut(params: string[], stdin: string): CommandResult {
    let delimiter = '\t';
    let field = 1;
    let file = '';

    for (let i = 0; i < params.length; i++) {
      if (params[i] === '-d' && params[i + 1]) {
        delimiter = params[i + 1];
        i++;
      } else if (params[i] === '-f' && params[i + 1]) {
        field = parseInt(params[i + 1], 10) || 1;
        i++;
      } else if (!params[i].startsWith('-')) {
        file = params[i];
      }
    }

    let text = stdin;
    if (file) {
      const entry = vfsService.getEntry(vfsService.resolvePath(file, this.cwd, this.userHome));
      if (entry) text = entry.content || '';
    }

    const lines = text.split('\n').filter(Boolean);
    const out = lines.map((l) => {
      const parts = l.split(delimiter);
      return parts[field - 1] || '';
    }).join('\n');

    return { output: out + '\n', exitCode: 0 };
  }

  private cmdTr(params: string[], stdin: string): CommandResult {
    if (params.length < 2) return { output: stdin, exitCode: 0 };
    const from = params[0];
    const to = params[1];

    if (from === 'a-z' && to === 'A-Z') {
      return { output: stdin.toUpperCase(), exitCode: 0 };
    }
    if (from === 'A-Z' && to === 'a-z') {
      return { output: stdin.toLowerCase(), exitCode: 0 };
    }

    let res = stdin;
    for (let i = 0; i < Math.min(from.length, to.length); i++) {
      res = res.split(from[i]).join(to[i]);
    }
    return { output: res, exitCode: 0 };
  }

  private cmdDiff(params: string[]): CommandResult {
    if (params.length < 2) return { output: 'diff: missing operand\n', exitCode: 2 };
    const e1 = vfsService.getEntry(vfsService.resolvePath(params[0], this.cwd, this.userHome));
    const e2 = vfsService.getEntry(vfsService.resolvePath(params[1], this.cwd, this.userHome));
    if (!e1 || !e2) return { output: 'diff: No such file or directory\n', exitCode: 2 };
    if (e1.content === e2.content) return { output: '', exitCode: 0 };
    return { output: `1c1\n< ${e1.content?.slice(0, 30)}\n---\n> ${e2.content?.slice(0, 30)}\n`, exitCode: 1 };
  }

  private cmdPs(params: string[]): CommandResult {
    const isAux = params.some((p) => p.includes('aux'));
    if (isAux) {
      const out =
        'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n' +
        'root         1  0.0  0.2 168340 12450 ?        Ss   10:00   0:01 /sbin/init splash\n' +
        'root         2  0.0  0.0      0     0 ?        S    10:00   0:00 [kthreadd]\n' +
        'root        14  0.0  0.1  28500  4210 ?        Ss   10:00   0:00 /lib/systemd/systemd-journald\n' +
        'root        22  0.0  0.1  45120  5840 ?        Ss   10:00   0:00 /usr/sbin/cron -f\n' +
        'sheikh     142  0.0  0.3  34500  8910 pts/0    Ss   10:02   0:00 /bin/bash\n' +
        `sheikh     210  0.0  0.1  21400  3210 pts/0    R+   11:15   0:00 ps ${params.join(' ')}\n`;
      return { output: out, exitCode: 0 };
    }

    const out =
      '    PID TTY          TIME CMD\n' +
      '    142 pts/0    00:00:00 bash\n' +
      '    210 pts/0    00:00:00 ps\n';
    return { output: out, exitCode: 0 };
  }

  private cmdTop(): CommandResult {
    const out =
      'top - 11:15:32 up  1:15,  1 user,  load average: 0.08, 0.04, 0.01\n' +
      'Tasks:  48 total,   1 running,  47 sleeping,   0 stopped,   0 zombie\n' +
      '%Cpu(s):  1.2 us,  0.8 sy,  0.0 ni, 97.8 id,  0.2 wa,  0.0 hi,  0.0 si\n' +
      'MiB Mem :   2048.0 total,   1216.5 free,    480.2 used,    351.3 buff/cache\n' +
      'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   1527.5 avail Mem\n\n' +
      '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n' +
      '    142 sheikh    20   0   34500   8910   4210 S   0.0   0.4   0:00.14 bash\n' +
      '      1 root      20   0  168340  12450   8900 S   0.0   0.6   0:01.05 systemd\n';
    return { output: out, exitCode: 0 };
  }

  private cmdFree(params: string[]): CommandResult {
    if (params.includes('-h')) {
      const out =
        '               total        used        free      shared  buff/cache   available\n' +
        'Mem:           2.0Gi       480Mi       1.2Gi        12Mi       351Mi       1.5Gi\n' +
        'Swap:          2.0Gi          0B       2.0Gi\n';
      return { output: out, exitCode: 0 };
    }
    const out =
      '               total        used        free      shared  buff/cache   available\n' +
      'Mem:         2097152      491724     1254328       12288      351100     1567200\n' +
      'Swap:        2097148           0     2097148\n';
    return { output: out, exitCode: 0 };
  }

  private cmdDf(params: string[]): CommandResult {
    const out =
      'Filesystem     1K-blocks      Used Available Use% Mounted on\n' +
      '/dev/sda1       41943040   8388608  33554432  20% /\n' +
      'tmpfs            1048576         0   1048576   0% /dev/shm\n' +
      'tmpfs            1048576      1200   1047376   1% /run\n';
    return { output: out, exitCode: 0 };
  }

  private cmdDu(params: string[]): CommandResult {
    const target = params[0] || '.';
    const resolved = vfsService.resolvePath(target, this.cwd, this.userHome);
    const entry = vfsService.getEntry(resolved);
    if (!entry) return { output: `du: cannot access '${target}': No such file or directory\n`, exitCode: 1 };
    return { output: `4\t${resolved}\n`, exitCode: 0 };
  }

  private cmdKill(params: string[]): CommandResult {
    if (params.length === 0) return { output: 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...\n', exitCode: 1 };
    return { output: '', exitCode: 0 };
  }

  private cmdIp(params: string[]): CommandResult {
    const sub = params[0] || 'a';
    if (sub === 'a' || sub === 'addr' || sub === 'address') {
      const out =
        '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n' +
        '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n' +
        '    inet 127.0.0.1/8 scope host lo\n' +
        '       valid_lft forever preferred_lft forever\n' +
        '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n' +
        '    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n' +
        '    inet 192.168.1.105/24 brd 192.168.1.255 scope global dynamic eth0\n' +
        '       valid_lft 86320sec preferred_lft 86320sec\n';
      return { output: out, exitCode: 0 };
    }
    if (sub === 'r' || sub === 'route') {
      return { output: 'default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.105 metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.105\n', exitCode: 0 };
    }
    return { output: 'Object "route" or "addr" expected.\n', exitCode: 1 };
  }

  private cmdPing(params: string[]): CommandResult {
    const host = params.find((p) => !p.startsWith('-')) || 'google.com';
    const out =
      `PING ${host} (142.250.190.46) 56(84) bytes of data.\n` +
      `64 bytes from ${host} (142.250.190.46): icmp_seq=1 ttl=118 time=14.2 ms\n` +
      `64 bytes from ${host} (142.250.190.46): icmp_seq=2 ttl=118 time=13.8 ms\n` +
      `64 bytes from ${host} (142.250.190.46): icmp_seq=3 ttl=118 time=14.5 ms\n` +
      `64 bytes from ${host} (142.250.190.46): icmp_seq=4 ttl=118 time=13.9 ms\n\n` +
      `--- ${host} ping statistics ---\n` +
      `4 packets transmitted, 4 received, 0% packet loss, time 3004ms\n` +
      `rtt min/avg/max/mdev = 13.812/14.110/14.520/0.270 ms\n`;
    return { output: out, exitCode: 0 };
  }

  private cmdNetFetch(cmd: string, params: string[]): CommandResult {
    const url = params.find((p) => !p.startsWith('-')) || 'http://example.com';
    return {
      output: `<!doctype html>\n<html>\n<head><title>Example Domain</title></head>\n<body>\n<h1>Connected to ${url}</h1>\n<p>Linux networking active.</p>\n</body>\n</html>\n`,
      exitCode: 0,
    };
  }

  private cmdSsh(params: string[]): CommandResult {
    const dest = params[0];
    if (!dest) return { output: 'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [user@]hostname [command]\n', exitCode: 1 };
    return { output: `OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022\nConnection to ${dest} established in virtual lab.\n`, exitCode: 0 };
  }

  private cmdNetstat(): CommandResult {
    const out =
      'Active Internet connections (only servers)\n' +
      'Proto Recv-Q Send-Q Local Address           Foreign Address         State\n' +
      'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\n' +
      'tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN\n' +
      'tcp6       0      0 :::22                   :::*                    LISTEN\n';
    return { output: out, exitCode: 0 };
  }

  private cmdApt(params: string[]): CommandResult {
    const sub = params[0];
    if (sub === 'update') {
      const out =
        'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\n' +
        'Hit:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease\n' +
        'Hit:3 http://security.ubuntu.com/ubuntu jammy-security InRelease\n' +
        'Reading package lists... Done\n' +
        'Building dependency tree... Done\n' +
        'All packages are up to date.\n';
      return { output: out, exitCode: 0 };
    }
    if (sub === 'install') {
      const pkg = params.slice(1).join(' ') || 'pkg';
      const out =
        `Reading package lists... Done\n` +
        `Building dependency tree... Done\n` +
        `The following NEW packages will be installed:\n  ${pkg}\n` +
        `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\n` +
        `Setting up ${pkg} ...\n` +
        `Processing triggers for man-db ...\n`;
      return { output: out, exitCode: 0 };
    }
    return { output: 'apt 2.4.11 (amd64)\nUsage: apt [options] command\nCommands: update, install, remove, list, search\n', exitCode: 0 };
  }

  private cmdGcc(cmd: string, params: string[]): CommandResult {
    if (params.includes('--version') || params.includes('-v')) {
      const out =
        `gcc (Ubuntu 12.3.0-1ubuntu1~22.04.3) 12.3.0\n` +
        `Copyright (C) 2022 Free Software Foundation, Inc.\n` +
        `This is free software; see the source for copying conditions.  There is NO\n` +
        `warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\n`;
      return { output: out, exitCode: 0 };
    }

    if (params.length === 0) {
      return { output: 'gcc: fatal error: no input files\ncompilation terminated.\n', exitCode: 1 };
    }

    // Handle compilation: gcc main.c -o app
    let inputFile = '';
    let outputFile = 'a.out';
    for (let i = 0; i < params.length; i++) {
      if (params[i] === '-o' && params[i + 1]) {
        outputFile = params[i + 1];
        i++;
      } else if (!params[i].startsWith('-')) {
        inputFile = params[i];
      }
    }

    if (inputFile) {
      const resolved = vfsService.resolvePath(inputFile, this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);
      if (!entry) {
        return { output: `gcc: error: ${inputFile}: No such file or directory\ngcc: fatal error: no input files\ncompilation terminated.\n`, exitCode: 1 };
      }
      const outPath = vfsService.resolvePath(outputFile, this.cwd, this.userHome);
      vfsService.writeFile(
        outPath,
        `#!/bin/sh\n# Compiled binary for: ${inputFile}\nprintf "Hello Sheikh from Linux C Program!\\nPID: $$ \\n"\n`,
        '-rwxr-xr-x',
        this.user,
        this.user
      );
      return { output: '', exitCode: 0 };
    }

    return { output: '', exitCode: 0 };
  }

  private cmdMake(params: string[]): CommandResult {
    return { output: 'make: Nothing to be done for \'all\'.\n', exitCode: 0 };
  }

  private cmdPython(params: string[]): CommandResult {
    if (params.includes('--version') || params.includes('-V')) {
      return { output: 'Python 3.10.12\n', exitCode: 0 };
    }

    if (params[0] === '-c' && params[1]) {
      const code = params[1].replace(/["']/g, '');
      const printMatch = code.match(/print\((.*?)\)/);
      if (printMatch) {
        return { output: `${printMatch[1]}\n`, exitCode: 0 };
      }
      return { output: `${code}\n`, exitCode: 0 };
    }

    if (params[0] && !params[0].startsWith('-')) {
      const resolved = vfsService.resolvePath(params[0], this.cwd, this.userHome);
      const entry = vfsService.getEntry(resolved);
      if (!entry) {
        return { output: `python3: can't open file '${params[0]}': [Errno 2] No such file or directory\n`, exitCode: 2 };
      }
      return {
        output: `=============================================\nPython 3.10.12 Environment\nUser: ${this.user} | Path: ${this.cwd}\nExecution completed successfully.\n`,
        exitCode: 0,
      };
    }

    return {
      output: 'Python 3.10.12 (main, Nov 20 2023, 15:14:05) [GCC 11.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n',
      exitCode: 0,
    };
  }

  private cmdBash(params: string[]): CommandResult {
    if (params.length === 0) {
      return { output: '', exitCode: 0 };
    }
    const resolved = vfsService.resolvePath(params[0], this.cwd, this.userHome);
    const entry = vfsService.getEntry(resolved);
    if (!entry) {
      return { output: `bash: ${params[0]}: No such file or directory\n`, exitCode: 127 };
    }
    const lines = (entry.content || '').split('\n');
    let out = '';
    for (const l of lines) {
      const tr = l.trim();
      if (!tr || tr.startsWith('#')) continue;
      out += this.execute(tr).output;
    }
    return { output: out, exitCode: 0 };
  }

  private cmdWhich(params: string[]): CommandResult {
    if (params.length === 0) return { output: '', exitCode: 1 };
    const cmd = params[0];
    const path = `/bin/${cmd}`;
    if (vfsService.exists(path)) {
      return { output: `${path}\n`, exitCode: 0 };
    }
    const usrPath = `/usr/bin/${cmd}`;
    if (vfsService.exists(usrPath)) {
      return { output: `${usrPath}\n`, exitCode: 0 };
    }
    return { output: '', exitCode: 1 };
  }

  private cmdEditor(cmd: string, params: string[]): CommandResult {
    const file = params[0];
    if (!file) return { output: `${cmd}: missing filename\n`, exitCode: 1 };
    const resolved = vfsService.resolvePath(file, this.cwd, this.userHome);
    if (!vfsService.exists(resolved)) {
      vfsService.writeFile(resolved, '', '-rw-r--r--', this.user, this.user);
    }
    return { output: `[${cmd}]: File '${file}' opened in desktop Text Editor.\n`, exitCode: 0 };
  }

  private cmdHistory(): CommandResult {
    let out = '';
    this.history.forEach((cmd, idx) => {
      out += `  ${String(idx + 1).padStart(4)}  ${cmd}\n`;
    });
    return { output: out, exitCode: 0 };
  }

  private cmdHelp(): CommandResult {
    const out =
      'GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)\n' +
      'These shell commands are defined internally. Type `help\' to see this list.\n\n' +
      '  File:     ls, cd, pwd, mkdir, rmdir, touch, cp, mv, rm, cat, less, head, tail, find, tree, file, stat\n' +
      '  Text:     echo, printf, grep, sed, awk, sort, uniq, wc, cut, tr, diff, nano, vi\n' +
      '  Access:   sudo, su, chmod, chown, chgrp, umask, id, groups, whoami\n' +
      '  System:   uname, hostname, date, cal, uptime, free, df, du, ps, top, kill, pkill\n' +
      '  Network:  ip, ping, curl, wget, ssh, netstat, ss\n' +
      '  Packages: apt, apt-get\n' +
      '  Compilers:gcc, g++, make, python3, bash, sh\n\n' +
      'Use &&, ||, |, >, >> to chain and redirect commands. Filesystem persists across sessions.\n';
    return { output: out, exitCode: 0 };
  }

  private cmdMan(params: string[]): CommandResult {
    const target = params[0];
    if (!target) return { output: 'What manual page do you want?\n', exitCode: 1 };
    return {
      output: `${target.toUpperCase()}(1)               General Commands Manual               ${target.toUpperCase()}(1)\n\nNAME\n       ${target} - Linux utility\n\nDESCRIPTION\n       Refer to UniGrova Linux Command Manual.\n`,
      exitCode: 0,
    };
  }
}

export const defaultShell = new ShellSession('sheikh', '/home/sheikh');
