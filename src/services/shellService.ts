/**
 * Shell Execution Service for UniGrova Linux
 * Connects directly to the real Debian Linux container via /api/exec.
 * Completely replaces all simulated commands with genuine Linux execution.
 */

export interface CommandResult {
  output: string;
  exitCode: number;
  cwd?: string;
  clearScreen?: boolean;
}

export class ShellSession {
  private cwd: string = '/home/unigrova';
  private user: string = 'unigrova';
  private hostname: string = 'user';
  private history: string[] = [];

  constructor(initialUser = 'unigrova', initialCwd = '/home/unigrova') {
    this.user = initialUser;
    this.cwd = initialCwd;
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(path: string): void {
    this.cwd = path;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(username: string): void {
    this.user = username;
  }

  public getHostname(): string {
    return this.hostname;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public getPrompt(): string {
    let displayPath = this.cwd;
    const userHome = this.user === 'root' ? '/root' : '/home/unigrova';
    if (this.cwd === userHome) {
      displayPath = '~';
    } else if (this.cwd.startsWith(userHome + '/')) {
      displayPath = '~' + this.cwd.slice(userHome.length);
    }
    const promptChar = this.user === 'root' ? '#' : '$';
    const userColor = this.user === 'root' ? '\x1b[1;31m' : '\x1b[1;32m';

    return `${userColor}${this.user}@${this.hostname}\x1b[0m:\x1b[1;34m${displayPath}\x1b[0m${promptChar} `;
  }

  /**
   * Execute command directly inside genuine Linux container
   */
  public async executeAsync(rawCommand: string): Promise<CommandResult> {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0, cwd: this.cwd };
    }

    this.history.push(trimmed);

    if (trimmed === 'clear') {
      return { output: '', exitCode: 0, clearScreen: true, cwd: this.cwd };
    }

    try {
      const response = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          cwd: this.cwd,
          user: this.user,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cwd && typeof data.cwd === 'string') {
          this.cwd = data.cwd;
        }
        let out = data.stdout || '';
        if (data.stderr) {
          out += (out && !out.endsWith('\n') ? '\n' : '') + data.stderr;
        }
        return {
          output: out,
          exitCode: data.exitCode ?? 0,
          cwd: this.cwd,
        };
      }
    } catch (err: any) {
      return {
        output: `bash: network error executing command: ${err.message || err}\n`,
        exitCode: 1,
        cwd: this.cwd,
      };
    }

    return {
      output: `bash: execution failed\n`,
      exitCode: 1,
      cwd: this.cwd,
    };
  }

  /**
   * Synchronous helper for legacy synchronous callers (dispatches async in background)
   */
  public execute(rawCommand: string): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0, cwd: this.cwd };
    }
    this.history.push(trimmed);

    // Call async in background
    this.executeAsync(rawCommand);

    return {
      output: '',
      exitCode: 0,
      cwd: this.cwd,
    };
  }
}

export const defaultShell = new ShellSession('unigrova', '/home/unigrova');
