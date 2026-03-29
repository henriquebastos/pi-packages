/**
 * Diff generation utilities for file operation tracking
 */
import * as Diff from 'diff';
import type { ObjectStore } from './object-store.js';
import { getBlobFromGit, isInGitHistory } from './git-objects.js';
import type { DiffResult } from './types.js';

/**
 * Generate a unified diff between two content blobs
 */
export function createUnifiedDiff(
  path: string,
  beforeContent: string | null,
  afterContent: string | null
): { diff: string; additions: number; deletions: number } {
  if (!beforeContent && !afterContent) {
    return { diff: '', additions: 0, deletions: 0 };
  }
  
  if (!beforeContent) {
    // New file
    const lines = afterContent!.split('\n');
    return {
      diff: `--- /dev/null\n+++ b/${path}\n${lines.map(l => `+${l}`).join('\n')}\n`,
      additions: lines.length,
      deletions: 0,
    };
  }
  
  if (!afterContent) {
    // Deleted file
    const lines = beforeContent.split('\n');
    return {
      diff: `--- a/${path}\n+++ /dev/null\n${lines.map(l => `-${l}`).join('\n')}\n`,
      additions: 0,
      deletions: lines.length,
    };
  }
  
  // Generate unified diff
  const patch = Diff.createPatch(path, beforeContent, afterContent, '', '', { context: 3 });
  
  // Count additions and deletions
  const lines = patch.split('\n');
  let additions = 0;
  let deletions = 0;
  
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }
  
  return { diff: patch, additions, deletions };
}

/**
 * Get content from either our object store or git
 */
export async function getContentByHash(
  objectStore: ObjectStore,
  hash: string | undefined,
  cwd: string
): Promise<string | null> {
  if (!hash) return null;
  
  // Try our object store first
  const fromStore = await objectStore.getAsString(hash);
  if (fromStore) return fromStore;
  
  // Fall back to git
  return getBlobFromGit(hash, cwd);
}

/**
 * Generate diff for a file operation
 */
export async function generateDiff(
  objectStore: ObjectStore,
  path: string,
  beforeHash: string | undefined,
  afterHash: string | undefined,
  cwd: string
): Promise<DiffResult> {
  const beforeContent = await getContentByHash(objectStore, beforeHash, cwd);
  const afterContent = await getContentByHash(objectStore, afterHash, cwd);
  
  const { diff, additions, deletions } = createUnifiedDiff(path, beforeContent, afterContent);
  
  return {
    path,
    beforeHash,
    afterHash,
    diff,
    additions,
    deletions,
  };
}

/**
 * Check if a blob can be safely deleted (exists in git)
 */
export async function canDeleteBlob(hash: string, cwd: string): Promise<boolean> {
  return isInGitHistory(hash, cwd);
}
