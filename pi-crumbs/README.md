# pi-crumbs

Leave a trail of crumbs to follow your changes.

File operation tracking for Pi coding agent. Captures before/after states of edit/write/delete operations and stores them as custom entries in the session.

## Features

- **Audit trail**: Track which tool call touched which files
- **Diffs on demand**: Generate unified diffs between any two states
- **Per-session storage**: Blobs stored alongside session files
- **Automatic cleanup**: Delete session → delete blobs

## Installation

Add to your Pi settings:

```json
{
  "packages": ["npm:@ssweens/pi-crumbs"]
}
```

## How It Works

When you use edit, write, or delete tools:

1. **Before** the tool executes: Captures file content hash, stores blob
2. **After** the tool executes: Captures new file content hash, stores blob
3. **Appends** a `file_op` entry to the session

## Custom Entry Types

### `file_op`

Records a file operation:

```json
{
  "type": "custom",
  "customType": "file_op",
  "data": {
    "toolCallId": "abc123",
    "path": "src/foo.ts",
    "op": "edit",
    "before": "sha256-hash...",
    "after": "sha256-hash...",
    "ts": 1234567890
  }
}
```

### `condensed`

Marks file operations as committed:

```json
{
  "type": "custom",
  "customType": "condensed",
  "data": {
    "commitHash": "git-commit-hash",
    "toolCallIds": ["abc123", "def456"],
    "ts": 1234567890
  }
}
```

## Storage

Blobs are stored alongside session files:

```
~/.pi/agent/sessions/<encoded-cwd>/
├── <session-id>.jsonl       # Session file
└── <session-id>-crumbs/     # Blobs for this session
    ├── <hash1>
    └── <hash2>
```

## API

```typescript
import { ObjectStore, generateDiff, sha256 } from '@ssweens/pi-crumbs';

// Create object store for a session
const store = new ObjectStore(sessionFilePath);

// Store content
await store.store(hash, content);

// Retrieve content
const content = await store.getAsString(hash);

// Generate diff
const diff = await generateDiff(store, path, beforeHash, afterHash, cwd);
```

## License

MIT
