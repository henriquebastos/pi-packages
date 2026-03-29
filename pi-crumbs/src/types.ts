/**
 * Type definitions for pi-file-ops
 */

/**
 * File operation types
 */
export type FileOpType = 'edit' | 'create' | 'delete';

/**
 * A file operation entry stored in the session
 */
export interface FileOp {
  toolCallId: string;
  path: string;
  op: FileOpType;
  before?: string;  // SHA-256 hash of before content
  after?: string;   // SHA-256 hash of after content
  ts: number;       // Unix timestamp in ms
}

/**
 * Condensed marker - marks file ops as committed
 */
export interface CondensedMarker {
  commitHash: string;
  toolCallIds: string[];
  ts: number;
}

/**
 * Diff result
 */
export interface DiffResult {
  path: string;
  beforeHash: string | undefined;
  afterHash: string | undefined;
  diff: string;
  additions: number;
  deletions: number;
}

/**
 * Object store stats
 */
export interface ObjectStoreStats {
  count: number;
  totalBytes: number;
}
