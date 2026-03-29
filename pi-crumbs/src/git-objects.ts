/**
 * Git object utilities for checking and retrieving blobs from git
 */
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Run a git command and return stdout
 */
async function git(args: string[], cwd?: string): Promise<string> {
  const options = cwd ? { cwd, maxBuffer: 10 * 1024 * 1024 } : { maxBuffer: 10 * 1024 * 1024 };
  const { stdout } = await execFileAsync('git', args, options);
  return stdout.trim();
}

/**
 * Check if we're in a git repository
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    await git(['rev-parse', '--git-dir'], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're in a git repository (alias for isGitRepo)
 */
export async function isGitRepository(cwd: string): Promise<boolean> {
  return isGitRepo(cwd);
}

/**
 * Check if an object exists in git's object database
 */
export async function isInGitHistory(hash: string, cwd: string): Promise<boolean> {
  try {
    // Check if the object exists (any type: blob, tree, commit, tag)
    const objType = await git(['cat-file', '-t', hash], cwd);
    return !!objType; // Returns true if object exists
  } catch {
    return false;
  }
}

/**
 * Get the type of a git object (blob, tree, commit, tag)
 * Returns null if the object doesn't exist or on error
 */
export async function getGitObjectType(hash: string, cwd: string): Promise<string | null> {
  try {
    const objType = await git(['cat-file', '-t', hash], cwd);
    return objType;
  } catch {
    return null;
  }
}

/**
 * Get blob content from git's object database
 * Returns null if the object doesn't exist or is not a blob
 */
export async function getBlobFromGit(hash: string, cwd: string): Promise<string | null> {
  try {
    // First check if it's a blob
    const objType = await git(['cat-file', '-t', hash], cwd);
    if (objType !== 'blob') {
      return null;
    }
    const content = await git(['cat-file', '-p', hash], cwd);
    return content;
  } catch {
    return null;
  }
}

/**
 * Get blob content (alias for getBlobFromGit)
 */
export async function getBlobContent(hash: string, cwd: string): Promise<string | null> {
  return getBlobFromGit(hash, cwd);
}

/**
 * Get the current HEAD commit hash
 */
export async function getHeadCommit(cwd: string): Promise<string | null> {
  try {
    return await git(['rev-parse', 'HEAD'], cwd);
  } catch {
    return null;
  }
}

/**
 * Get the tree hash for a commit
 */
export async function getTreeForCommit(commitHash: string, cwd: string): Promise<string | null> {
  try {
    return await git(['rev-parse', `${commitHash}^{tree}`], cwd);
  } catch {
    return null;
  }
}

/**
 * Get the blob hash for a file at a specific commit
 */
export async function getBlobHashForFile(commitHash: string, filePath: string, cwd: string): Promise<string | null> {
  try {
    return await git(['ls-tree', '-r', commitHash, '--', filePath], cwd).then(out => {
      // Output format: <mode> <type> <hash>\t<path>
      const match = out.match(/^[0-9]+ blob ([a-f0-9]+)\t/);
      return match ? match[1] : null;
    });
  } catch {
    return null;
  }
}
