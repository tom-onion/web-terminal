import { FileSystemItem, CommandResult } from './types';
import { getItemAtPath, resolvePath, createFile, createDirectory } from './fileSystem';

export const executeCommand = (
  command: string,
  args: string[],
  currentDir: string,
  fileSystem: Record<string, FileSystemItem>
): CommandResult => {
  switch (command) {
    case 'ls':
      return handleLs(args, currentDir, fileSystem);
    case 'cd':
      return handleCd(args, currentDir, fileSystem);
    case 'pwd':
      return { output: currentDir, exitCode: 0 };
    case 'cat':
      return handleCat(args, currentDir, fileSystem);
    case 'echo':
      return { output: args.join(' '), exitCode: 0 };
    case 'mkdir':
      return handleMkdir(args, currentDir, fileSystem);
    case 'touch':
      return handleTouch(args, currentDir, fileSystem);
    case 'whoami':
      return { output: 'user', exitCode: 0 };
    case 'date':
      return { output: new Date().toString(), exitCode: 0 };
    case 'clear':
      return { output: '__CLEAR__', exitCode: 0 };
    case 'help':
      return handleHelp();
    case 'uname':
      return handleUname(args);
    case 'history':
      return { output: 'Command history not available in this context', exitCode: 0 };
    case 'which':
      return handleWhich(args);
    case 'file':
      return handleFile(args, currentDir, fileSystem);
    case 'head':
      return handleHead(args, currentDir, fileSystem);
    case 'tail':
      return handleTail(args, currentDir, fileSystem);
    case 'wc':
      return handleWc(args, currentDir, fileSystem);
    case 'grep':
      return handleGrep(args, currentDir, fileSystem);
    
    // ===== CUSTOM COMMANDS =====
    case 'hello':
      return handleHello(args);
    case 'calc':
      return handleCalc(args);
    case 'weather':
      return handleWeather(args);
    case 'joke':
      return handleJoke();
    case 'cowsay':
      return handleCowsay(args);
    case 'fortune':
      return handleFortune();
    case 'matrix':
      return handleMatrix();
    case 'ascii':
      return handleAscii(args);
    case 'color':
      return handleColor(args);
    case 'timer':
      return handleTimer(args);
    
    default:
      return { output: '', error: `bash: ${command}: command not found`, exitCode: 127 };
  }
};

// ===== EXISTING COMMAND HANDLERS =====
const handleLs = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
  const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
  
  const targetPath = args.find(arg => !arg.startsWith('-')) || currentDir;
  const resolvedPath = resolvePath(currentDir, targetPath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `ls: cannot access '${targetPath}': No such file or directory`, exitCode: 2 };
  }
  
  if (item.type === 'file') {
    if (longFormat) {
      const date = item.modified.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      return { output: `${item.permissions} 1 ${item.owner} ${item.group} ${item.size.toString().padStart(8)} ${date} ${item.name}`, exitCode: 0 };
    } else {
      return { output: item.name, exitCode: 0 };
    }
  }
  
  if (!item.children) {
    return { output: '', exitCode: 0 };
  }
  
  let items = Object.values(item.children);
  if (!showAll) {
    items = items.filter(item => !item.name.startsWith('.'));
  }
  
  if (showAll && resolvedPath !== '/') {
    items = [
      { name: '.', type: 'directory' as const, permissions: 'drwxr-xr-x', owner: 'user', group: 'user', size: 4096, modified: new Date() },
      { name: '..', type: 'directory' as const, permissions: 'drwxr-xr-x', owner: 'user', group: 'user', size: 4096, modified: new Date() },
      ...items
    ];
  }
  
  if (longFormat) {
    const output = items.map(item => {
      const date = item.modified.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${item.permissions} 1 ${item.owner} ${item.group} ${item.size.toString().padStart(8)} ${date} ${item.name}`;
    }).join('\n');
    return { output, exitCode: 0 };
  } else {
    return { output: items.map(item => item.name).join('  '), exitCode: 0 };
  }
};

const handleCd = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  const targetPath = args[0] || '/home/user';
  const resolvedPath = resolvePath(currentDir, targetPath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `bash: cd: ${targetPath}: No such file or directory`, exitCode: 1 };
  }
  
  if (item.type !== 'directory') {
    return { output: '', error: `bash: cd: ${targetPath}: Not a directory`, exitCode: 1 };
  }
  
  return { output: `__CD__${resolvedPath}`, exitCode: 0 };
};

const handleCat = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'cat: missing file operand', exitCode: 1 };
  }
  
  const results: string[] = [];
  for (const filePath of args) {
    const resolvedPath = resolvePath(currentDir, filePath);
    const item = getItemAtPath(fileSystem, resolvedPath);
    
    if (!item) {
      return { output: '', error: `cat: ${filePath}: No such file or directory`, exitCode: 1 };
    }
    
    if (item.type !== 'file') {
      return { output: '', error: `cat: ${filePath}: Is a directory`, exitCode: 1 };
    }
    
    results.push(item.content || '');
  }
  
  return { output: results.join('\n'), exitCode: 0 };
};

const handleMkdir = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'mkdir: missing operand', exitCode: 1 };
  }
  
  for (const dirPath of args) {
    const resolvedPath = resolvePath(currentDir, dirPath);
    if (!createDirectory(fileSystem, resolvedPath)) {
      return { output: '', error: `mkdir: cannot create directory '${dirPath}': File exists or parent directory doesn't exist`, exitCode: 1 };
    }
  }
  
  return { output: '', exitCode: 0 };
};

