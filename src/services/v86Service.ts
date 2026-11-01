/**
 * v86 WebAssembly Linux Emulator Service
 * Orchestrates x86 virtualization, serial console communication, and guest bridge.
 */

import { VMConfig, VMStatus } from '../types';

type OutputListener = (data: string) => void;
type StatusListener = (status: VMStatus, message?: string) => void;

class V86Service {
  private emulator: any = null;
  private status: VMStatus = 'idle';
  private statusMessage: string = 'Ready to start';
  private listeners: Set<OutputListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private bootLogs: string[] = [];
  private isScriptLoaded = false;
  private isShellReady = false;
  private config: VMConfig = {
    image: 'buildroot',
    memorySizeMB: 64,
  };

  constructor() {
    // Check if script is already present
    if (typeof window !== 'undefined' && (window as any).V86Starter) {
      this.isScriptLoaded = true;
    }
  }

  getStatus(): VMStatus {
    return this.status;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  getBootLogs(): string[] {
    return this.bootLogs;
  }

  isReady(): boolean {
    return this.status === 'ready' && this.isShellReady;
  }

  getConfig(): VMConfig {
    return { ...this.config };
  }

  setConfig(newConfig: Partial<VMConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  addOutputListener(listener: OutputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.statusMessage);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: VMStatus, message: string = '') {
    this.status = status;
    this.statusMessage = message;
    this.statusListeners.forEach((l) => l(status, message));
  }

  private appendLog(text: string) {
    this.bootLogs.push(text);
    if (this.bootLogs.length > 2000) {
      this.bootLogs.shift();
    }
  }

  private async loadScript(): Promise<void> {
    if (this.isScriptLoaded && (window as any).V86Starter) return;

    return new Promise((resolve, reject) => {
      const existing = document.getElementById('v86-script');
      if (existing) {
        existing.addEventListener('load', () => {
          this.isScriptLoaded = true;
          resolve();
        });
        existing.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.id = 'v86-script';
      script.src = '/v86/libv86.js';
      script.async = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => {
        reject(new Error(`Failed to load v86 library: ${err}`));
      };
      document.head.appendChild(script);
    });
  }

  async start(): Promise<void> {
    if (this.emulator && (this.status === 'ready' || this.status === 'booting')) {
      return;
    }

    try {
      this.setStatus('downloading', 'Loading WebAssembly emulator and Linux kernel...');
      this.appendLog('[INIT] Initializing UniGrova Linux Lab v86 WebAssembly JIT engine...');

      await this.loadScript();

      const V86Starter = (window as any).V86Starter;
      if (!V86Starter) {
        throw new Error('V86Starter class not found in window after loading libv86.js');
      }

      this.setStatus('booting', 'Booting Linux kernel...');
      this.appendLog('[BOOT] Loading SeaBIOS (128KB) & VGABIOS...');
      this.appendLog(`[BOOT] Allocating ${this.config.memorySizeMB}MB RAM for virtual machine...`);
      this.appendLog(`[BOOT] Selected OS image: ${this.config.image === 'linux4' ? 'Linux 4.x ISO' : 'Buildroot Linux 5.6'}`);

      const v86Options: any = {
        wasm_path: '/v86/v86.wasm',
        memory_size: this.config.memorySizeMB * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        bios: { url: '/v86/seabios.bin' },
        vga_bios: { url: '/v86/vgabios.bin' },
        autostart: true,
      };

      if (this.config.image === 'linux4') {
        v86Options.cdrom = { url: '/v86/linux4.iso' };
      } else {
        v86Options.bzimage = { url: '/v86/buildroot-bzimage.bin' };
        v86Options.cmdline = 'tsc=reliable mitigations=off random.trust_cpu=on console=ttyS0 quiet root=/dev/ram0 rw';
      }

      const emulator = new V86Starter(v86Options);
      this.emulator = emulator;

      // Listen for serial output
      let serialBuffer = '';
      emulator.add_listener('serial0-output-char', (char: string) => {
        // Broadcast character
        this.listeners.forEach((l) => l(char));

        serialBuffer += char;
        if (char === '\n' || char === '\r') {
          if (serialBuffer.trim()) {
            this.appendLog(serialBuffer.trim());
          }
          serialBuffer = '';
        }

        // Check for shell prompt
        if (!this.isShellReady) {
          if (
            serialBuffer.includes('/ #') ||
            serialBuffer.includes('~ #') ||
            serialBuffer.includes('buildroot login:') ||
            serialBuffer.includes('root@') ||
            serialBuffer.includes('login:')
          ) {
            this.isShellReady = true;
            this.setStatus('ready', 'Linux system is running');
            this.appendLog('[READY] Shell prompt active. Linux environment ready.');
          }
        }
      });

      // Handle download progress if provided by v86
      emulator.add_listener('download-progress', (e: any) => {
        if (e && e.file_name) {
          this.setStatus(
            'downloading',
            `Downloading ${e.file_name} (${Math.round((e.loaded / (e.total || 1)) * 100)}%)...`
          );
        }
      });

      emulator.add_listener('emulator-ready', () => {
        this.appendLog('[EMULATOR] Virtual hardware initialized. Starting CPU execution.');
        // Set a timer: if shell prompt isn't detected by text in 15 seconds, assume ready
        setTimeout(() => {
          if (this.status === 'booting') {
            this.isShellReady = true;
            this.setStatus('ready', 'Linux system is running');
          }
        }, 12000);
      });
    } catch (err: any) {
      console.error('Failed to start v86:', err);
      this.setStatus('error', err.message || 'Failed to start Linux emulator');
      this.appendLog(`[ERROR] ${err.message || String(err)}`);
    }
  }

  sendInput(text: string): void {
    if (!this.emulator) {
      console.warn('Cannot send input: emulator not initialized');
      return;
    }
    try {
      this.emulator.serial0_send(text);
    } catch (e) {
      console.error('Error sending serial input:', e);
    }
  }

  async stop(): Promise<void> {
    if (this.emulator) {
      try {
        if (typeof this.emulator.stop === 'function') {
          this.emulator.stop();
        }
        if (typeof this.emulator.destroy === 'function') {
          this.emulator.destroy();
        }
      } catch (e) {
        console.warn('Error during emulator stop:', e);
      }
      this.emulator = null;
      this.isShellReady = false;
      this.setStatus('stopped', 'Linux machine stopped');
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Helper to execute a command quietly and capture its text output
   */
  async execCommand(command: string, timeoutMs: number = 8000): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Linux emulator is not ready');
    }

    return new Promise((resolve, reject) => {
      const delimiter = `__CMD_DELIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}__`;
      let output = '';
      let timer: any = null;

      const unsubscribe = this.addOutputListener((char) => {
        output += char;
        if (output.includes(delimiter)) {
          clearTimeout(timer);
          unsubscribe();

          // Extract output between command echo and delimiter
          const lines = output.split('\n');
          const delimIndex = lines.findIndex((l) => l.includes(delimiter));
          const resultLines = delimIndex !== -1 ? lines.slice(1, delimIndex) : lines;
          resolve(resultLines.join('\n').trim());
        }
      });

      timer = setTimeout(() => {
        unsubscribe();
        resolve(output.replace(delimiter, '').trim());
      }, timeoutMs);

      // Execute command with delimiter echo
      this.sendInput(`${command}\necho "${delimiter}"\n`);
    });
  }

  /**
   * Write file to the guest Linux filesystem using base64
   */
  async writeFile(path: string, content: string): Promise<boolean> {
    try {
      // Base64 encode string (supports utf-8)
      const encoded = btoa(unescape(encodeURIComponent(content)));
      const cmd = `echo '${encoded}' | base64 -d > ${path}`;
      await this.execCommand(cmd, 6000);
      return true;
    } catch (e) {
      console.error('Error writing file to Linux:', e);
      return false;
    }
  }

  /**
   * Read file from the guest Linux filesystem
   */
  async readFile(path: string): Promise<string | null> {
    try {
      const cmd = `base64 ${path}`;
      const base64Content = await this.execCommand(cmd, 6000);
      // Clean up output
      const cleanB64 = base64Content.replace(/\s+/g, '');
      const decoded = decodeURIComponent(escape(atob(cleanB64)));
      return decoded;
    } catch (e) {
      console.warn('Error reading file from Linux:', e);
      return null;
    }
  }
}

export const v86Service = new V86Service();
