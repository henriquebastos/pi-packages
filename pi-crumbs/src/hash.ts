/**
 * Hash utilities for content addressing
 */
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/**
 * Compute SHA-256 hash of content
 */
export function sha256(content: string | Buffer): string {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Hash the contents of a file
 */
export async function hashFile(path: string): Promise<string> {
  const content = await readFile(path);
  return sha256(content);
}