const handleTouch = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'touch: missing file operand', exitCode: 1 };
  }
  
  for (const filePath of args) {
    const resolvedPath = resolvePath(currentDir, filePath);
    if (!createFile(fileSystem, resolvedPath)) {
      return { output: '', error: `touch: cannot touch '${filePath}': No such file or directory`, exitCode: 1 };
    }
  }
  
  return { output: '', exitCode: 0 };
};

const handleHelp = (): CommandResult => {
  const helpText = `Available commands:

BASIC COMMANDS:
ls [-l] [-a] [path]    - List directory contents
cd [path]              - Change directory
pwd                    - Print working directory
cat <file>             - Display file contents
echo <text>            - Display text
mkdir <dir>            - Create directory
touch <file>           - Create empty file
whoami                 - Display current user
date                   - Display current date and time
clear                  - Clear terminal screen

FILE OPERATIONS:
file <path>            - Determine file type
head [-n] <file>       - Display first lines of file
tail [-n] <file>       - Display last lines of file
wc <file>              - Word, line, character count
grep <pattern> <file>  - Search for pattern in file

SYSTEM INFO:
uname [-a]             - System information
which <command>        - Locate command
history                - Command history

CUSTOM COMMANDS:
hello [name]           - Greet someone
calc <expression>      - Simple calculator
weather [city]         - Get weather info
joke                   - Tell a random joke
cowsay <message>       - ASCII cow says message
fortune                - Random fortune cookie
matrix                 - Matrix-style animation
ascii <text>           - Convert text to ASCII art
color <color>          - Change terminal color theme
timer <seconds>        - Start a countdown timer

Use Tab for command completion and arrow keys for history navigation.`;
  
  return { output: helpText, exitCode: 0 };
};

const handleUname = (args: string[]): CommandResult => {
  if (args.includes('-a')) {
    return { output: 'Linux webterminal 5.15.0 #1 SMP Web Terminal Simulator x86_64 GNU/Linux', exitCode: 0 };
  }
  return { output: 'Linux', exitCode: 0 };
};

const handleWhich = (args: string[]): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'which: missing argument', exitCode: 1 };
  }
  
  const commands = [
    'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'whoami', 'date', 'clear', 
    'help', 'uname', 'which', 'file', 'head', 'tail', 'wc', 'grep',
    'hello', 'calc', 'weather', 'joke', 'cowsay', 'fortune', 'matrix', 'ascii', 'color', 'timer'
  ];
  const command = args[0];
  
  if (commands.includes(command)) {
    return { output: `/bin/${command}`, exitCode: 0 };
  }
  
  return { output: '', error: `which: no ${command} in (/bin:/usr/bin)`, exitCode: 1 };
};

