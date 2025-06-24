export interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: Record<string, FileSystemItem>;
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modified: Date;
}

export interface TerminalState {
  currentDirectory: string;
  history: string[];
  historyIndex: number;
  output: TerminalOutput[];
  fileSystem: Record<string, FileSystemItem>;
}

export interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}