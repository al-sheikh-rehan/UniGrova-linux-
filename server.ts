import express, { Request, Response } from 'express';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure system user unigrova directories exist with proper permissions
const ensureUserEnvironment = () => {
  try {
    const dirs = [
      '/home/unigrova',
      '/home/unigrova/Desktop',
      '/home/unigrova/Documents',
      '/home/unigrova/Downloads',
      '/home/unigrova/Projects',
      '/home/unigrova/lpu_cse65d_lab',
    ];

    dirs.forEach((d) => {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    });

    // Populate welcome file if empty
    const welcomeFile = '/home/unigrova/Documents/welcome.txt';
    if (!fs.existsSync(welcomeFile)) {
      fs.writeFileSync(
        welcomeFile,
        'Welcome to UniGrova Linux OS.\nGenuine Debian Linux kernel environment for LPU CSE65D Operating Systems Lab.\nAll commands, compiler calls, and files are persisted directly on disk.\n'
      );
    }

    // Set bash environment files for unigrova
    const bashrc = '/home/unigrova/.bashrc';
    const bashrcContent = `
# UniGrova Linux Environment
export PS1='\\[\\033[01;32m\\]unigrova@user\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
export USER=unigrova
export LOGNAME=unigrova
export HOME=/home/unigrova
export SHELL=/bin/bash
export TERM=xterm-256color
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
alias ls='ls --color=auto'
alias ll='ls -la'
alias grep='grep --color=auto'
`;
    fs.writeFileSync(bashrc, bashrcContent);

    // Chown directories to unigrova (uid 1001)
    spawn('chown', ['-R', '1001:1001', '/home/unigrova']).on('error', () => {});
  } catch (err) {
    console.error('Failed to setup unigrova environment:', err);
  }
};
ensureUserEnvironment();

// Start root sudo daemon in background
const startSudoDaemon = () => {
  try {
    const daemonScript = path.join(__dirname, 'scripts', 'sudo_daemon.py');
    if (fs.existsSync(daemonScript)) {
      const p = spawn('python3', [daemonScript], {
        stdio: 'ignore',
        detached: true,
      });
      p.unref();
    }
  } catch (err) {
    console.error('Failed to start sudo daemon:', err);
  }
};
startSudoDaemon();

const PWD_DELIMITER = '__UNIGROVA_PWD_DELIM__';

interface ExecRequestBody {
  command: string;
  cwd?: string;
  user?: string;
  timeoutMs?: number;
}

// Real Linux Command Execution Endpoint (Non-interactive / API / Lab)
app.post('/api/exec', (req: Request<{}, {}, ExecRequestBody>, res: Response) => {
  const { command, cwd = '/home/unigrova', user = 'unigrova', timeoutMs = 20000 } = req.body;

  if (typeof command !== 'string') {
    return res.status(400).json({ error: 'Command must be a string' });
  }

  const trimmed = command.trim();
  if (!trimmed) {
    return res.json({ stdout: '', stderr: '', exitCode: 0, cwd });
  }

  const currentCwd = fs.existsSync(cwd) ? cwd : '/home/unigrova';
  const runAsUser = user === 'root' ? 'root' : 'unigrova';

  const child = spawn('su', ['-', runAsUser, '-s', '/bin/bash'], {
    env: {
      ...process.env,
      USER: runAsUser,
      LOGNAME: runAsUser,
      HOME: runAsUser === 'root' ? '/root' : '/home/unigrova',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: currentCwd,
    },
  });

  let stdoutData = '';
  let stderrData = '';
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      child.kill('SIGKILL');
      res.json({
        stdout: stdoutData,
        stderr: stderrData + '\nCommand timed out.\n',
        exitCode: 124,
        cwd: currentCwd,
      });
    }
  }, timeoutMs);

  child.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  child.on('close', (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);

    let nextCwd = currentCwd;
    const markerIndex = stdoutData.indexOf(PWD_DELIMITER);
    if (markerIndex !== -1) {
      const markerPart = stdoutData.slice(markerIndex);
      const match = markerPart.match(new RegExp(`${PWD_DELIMITER}:(.*)`));
      if (match && match[1]) {
        nextCwd = match[1].trim();
      }
      stdoutData = stdoutData.slice(0, markerIndex).replace(/\n+$/, '\n');
    }

    res.json({
      stdout: stdoutData,
      stderr: stderrData,
      exitCode: code ?? 0,
      cwd: nextCwd,
    });
  });

  child.on('error', (err) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ error: err.message, cwd: currentCwd });
  });

  // Write commands to bash stdin without string-interpolation or base64 breakage
  child.stdin.write(`cd ${JSON.stringify(currentCwd)} 2>/dev/null || cd /home/unigrova\n`);
  child.stdin.write(`${trimmed}\n`);
  child.stdin.write(`__UNIGROVA_CODE__=$?\n`);
  child.stdin.write(`echo "${PWD_DELIMITER}:$(pwd)"\n`);
  child.stdin.write(`exit $__UNIGROVA_CODE__\n`);
  child.stdin.end();
});