const handleFile = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'file: missing file operand', exitCode: 1 };
  }
  
  const results: string[] = [];
  for (const filePath of args) {
    const resolvedPath = resolvePath(currentDir, filePath);
    const item = getItemAtPath(fileSystem, resolvedPath);
    
    if (!item) {
      results.push(`${filePath}: cannot open (No such file or directory)`);
    } else if (item.type === 'directory') {
      results.push(`${filePath}: directory`);
    } else {
      const extension = item.name.split('.').pop()?.toLowerCase();
      let type = 'ASCII text';
      if (extension === 'md') type = 'ASCII text (Markdown)';
      else if (extension === 'sh') type = 'Bourne-Again shell script';
      else if (extension === 'txt') type = 'ASCII text';
      results.push(`${filePath}: ${type}`);
    }
  }
  
  return { output: results.join('\n'), exitCode: 0 };
};

const handleHead = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  let lines = 10;
  let fileArgs = args;
  
  if (args[0] === '-n' && args[1]) {
    lines = parseInt(args[1]) || 10;
    fileArgs = args.slice(2);
  }
  
  if (fileArgs.length === 0) {
    return { output: '', error: 'head: missing file operand', exitCode: 1 };
  }
  
  const filePath = fileArgs[0];
  const resolvedPath = resolvePath(currentDir, filePath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `head: ${filePath}: No such file or directory`, exitCode: 1 };
  }
  
  if (item.type !== 'file') {
    return { output: '', error: `head: ${filePath}: Is a directory`, exitCode: 1 };
  }
  
  const content = item.content || '';
  const contentLines = content.split('\n');
  const output = contentLines.slice(0, lines).join('\n');
  
  return { output, exitCode: 0 };
};

const handleTail = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  let lines = 10;
  let fileArgs = args;
  
  if (args[0] === '-n' && args[1]) {
    lines = parseInt(args[1]) || 10;
    fileArgs = args.slice(2);
  }
  
  if (fileArgs.length === 0) {
    return { output: '', error: 'tail: missing file operand', exitCode: 1 };
  }
  
  const filePath = fileArgs[0];
  const resolvedPath = resolvePath(currentDir, filePath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `tail: ${filePath}: No such file or directory`, exitCode: 1 };
  }
  
  if (item.type !== 'file') {
    return { output: '', error: `tail: ${filePath}: Is a directory`, exitCode: 1 };
  }
  
  const content = item.content || '';
  const contentLines = content.split('\n');
  const output = contentLines.slice(-lines).join('\n');
  
  return { output, exitCode: 0 };
};

const handleWc = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'wc: missing file operand', exitCode: 1 };
  }
  
  const filePath = args[0];
  const resolvedPath = resolvePath(currentDir, filePath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `wc: ${filePath}: No such file or directory`, exitCode: 1 };
  }
  
  if (item.type !== 'file') {
    return { output: '', error: `wc: ${filePath}: Is a directory`, exitCode: 1 };
  }
  
  const content = item.content || '';
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const chars = content.length;
  
  return { output: `${lines.toString().padStart(8)} ${words.toString().padStart(7)} ${chars.toString().padStart(7)} ${filePath}`, exitCode: 0 };
};

const handleGrep = (args: string[], currentDir: string, fileSystem: Record<string, FileSystemItem>): CommandResult => {
  if (args.length < 2) {
    return { output: '', error: 'grep: missing pattern or file operand', exitCode: 1 };
  }
  
  const pattern = args[0];
  const filePath = args[1];
  const resolvedPath = resolvePath(currentDir, filePath);
  const item = getItemAtPath(fileSystem, resolvedPath);
  
  if (!item) {
    return { output: '', error: `grep: ${filePath}: No such file or directory`, exitCode: 1 };
  }
  
  if (item.type !== 'file') {
    return { output: '', error: `grep: ${filePath}: Is a directory`, exitCode: 1 };
  }
  
  const content = item.content || '';
  const lines = content.split('\n');
  const matchingLines = lines.filter(line => line.includes(pattern));
  
  return { output: matchingLines.join('\n'), exitCode: matchingLines.length > 0 ? 0 : 1 };
};

