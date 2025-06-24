import { FileSystemItem } from './types';

export const createInitialFileSystem = (): Record<string, FileSystemItem> => {
  const now = new Date();
  
  return {
    '/': {
      name: '/',
      type: 'directory',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      modified: now,
      children: {
        'home': {
          name: 'home',
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          modified: now,
          children: {
            'user': {
              name: 'user',
              type: 'directory',
              permissions: 'drwxr-xr-x',
              owner: 'user',
              group: 'user',
              size: 4096,
              modified: now,
              children: {
                'documents': {
                  name: 'documents',
                  type: 'directory',
                  permissions: 'drwxr-xr-x',
                  owner: 'user',
                  group: 'user',
                  size: 4096,
                  modified: now,
                  children: {
                    'readme.txt': {
                      name: 'readme.txt',
                      type: 'file',
                      content: 'Welcome to the Web Terminal!\n\nThis is a simulated Linux environment.\nTry commands like: ls, cd, pwd, cat, mkdir, touch, echo\n\nHave fun exploring!',
                      permissions: '-rw-r--r--',
                      owner: 'user',
                      group: 'user',
                      size: 142,
                      modified: now,
                    },
                    'project.md': {
                      name: 'project.md',
                      type: 'file',
                      content: '# My Project\n\nThis is a markdown file with project documentation.\n\n## Features\n- Terminal simulation\n- File system operations\n- Command history\n\n## Usage\nUse standard Linux commands to navigate and interact with the file system.',
                      permissions: '-rw-r--r--',
                      owner: 'user',
                      group: 'user',
                      size: 203,
                      modified: now,
                    }
                  }
                },
                'scripts': {
                  name: 'scripts',
                  type: 'directory',
                  permissions: 'drwxr-xr-x',
                  owner: 'user',
                  group: 'user',
                  size: 4096,
                  modified: now,
                  children: {
                    'hello.sh': {
                      name: 'hello.sh',
                      type: 'file',
                      content: '#!/bin/bash\necho "Hello, World!"\necho "Welcome to the terminal simulator!"',
                      permissions: '-rwxr-xr-x',
                      owner: 'user',
                      group: 'user',
                      size: 75,
                      modified: now,
                    }
                  }
                }
              }
            }
          }
        },
        'etc': {
          name: 'etc',
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          modified: now,
          children: {
            'hosts': {
              name: 'hosts',
              type: 'file',
              content: '127.0.0.1\tlocalhost\n::1\t\tlocalhost ip6-localhost ip6-loopback\n',
              permissions: '-rw-r--r--',
              owner: 'root',
              group: 'root',
              size: 67,
              modified: now,
            }
          }
        },
        'var': {
          name: 'var',
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          modified: now,
          children: {
            'log': {
              name: 'log',
              type: 'directory',
              permissions: 'drwxr-xr-x',
              owner: 'root',
              group: 'root',
              size: 4096,
              modified: now,
              children: {}
            }
          }
        }
      }
    }
  };
};

export const getItemAtPath = (fileSystem: Record<string, FileSystemItem>, path: string): FileSystemItem | null => {
  if (path === '/') return fileSystem['/'];
  
  const parts = path.split('/').filter(Boolean);
  let current = fileSystem['/'];
  
  for (const part of parts) {
    if (!current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  
  return current;
};

export const resolvePath = (currentDir: string, path: string): string => {
  if (path.startsWith('/')) {
    return path === '/' ? '/' : path.replace(/\/$/, '');
  }
  
  if (path === '.') return currentDir;
  if (path === '..') {
    const parts = currentDir.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  }
  
  const parts = path.split('/');
  let resolvedParts = currentDir === '/' ? [] : currentDir.split('/').filter(Boolean);
  
  for (const part of parts) {
    if (part === '..') {
      resolvedParts.pop();
    } else if (part !== '.' && part !== '') {
      resolvedParts.push(part);
    }
  }
  
  return resolvedParts.length === 0 ? '/' : '/' + resolvedParts.join('/');
};

export const createFile = (fileSystem: Record<string, FileSystemItem>, path: string, content: string = ''): boolean => {
  const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
  const fileName = path.substring(path.lastIndexOf('/') + 1);
  
  const parent = getItemAtPath(fileSystem, parentPath);
  if (!parent || parent.type !== 'directory' || !parent.children) {
    return false;
  }
  
  parent.children[fileName] = {
    name: fileName,
    type: 'file',
    content: content,
    permissions: '-rw-r--r--',
    owner: 'user',
    group: 'user',
    size: content.length,
    modified: new Date(),
  };
  
  return true;
};

export const createDirectory = (fileSystem: Record<string, FileSystemItem>, path: string): boolean => {
  const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
  const dirName = path.substring(path.lastIndexOf('/') + 1);
  
  const parent = getItemAtPath(fileSystem, parentPath);
  if (!parent || parent.type !== 'directory' || !parent.children) {
    return false;
  }
  
  parent.children[dirName] = {
    name: dirName,
    type: 'directory',
    permissions: 'drwxr-xr-x',
    owner: 'user',
    group: 'user',
    size: 4096,
    modified: new Date(),
    children: {},
  };
  
  return true;
};