// Real LPU CSE65D Experiment Verification Endpoint
app.post('/api/lab/verify', (req: Request, res: Response) => {
  const { experimentId, taskId, checkScript } = req.body;

  if (!checkScript) {
    return res.status(400).json({ error: 'checkScript is required' });
  }

  const child = spawn('su', ['-', 'unigrova', '-s', '/bin/bash'], {
    env: {
      ...process.env,
      USER: 'unigrova',
      LOGNAME: 'unigrova',
      HOME: '/home/unigrova',
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: '/home/unigrova',
    },
  });

  let stdout = '';
  let stderr = '';
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      child.kill('SIGKILL');
      res.json({
        experimentId,
        taskId,
        passed: false,
        stdout: stdout.trim(),
        stderr: 'Verification timed out.\n',
        exitCode: 124,
      });
    }
  }, 10000);

  child.stdout.on('data', (d) => {
    stdout += d.toString();
  });

  child.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  child.on('close', (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    const passed = code === 0;
    res.json({
      experimentId,
      taskId,
      passed,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: code ?? 0,
    });
  });

  child.on('error', (err) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ error: err.message, passed: false });
  });

  child.stdin.write(`cd /home/unigrova 2>/dev/null\n`);
  child.stdin.write(`${checkScript}\n`);
  child.stdin.write(`exit $?\n`);
  child.stdin.end();
});

