import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { generateAdvisorResponse } from '../../lib/ai-engine';
import { usersApi } from '../../lib/api';

const quickQuestions = [
  { label: 'How am I doing?', icon: '📊', q: 'How am I doing this month?' },
  { label: 'Top spending', icon: '💸', q: 'Where am I spending the most?' },
  { label: 'Goals forecast', icon: '🎯', q: 'How long until I reach my goals?' },
  { label: 'Tips for me', icon: '💡', q: 'Give me personalized tips' },
];

const typeIcons = {
  greeting: <Bot className="w-4 h-4" />,
  analysis: <BarChart3 className="w-4 h-4" />,
  forecast: <TrendingUp className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
  help: <Sparkles className="w-4 h-4" />,
};

export default function AIAdvisor({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! 👋 I'm your AI Financial Advisor. Ask me anything about your finances, spending patterns, or goals!", type: 'greeting' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: stats } = useQuery({
    queryKey: ['finara-stats'],
    queryFn: usersApi.finaraStats,
    enabled: isOpen,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (text = input) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay for realism
    setTimeout(() => {
      const response = generateAdvisorResponse(text, stats);
      setMessages(prev => [...prev, { role: 'ai', text: response.text, type: response.type }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-[61] bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-bold">AI Financial Advisor</h2>
                <p className="text-white/70 text-xs">Powered by on-device intelligence</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      {typeIcons[msg.type] || <Bot className="w-4 h-4 text-indigo-600" />}
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md'
                    }`}
                  >
                    {msg.text.split('\n').map((line, j) => {
                      // Simple markdown-like bold
                      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <p key={j} className={j > 0 ? 'mt-1.5' : ''} dangerouslySetInnerHTML={{ __html: formatted }} />
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-slate-400 mb-2">Quick questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map(qq => (
                    <button
                      key={qq.label}
                      onClick={() => handleSend(qq.q)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 transition-all text-left"
                    >
                      <span>{qq.icon}</span>
                      <span>{qq.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your finances..."
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">AI runs locally — your data never leaves this device</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
