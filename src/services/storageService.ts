/**
 * Storage Service using IndexedDB and localStorage
 * Provides persistent storage for user files, lab progress, terminal history, and settings
 */

const DB_NAME = 'unigrova_linux_lab_db';
const DB_VERSION = 1;
const STORE_FILES = 'persistent_files';
const STORE_PROJECTS = 'user_projects';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES, { keyPath: 'path' });
        }
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- File Storage ---
  async saveFile(path: string, content: string | Uint8Array): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        const req = store.put({
          path,
          content,
          updatedAt: new Date().toISOString(),
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Storage fallback to localStorage for file:', path, e);
      localStorage.setItem(`unigrova_file_${path}`, typeof content === 'string' ? content : JSON.stringify(Array.from(content)));
    }
  }

  async getFile(path: string): Promise<string | Uint8Array | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);
        const req = store.get(path);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result.content);
          } else {
            const fallback = localStorage.getItem(`unigrova_file_${path}`);
            resolve(fallback);
          }
        };
        req.onerror = () => {
          resolve(localStorage.getItem(`unigrova_file_${path}`));
        };
      });
    } catch {
      return localStorage.getItem(`unigrova_file_${path}`);
    }
  }

  async getAllFiles(): Promise<{ path: string; updatedAt: string }[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);
        const req = store.getAll();
        req.onsuccess = () => {
          resolve((req.result || []).map((f) => ({ path: f.path, updatedAt: f.updatedAt })));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        const req = store.delete(path);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      localStorage.removeItem(`unigrova_file_${path}`);
    }
  }

  // --- Lab Progress ---
  getCompletedTasks(): string[] {
    try {
      const data = localStorage.getItem('unigrova_lab_completed');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setTaskCompleted(taskId: string): void {
    const current = this.getCompletedTasks();
    if (!current.includes(taskId)) {
      current.push(taskId);
      localStorage.setItem('unigrova_lab_completed', JSON.stringify(current));
    }
  }

  resetLabProgress(): void {
    localStorage.removeItem('unigrova_lab_completed');
  }

  // --- Terminal Command History ---
  getTerminalHistory(): string[] {
    try {
      const history = localStorage.getItem('unigrova_terminal_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  saveTerminalCommand(cmd: string): void {
    if (!cmd.trim()) return;
    const history = this.getTerminalHistory();
    history.push(cmd);
    if (history.length > 200) history.shift();
    localStorage.setItem('unigrova_terminal_history', JSON.stringify(history));
  }

  // --- Desktop Settings ---
  getSetting<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(`unigrova_setting_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setSetting<T>(key: string, value: T): void {
    localStorage.setItem(`unigrova_setting_${key}`, JSON.stringify(value));
  }

  // --- Factory Reset ---
  async clearAllData(): Promise<void> {
    try {
      indexedDB.deleteDatabase(DB_NAME);
    } catch (e) {
      console.warn('Failed to delete indexedDB:', e);
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('unigrova_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}

export const storageService = new StorageService();
