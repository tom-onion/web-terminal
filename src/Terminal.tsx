import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as TerminalIcon, Copy, Download } from 'lucide-react';
import { TerminalState, TerminalOutput } from './types';
import { createInitialFileSystem } from './fileSystem';
import { executeCommand } from './commands';
import { parseCommand, formatPrompt, getCommandSuggestions, generateId } from './utils';

const Terminal: React.FC = () => {
  const [state, setState] = useState<TerminalState>(() => ({
    currentDirectory: '/home/user',
    history: [],
    historyIndex: -1,
    output: [
      {
        id: generateId(),
        type: 'output',
        content: 'Welcome to Web Terminal v1.0.0\nType "help" to see available commands.\n',
        timestamp: new Date(),
      }
    ],
    fileSystem: createInitialFileSystem(),
  }));

  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.output]);

  // Focus input on mount and clicks
  useEffect(() => {
    const handleClick = () => inputRef.current?.focus();
    document.addEventListener('click', handleClick);
    inputRef.current?.focus();
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Handle tab completion
  const handleTabCompletion = useCallback(() => {
    if (suggestions.length === 0) return;
    
    if (suggestions.length === 1) {
      setCurrentInput(suggestions[0] + ' ');
      setSuggestions([]);
      setSelectedSuggestion(-1);
    } else if (selectedSuggestion >= 0) {
      setCurrentInput(suggestions[selectedSuggestion] + ' ');
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
  }, [suggestions, selectedSuggestion]);

  // Handle command execution
  const executeCurrentCommand = useCallback(() => {
    if (!currentInput.trim()) return;

    const { command, args } = parseCommand(currentInput);
    const prompt = formatPrompt(state.currentDirectory);
    
    // Add command to output
    const commandOutput: TerminalOutput = {
      id: generateId(),
      type: 'command',
      content: prompt + currentInput,
      timestamp: new Date(),
    };

    // Add to history and reset history index
    const newHistory = [...state.history, currentInput];
    setHistoryIndex(-1);

    setState(prevState => ({
      ...prevState,
      output: [...prevState.output, commandOutput],
      history: newHistory,
    }));

    // Execute command
    const result = executeCommand(command, args, state.currentDirectory, state.fileSystem);
    
    // Handle special commands
    if (result.output === '__CLEAR__') {
      setState(prevState => ({
        ...prevState,
        output: [],
      }));
    } else if (result.output.startsWith('__CD__')) {
      const newDir = result.output.substring(6);
      setState(prevState => ({
        ...prevState,
        currentDirectory: newDir,
      }));
    } else {
      // Add result to output
      if (result.output) {
        const resultOutput: TerminalOutput = {
          id: generateId(),
          type: 'output',
          content: result.output,
          timestamp: new Date(),
        };
        setState(prevState => ({
          ...prevState,
          output: [...prevState.output, resultOutput],
        }));
      }
      
      if (result.error) {
        const errorOutput: TerminalOutput = {
          id: generateId(),
          type: 'error',
          content: result.error,
          timestamp: new Date(),
        };
        setState(prevState => ({
          ...prevState,
          output: [...prevState.output, errorOutput],
        }));
      }
    }

    setCurrentInput('');
    setSuggestions([]);
    setSelectedSuggestion(-1);
  }, [currentInput, state.currentDirectory, state.fileSystem, state.history]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);
    
    // Reset history index when user types
    setHistoryIndex(-1);
    
    const { command } = parseCommand(value);
    if (command && !value.includes(' ')) {
      const newSuggestions = getCommandSuggestions(command);
      setSuggestions(newSuggestions);
      setSelectedSuggestion(-1);
    } else {
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        executeCurrentCommand();
        break;
        
      case 'Tab':
        e.preventDefault();
        handleTabCompletion();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev <= 0 ? suggestions.length - 1 : prev - 1
          );
        } else if (state.history.length > 0) {
          const newIndex = historyIndex === -1 
            ? state.history.length - 1 
            : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(state.history[newIndex] || '');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev >= suggestions.length - 1 ? 0 : prev + 1
          );
        } else if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= state.history.length) {
            setHistoryIndex(-1);
            setCurrentInput('');
          } else {
            setHistoryIndex(newIndex);
            setCurrentInput(state.history[newIndex]);
          }
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowRight':
        // Allow default behavior for cursor movement within input
        break;
        
      case 'Escape':
        e.preventDefault();
        setSuggestions([]);
        setSelectedSuggestion(-1);
        setHistoryIndex(-1);
        break;
        
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          setCurrentInput('');
          setSuggestions([]);
          setSelectedSuggestion(-1);
          setHistoryIndex(-1);
        }
        break;
        
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          setState(prev => ({ ...prev, output: [] }));
        }
        break;
    }
  };

  // Copy terminal content
  const copyContent = () => {
    const content = state.output.map(item => item.content).join('\n');
    navigator.clipboard.writeText(content);
  };

  // Export terminal session
  const exportSession = () => {
    const content = state.output.map(item => 
      `[${item.timestamp.toISOString()}] ${item.type.toUpperCase()}: ${item.content}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-gray-900 text-green-400 font-mono flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TerminalIcon size={20} />
          <span className="text-gray-300 font-semibold">Web Terminal</span>
          <span className="text-gray-500 text-sm">v1.0.0</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyContent}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Copy terminal content"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={exportSession}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Export session"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 bg-black"
        style={{ 
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {/* Output */}
        {state.output.map((item) => (
          <div key={item.id} className="mb-1">
            <pre className={`whitespace-pre-wrap break-words ${
              item.type === 'error' ? 'text-red-400' : 
              item.type === 'command' ? 'text-white' : 'text-green-400'
            }`}>
              {item.content}
            </pre>
          </div>
        ))}

        {/* Current Input Line */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">
            {formatPrompt(state.currentDirectory)}
          </span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-green-400 w-full"
              style={{ caretColor: 'transparent' }}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="absolute left-0 top-0 pointer-events-none">
              {currentInput}
              <span className={`${showCursor ? 'bg-green-400' : 'bg-transparent'} text-black`}>
                _
              </span>
            </span>
          </div>
        </div>

        {/* Tab Completion Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 bg-gray-800 border border-gray-700 rounded p-2">
            <div className="text-gray-400 text-xs mb-1">Suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <span
                  key={suggestion}
                  className={`px-2 py-1 rounded text-xs ${
                    index === selectedSuggestion 
                      ? 'bg-green-600 text-black' 
                      : 'bg-gray-700 text-green-400'
                  }`}
                >
                  {suggestion}
                </span>
              ))}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Press Tab to complete, ↑↓ to navigate
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 text-xs text-gray-400 flex justify-between">
        <span>Current Directory: {state.currentDirectory}</span>
        <span>Commands: {state.history.length} | Press Ctrl+L to clear | ↑↓ for history</span>
      </div>
    </div>
  );
};

export default Terminal;