// ===== CUSTOM COMMAND HANDLERS =====

const handleHello = (args: string[]): CommandResult => {
  const name = args.length > 0 ? args.join(' ') : 'World';
  const greetings = [
    `Hello, ${name}! 👋`,
    `Hi there, ${name}! Welcome to the terminal!`,
    `Greetings, ${name}! How can I help you today?`,
    `Hey ${name}! Nice to see you here!`,
    `Hello ${name}! Ready to explore the terminal?`
  ];
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  return { output: greeting, exitCode: 0 };
};

const handleCalc = (args: string[]): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'calc: missing expression', exitCode: 1 };
  }
  
  const expression = args.join(' ');
  
  try {
    // Simple calculator - only allow basic math operations for security
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
    if (sanitized !== expression) {
      return { output: '', error: 'calc: invalid characters in expression', exitCode: 1 };
    }
    
    const result = Function(`"use strict"; return (${sanitized})`)();
    return { output: `${expression} = ${result}`, exitCode: 0 };
  } catch (error) {
    return { output: '', error: 'calc: invalid expression', exitCode: 1 };
  }
};

const handleWeather = (args: string[]): CommandResult => {
  const city = args.length > 0 ? args.join(' ') : 'Unknown Location';
  
  const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Partly Cloudy', 'Stormy'];
  const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temp = Math.floor(Math.random() * 35) + 5; // 5-40°C
  const humidity = Math.floor(Math.random() * 60) + 30; // 30-90%
  
  const output = `Weather for ${city}:
┌─────────────────────────┐
│ Condition: ${condition.padEnd(12)} │
│ Temperature: ${temp}°C${' '.repeat(7 - temp.toString().length)} │
│ Humidity: ${humidity}%${' '.repeat(9 - humidity.toString().length)} │
└─────────────────────────┘

Note: This is simulated weather data!`;
  
  return { output, exitCode: 0 };
};

const handleJoke = (): CommandResult => {
  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the programmer quit his job? He didn't get arrays!",
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
    "Why did the developer go broke? Because he used up all his cache!",
    "What's a computer's favorite snack? Microchips!",
    "Why don't keyboards sleep? They have two shifts!",
    "What do you call a programmer from Finland? Nerdic!",
    "Why did the computer go to the doctor? It had a virus!",
    "What's the object-oriented way to become wealthy? Inheritance!"
  ];
  
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  return { output: joke, exitCode: 0 };
};

