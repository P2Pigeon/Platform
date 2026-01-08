/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file ChatPanel.tsx
 * @description A panel for displaying chat messages and sending new ones.
 * Includes AI commands: /help, /tldr, /ai, /image
 * Fetches latest OpenRouter models dynamically with ping/pong connection test
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Settings, Loader2, Bot, HelpCircle, RefreshCw, Zap, CheckCircle, XCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';

interface Message {
  sender: string;
  message: string;
  isMe: boolean;
  isAI?: boolean;
  isLoading?: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  hasOtherPanel?: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  latency?: number;
  status?: 'testing' | 'online' | 'offline';
}

// Fallback models if API fetch fails
const FALLBACK_MODELS: OpenRouterModel[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large' },
  { id: 'cohere/command-r-plus', name: 'Command R+' },
];

// Top models to prioritize (latest/best)
const TOP_MODEL_IDS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini', 
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-72b-instruct',
  'mistralai/mistral-large-2411',
  'cohere/command-r-plus',
  'x-ai/grok-2-1212',
  'perplexity/llama-3.1-sonar-huge-128k-online',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'amazon/nova-pro-v1',
];

const HELP_TEXT = `**Available Commands:**
• **/help** - Show this help message
• **/tldr [n]** - Summarize the last n messages (default: 10)
• **/ai [prompt]** - Ask the AI a question
• **/image [prompt]** - Generate an image (coming soon)
• **/ping** - Test connection to selected model

**Settings:** Click the ⚙️ icon to configure your OpenRouter API key and select a model.`;

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, hasOtherPanel = false }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'Alice', message: 'Hey everyone!', isMe: false },
    { sender: 'You', message: 'Hello!', isMe: true },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('openrouter_model') || 'openai/gpt-4o-mini');
  const [isProcessing, setIsProcessing] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>(FALLBACK_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ latency: number; status: 'success' | 'error'; message?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch models from OpenRouter API
  const fetchModels = useCallback(async () => {
    if (!apiKey) return;
    
    setIsLoadingModels(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const allModels = data.data || [];
        
        // Filter to top models and sort by priority
        const topModels: OpenRouterModel[] = [];
        for (const modelId of TOP_MODEL_IDS) {
          const found = allModels.find((m: any) => m.id === modelId);
          if (found) {
            topModels.push({
              id: found.id,
              name: found.name || found.id.split('/').pop(),
              status: 'online',
            });
          }
        }
        
        // Add any remaining popular models not in our list
        if (topModels.length < 15) {
          const remaining = allModels
            .filter((m: any) => !TOP_MODEL_IDS.includes(m.id))
            .slice(0, 15 - topModels.length)
            .map((m: any) => ({
              id: m.id,
              name: m.name || m.id.split('/').pop(),
              status: 'online' as const,
            }));
          topModels.push(...remaining);
        }
        
        setModels(topModels.length > 0 ? topModels : FALLBACK_MODELS);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiKey]);

  // Ping/pong test to selected model
  const pingModel = useCallback(async () => {
    if (!apiKey) {
      setPingResult({ latency: 0, status: 'error', message: 'No API key configured' });
      return;
    }
    
    setIsPinging(true);
    setPingResult(null);
    const startTime = performance.now();
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      if (response.ok) {
        const data = await response.json();
        const pong = data.choices?.[0]?.message?.content || 'pong';
        setPingResult({ latency, status: 'success', message: pong });
      } else {
        const error = await response.json();
        setPingResult({ latency, status: 'error', message: error.error?.message || 'Connection failed' });
      }
    } catch (error) {
      setPingResult({ latency: 0, status: 'error', message: error instanceof Error ? error.message : 'Network error' });
    } finally {
      setIsPinging(false);
    }
  }, [apiKey, selectedModel]);

  // Fetch models when API key changes
  useEffect(() => {
    if (apiKey && showSettings) {
      fetchModels();
    }
  }, [apiKey, showSettings, fetchModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveSettings = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    localStorage.setItem('openrouter_model', selectedModel);
    setShowSettings(false);
  };

  const callOpenRouter = async (prompt: string, systemPrompt?: string): Promise<string> => {
    if (!apiKey) {
      return '⚠️ Please configure your OpenRouter API key in settings (⚙️ icon).';
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return `⚠️ API Error: ${error.error?.message || 'Unknown error'}`;
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI.';
    } catch (error) {
      return `⚠️ Error: ${error instanceof Error ? error.message : 'Failed to connect to OpenRouter'}`;
    }
  };

  const processCommand = async (input: string) => {
    const trimmed = input.trim();
    
    if (trimmed.startsWith('/help')) {
      return { isCommand: true, response: HELP_TEXT };
    }
    
    if (trimmed.startsWith('/tldr')) {
      const match = trimmed.match(/\/tldr\s*(\d*)/);
      const count = parseInt(match?.[1] || '10', 10);
      const recentMessages = messages.slice(-count).map(m => `${m.sender}: ${m.message}`).join('\n');
      
      if (recentMessages.length === 0) {
        return { isCommand: true, response: 'No messages to summarize.' };
      }
      
      const summary = await callOpenRouter(
        `Summarize these chat messages concisely:\n\n${recentMessages}`,
        'You are a helpful assistant that summarizes chat conversations. Be brief and highlight key points.'
      );
      return { isCommand: true, response: `📝 **Summary of last ${count} messages:**\n${summary}` };
    }
    
    if (trimmed.startsWith('/ai ')) {
      const prompt = trimmed.slice(4).trim();
      if (!prompt) {
        return { isCommand: true, response: '⚠️ Please provide a prompt. Usage: /ai [your question]' };
      }
      const response = await callOpenRouter(prompt);
      return { isCommand: true, response };
    }
    
    if (trimmed.startsWith('/image ')) {
      return { isCommand: true, response: '🖼️ Image generation coming soon! This feature will use DALL-E or Stable Diffusion.' };
    }
    
    if (trimmed === '/ping') {
      if (!apiKey) {
        return { isCommand: true, response: '⚠️ Please configure your OpenRouter API key first.' };
      }
      
      const startTime = performance.now();
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Reply with only the word "pong"' }],
            max_tokens: 10,
          }),
        });
        
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        if (response.ok) {
          const data = await response.json();
          const pong = data.choices?.[0]?.message?.content || 'pong';
          const modelName = models.find(m => m.id === selectedModel)?.name || selectedModel;
          return { isCommand: true, response: `🏓 **Ping Test**\n• Model: ${modelName}\n• Response: "${pong.trim()}"\n• Latency: ${latency}ms\n• Status: ✅ Online` };
        } else {
          const error = await response.json();
          return { isCommand: true, response: `🏓 **Ping Test Failed**\n• Model: ${selectedModel}\n• Error: ${error.error?.message || 'Unknown error'}\n• Status: ❌ Offline` };
        }
      } catch (error) {
        return { isCommand: true, response: `🏓 **Ping Test Failed**\n• Error: ${error instanceof Error ? error.message : 'Network error'}\n• Status: ❌ Offline` };
      }
    }
    
    return { isCommand: false, response: '' };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isProcessing) return;
    
    const userMessage = newMessage.trim();
    setNewMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'You', message: userMessage, isMe: true }]);
    
    // Check for commands
    if (userMessage.startsWith('/')) {
      setIsProcessing(true);
      
      // Add loading message
      setMessages(prev => [...prev, { sender: 'AI', message: 'Processing...', isMe: false, isAI: true, isLoading: true }]);
      
      const result = await processCommand(userMessage);
      
      if (result.isCommand) {
        // Replace loading message with response
        setMessages(prev => {
          const newMessages = prev.slice(0, -1);
          return [...newMessages, { sender: 'AI', message: result.response, isMe: false, isAI: true }];
        });
      }
      
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Position: on desktop with other panel open, shift left; on mobile, full width overlay
  const positionClass = hasOtherPanel 
    ? 'md:right-[calc(18rem+8px)]' // 18rem = w-72 participants panel + gap
    : 'right-0';

  return (
    <div className={`absolute top-0 ${positionClass} w-full md:w-[320px] h-full bg-gray-900 md:rounded-xl shadow-2xl flex flex-col z-30 border-l md:border border-gray-700/50`}>
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Chat</h2>
          <button 
            onClick={() => processCommand('/help').then(r => {
              if (r.isCommand) {
                setMessages(prev => [...prev, { sender: 'AI', message: r.response, isMe: false, isAI: true }]);
              }
            })}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-cyan-400"
            title="Show help"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button 
            aria-label="Settings" 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-1.5 rounded hover:bg-gray-700 ${showSettings ? 'text-cyan-400 bg-gray-700' : 'text-gray-400'}`}
          >
            <Settings size={16} />
          </button>
          <button aria-label="Close chat" onClick={onClose} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-gray-700/50 bg-gray-800/50 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">OpenRouter API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">Model</label>
              <button
                onClick={fetchModels}
                disabled={isLoadingModels || !apiKey}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 disabled:text-gray-500"
                title="Refresh models"
              >
                <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                {isLoadingModels ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setPingResult(null); }}
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          
          {/* Ping Test */}
          <div className="flex items-center gap-2">
            <button
              onClick={pingModel}
              disabled={isPinging || !apiKey}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {isPinging ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {isPinging ? 'Testing...' : 'Ping Model'}
            </button>
            {pingResult && (
              <div className={`flex items-center gap-1 text-xs ${pingResult.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {pingResult.status === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                <span>{pingResult.latency}ms</span>
              </div>
            )}
          </div>
          
          <button
            onClick={saveSettings}
            className="w-full py-1.5 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700"
          >
            Save Settings
          </button>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              msg.isAI 
                ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                : msg.isMe 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
            }`}>
              {!msg.isMe && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  {msg.isAI && <Bot size={12} />}
                  {msg.sender}
                </div>
              )}
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.message}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-gray-700/50">
        <input
          placeholder="Message or /command..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isProcessing}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button 
          aria-label="Send message" 
          onClick={handleSendMessage} 
          disabled={isProcessing}
          className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