// Real Filesystem APIs (Synced with Linux disk in /home/unigrova)
app.get('/api/fs/list', (req: Request, res: Response) => {
  const reqPath = (req.query.path as string) || '/home/unigrova';
  const resolved = path.resolve(reqPath);
  try {
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'Path does not exist' });
    }
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Target path is not a directory' });
    }
    const dirents = fs.readdirSync(resolved, { withFileTypes: true });
    const items = dirents.map((d) => {
      const full = path.join(resolved, d.name);
      try {
        const s = fs.statSync(full);
        return {
          name: d.name,
          path: full,
          isDirectory: d.isDirectory(),
          size: s.size,
          permissions: (d.isDirectory() ? 'd' : '-') + 'rw-r--r--',
          owner: 'unigrova',
          group: 'unigrova',
          modified: s.mtime.toISOString(),
        };
      } catch {
        return {
          name: d.name,
          path: full,
          isDirectory: d.isDirectory(),
          size: 0,
          permissions: '-rw-r--r--',
          owner: 'unigrova',
          group: 'unigrova',
          modified: new Date().toISOString(),
        };
      }
    });
    res.json({ path: resolved, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fs/read', (req: Request, res: Response) => {
  const reqPath = req.query.path as string;
  if (!reqPath) return res.status(400).json({ error: 'Path is required' });
  const resolved = path.resolve(reqPath);
  try {
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    res.json({ path: resolved, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fs/write', (req: Request, res: Response) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });
  const resolved = path.resolve(filePath);
  try {
    const parentDir = path.dirname(resolved);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(resolved, content ?? '', 'utf-8');
    spawn('chown', ['1001:1001', resolved]).on('error', () => {});
    res.json({ success: true, path: resolved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fs/mkdir', (req: Request, res: Response) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'Path is required' });
  const resolved = path.resolve(dirPath);
  try {
    fs.mkdirSync(resolved, { recursive: true });
    spawn('chown', ['-R', '1001:1001', resolved]).on('error', () => {});
    res.json({ success: true, path: resolved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fs/delete', (req: Request, res: Response) => {
  const targetPath = (req.query.path as string) || req.body?.path;
  if (!targetPath) return res.status(400).json({ error: 'Path is required' });
  const resolved = path.resolve(targetPath);
  try {
    if (fs.existsSync(resolved)) {
      fs.rmSync(resolved, { recursive: true, force: true });
    }
    res.json({ success: true, path: resolved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real System Information Endpoint
app.get('/api/system/info', (_req: Request, res: Response) => {
  const child = spawn('bash', ['-c', 'uname -a && cat /etc/os-release && uptime']);
  let out = '';
  child.stdout.on('data', (d) => {
    out += d.toString();
  });
  child.on('close', () => {
    const memory = process.memoryUsage();
    res.json({
      distro: 'Debian GNU/Linux 12 (bookworm)',
      kernel: 'Linux 5.15.0 x86_64',
      hostname: 'user',
      user: 'unigrova',
      home: '/home/unigrova',
      shells: ['/bin/bash', '/bin/sh', '/usr/bin/ksh', '/usr/bin/tcsh'],
      compilers: ['gcc (Debian 12.3.0)', 'g++ (Debian 12.3.0)', 'python 3.11'],
      systemOutput: out || '',
      memory,
    });
  });
});

// Configure Vite in development or serve static in production
const startServer = async () => {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);

  // WebSocket Server for persistent Linux PTY sessions
  const wss = new WebSocketServer({ server, path: '/api/terminal/ws' });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const cols = parseInt(url.searchParams.get('cols') || '80', 10);
    const rows = parseInt(url.searchParams.get('rows') || '24', 10);
    const cwd = url.searchParams.get('cwd') || '/home/unigrova';
    const user = url.searchParams.get('user') || 'unigrova';

    const ptyScript = path.join(__dirname, 'scripts', 'pty_bridge.py');
    const ptyProc = spawn('python3', [
      ptyScript,
      '--cols',
      String(cols),
      '--rows',
      String(rows),
      '--cwd',
      cwd,
      '--user',
      user,
    ]);

    // Forward output from PTY process to WebSocket
    ptyProc.stdout.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    ptyProc.stderr.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Forward input from WebSocket to PTY process
    ws.on('message', (message: any) => {
      try {
        const str = message.toString();
        // Check if message is a JSON packet
        if (str.startsWith('{') && str.endsWith('}')) {
          const parsed = JSON.parse(str);
          ptyProc.stdin.write(JSON.stringify(parsed) + '\n');
        } else {
          // Plain text input
          ptyProc.stdin.write(JSON.stringify({ type: 'stdin', data: str }) + '\n');
        }
      } catch {
        ptyProc.stdin.write(JSON.stringify({ type: 'stdin', data: message.toString() }) + '\n');
      }
    });

    ws.on('close', () => {
      try {
        ptyProc.kill('SIGTERM');
      } catch {}
    });

    ptyProc.on('close', () => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch {}
    });

    ptyProc.on('error', (err) => {
      console.error('PTY process error:', err);
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`\r\n\x1b[31mTerminal process failed: ${err.message}\x1b[0m\r\n`);
          ws.close();
        }
      } catch {}
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`UniGrova Linux Lab Server with PTY WebSockets running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Server start error:', err);
});
