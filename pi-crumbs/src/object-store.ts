/**
 * Content-addressable object store for file operation tracking.
 * Stores blobs per-session alongside the session file.
 * 
 * Layout:
 *   <session-dir>/<session-id>.jsonl  (session file)
 *   <session-dir>/<session-id>-crumbs/ (blob directory)
 */
import { mkdir, readdir, readFile, stat, unlink, writeFile, rm } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import type { ObjectStoreStats } from './types.js';

/**
 * Get the blob directory path for a session.
 * Blobs are stored alongside the session file.
 * 
 * Session file: <dir>/<session-id>.jsonl
 * Blob dir:     <dir>/<session-id>-crumbs/
 */
export function getBlobDirForSession(sessionFilePath: string): string {
  const dir = dirname(sessionFilePath);
  const sessionFile = basename(sessionFilePath, '.jsonl');
  return join(dir, `${sessionFile}-crumbs`);
}

/**
 * Get the full path for a blob
 */
function getBlobPath(blobDir: string, hash: string): string {
  return join(blobDir, hash);
}

/**
 * Ensure the blob directory exists
 */
async function ensureBlobDir(blobDir: string): Promise<void> {
  if (!existsSync(blobDir)) {
    await mkdir(blobDir, { recursive: true });
  }
}

/**
 * Object store for content-addressable blob storage.
 * Each instance is tied to a specific session.
 */
export class ObjectStore {
  private blobDir: string | null;

  /**
   * Create an ObjectStore for a session.
   * @param sessionFilePath - Path to the session .jsonl file (can be undefined initially)
   */
  constructor(sessionFilePath: string | undefined) {
    this.blobDir = sessionFilePath ? getBlobDirForSession(sessionFilePath) : null;
  }

  /**
   * Check if the blob directory is available
   */
  get isAvailable(): boolean {
    return this.blobDir !== null;
  }

  /**
   * Store content by hash
   */
  async store(hash: string, content: Buffer | string): Promise<void> {
    if (!this.blobDir) {
      throw new Error('ObjectStore not initialized - session file path not available');
    }
    await ensureBlobDir(this.blobDir);
    const blobPath = getBlobPath(this.blobDir, hash);
    if (!existsSync(blobPath)) {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
      await writeFile(blobPath, buffer);
    }
  }

  /**
   * Retrieve content by hash
   */
  async get(hash: string): Promise<Buffer | null> {
    if (!this.blobDir) return null;
    const blobPath = getBlobPath(this.blobDir, hash);
    if (!existsSync(blobPath)) {
      return null;
    }
    try {
      return await readFile(blobPath);
    } catch {
      return null;
    }
  }

  /**
   * Get content as string
   */
  async getAsString(hash: string): Promise<string | null> {
    const buffer = await this.get(hash);
    return buffer ? buffer.toString('utf8') : null;
  }

  /**
   * Delete a blob by hash
   */
  async delete(hash: string): Promise<void> {
    if (!this.blobDir) return;
    const blobPath = getBlobPath(this.blobDir, hash);
    if (existsSync(blobPath)) {
      await unlink(blobPath);
    }
  }

  /**
   * Check if a blob exists
   */
  has(hash: string): boolean {
    if (!this.blobDir) return false;
    const blobPath = getBlobPath(this.blobDir, hash);
    return existsSync(blobPath);
  }

  /**
   * List all stored object hashes
   */
  async list(): Promise<string[]> {
    if (!this.blobDir) return [];
    if (!existsSync(this.blobDir)) {
      return [];
    }
    const files = await readdir(this.blobDir);
    // Filter to only valid SHA-256 hashes (64 hex chars)
    return files.filter(f => /^[a-f0-9]{64}$/.test(f));
  }

  /**
   * Get stats about the object store
   */
  async stats(): Promise<ObjectStoreStats> {
    if (!this.blobDir) return { count: 0, totalBytes: 0 };
    if (!existsSync(this.blobDir)) {
      return { count: 0, totalBytes: 0 };
    }

    const files = await readdir(this.blobDir);
    let totalBytes = 0;

    for (const file of files) {
      if (/^[a-f0-9]{64}$/.test(file)) {
        const filePath = join(this.blobDir, file);
        const stats = await stat(filePath);
        totalBytes += stats.size;
      }
    }

    return { count: files.length, totalBytes };
  }

  /**
   * Delete all blobs for this session.
   * Called when a session is deleted.
   */
  async deleteAll(): Promise<void> {
    if (this.blobDir && existsSync(this.blobDir)) {
      await rm(this.blobDir, { recursive: true });
    }
  }
}

/**
 * Delete all blobs for a session (static helper).
 * Called when a session is deleted.
 */
export async function deleteSessionBlobs(sessionFilePath: string): Promise<void> {
  const blobDir = getBlobDirForSession(sessionFilePath);
  if (existsSync(blobDir)) {
    await rm(blobDir, { recursive: true });
  }
}
