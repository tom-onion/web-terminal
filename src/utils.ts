export const parseCommand = (input: string): { command: string; args: string[] } => {
  const trimmed = input.trim();
  if (!trimmed) return { command: '', args: [] };
  
  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  return { command, args };
};

export const formatPrompt = (currentDir: string): string => {
  const user = 'user';
  const hostname = 'webterminal';
  const displayDir = currentDir === '/home/user' ? '~' : currentDir;
  
  return `${user}@${hostname}:${displayDir}$ `;
};

export const getCommandSuggestions = (input: string): string[] => {
  const commands = [
    // Basic commands
    'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'whoami', 'date', 
    'clear', 'help', 'uname', 'which', 'file', 'head', 'tail', 'wc', 'grep',
    // Custom commands
    'hello', 'calc', 'weather', 'joke', 'cowsay', 'fortune', 'matrix', 'ascii', 'color', 'timer'
  ];
  
  if (!input) return commands;
  
  return commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};