const handleCowsay = (args: string[]): CommandResult => {
  const message = args.length > 0 ? args.join(' ') : 'Hello from the terminal!';
  const messageLength = message.length;
  const border = '-'.repeat(messageLength + 2);
  
  const cow = `
 ${border}
< ${message} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
  
  return { output: cow, exitCode: 0 };
};

const handleFortune = (): CommandResult => {
  const fortunes = [
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your future is created by what you do today, not tomorrow.",
    "The only way to do great work is to love what you do.",
    "Innovation distinguishes between a leader and a follower.",
    "Code is like humor. When you have to explain it, it's bad.",
    "First, solve the problem. Then, write the code.",
    "Experience is the name everyone gives to their mistakes.",
    "The best error message is the one that never shows up.",
    "Simplicity is the ultimate sophistication.",
    "Programs must be written for people to read, and only incidentally for machines to execute."
  ];
  
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  return { output: `🔮 Fortune Cookie:\n\n"${fortune}"`, exitCode: 0 };
};

const handleMatrix = (): CommandResult => {
  const matrix = `
    ╔══════════════════════════════════════╗
    ║  ░▒▓█ MATRIX MODE ACTIVATED █▓▒░     ║
    ╠══════════════════════════════════════╣
    ║  01001000 01100101 01101100 01101100 ║
    ║  01101111 00100000 01001101 01100001 ║
    ║  01110100 01110010 01101001 01111000 ║
    ║  00100001 00001010 01010111 01100101 ║
    ║  01101100 01100011 01101111 01101101 ║
    ║  01100101 00100000 01110100 01101111 ║
    ║  00100000 01110100 01101000 01100101 ║
    ║  00100000 01010010 01100101 01100001 ║
    ║  01101100 00100000 01010111 01101111 ║
    ║  01110010 01101100 01100100 00100001 ║
    ╚══════════════════════════════════════╝
    
    Decoding... "Hello Matrix! Welcome to the Real World!"`;
  
  return { output: matrix, exitCode: 0 };
};

const handleAscii = (args: string[]): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'ascii: missing text argument', exitCode: 1 };
  }
  
  const text = args.join(' ').toUpperCase();
  const asciiArt = text.split('').map(char => {
    switch (char) {
      case 'A': return '  ▄▀█  \n █▄▄█▄ \n █   █ ';
      case 'B': return ' ████  \n █▄▄█  \n █▄▄▄█ ';
      case 'C': return '  ▄▄▄█ \n █     \n  ▀▀▀█ ';
      case 'D': return ' ████  \n █   █ \n █▄▄▄█ ';
      case 'E': return ' █████ \n █▄▄▄  \n █▄▄▄▄ ';
      case 'H': return ' █   █ \n █████ \n █   █ ';
      case 'I': return ' ████  \n  ██   \n ████  ';
      case 'L': return ' █     \n █     \n █████ ';
      case 'O': return '  ███  \n █   █ \n  ███  ';
      case ' ': return '       \n       \n       ';
      default: return '  ▄▄▄  \n █▄▄▄█ \n █   █ ';
    }
  });
  
  if (asciiArt.length === 0) {
    return { output: 'No ASCII art available for this text', exitCode: 0 };
  }
  
  const lines = ['', '', ''];
  asciiArt.forEach(art => {
    const artLines = art.split('\n');
    lines[0] += artLines[0] + ' ';
    lines[1] += artLines[1] + ' ';
    lines[2] += artLines[2] + ' ';
  });
  
  return { output: lines.join('\n'), exitCode: 0 };
};

const handleColor = (args: string[]): CommandResult => {
  if (args.length === 0) {
    return { 
      output: `Available color themes:
- green (default)
- blue
- red
- purple
- orange
- cyan

Usage: color <theme-name>`, 
      exitCode: 0 
    };
  }
  
  const theme = args[0].toLowerCase();
  const themes = {
    green: '🟢 Green theme activated! (Classic terminal look)',
    blue: '🔵 Blue theme activated! (Ocean vibes)',
    red: '🔴 Red theme activated! (Warning mode)',
    purple: '🟣 Purple theme activated! (Royal style)',
    orange: '🟠 Orange theme activated! (Sunset mode)',
    cyan: '🔵 Cyan theme activated! (Ice cool)'
  };
  
  if (themes[theme as keyof typeof themes]) {
    return { output: themes[theme as keyof typeof themes], exitCode: 0 };
  } else {
    return { output: '', error: `color: unknown theme '${theme}'`, exitCode: 1 };
  }
};

const handleTimer = (args: string[]): CommandResult => {
  if (args.length === 0) {
    return { output: '', error: 'timer: missing seconds argument', exitCode: 1 };
  }
  
  const seconds = parseInt(args[0]);
  if (isNaN(seconds) || seconds <= 0) {
    return { output: '', error: 'timer: invalid number of seconds', exitCode: 1 };
  }
  
  const output = `⏰ Timer started for ${seconds} seconds!

    ╔════════════════════════╗
    ║     TIMER ACTIVE       ║
    ║                        ║
    ║    ${seconds.toString().padStart(3)} seconds         ║
    ║                        ║
    ║  ⏰ ⏰ ⏰ ⏰ ⏰ ⏰ ⏰  ║
    ╚════════════════════════╝

Note: This is a visual timer. In a real terminal, 
this would count down and notify you when complete!`;
  
  return { output, exitCode: 0 };
};