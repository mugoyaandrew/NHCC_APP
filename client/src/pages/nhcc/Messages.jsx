import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Mail } from 'lucide-react';
import { messagesApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

export default function Messages() {
  const { formatDate } = useSettings();
  const [selected, setSelected] = useState(null);
  const { data: messages = [], isLoading } = useQuery({ queryKey: ['messages'], queryFn: () => messagesApi.list() });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1><p className="text-slate-500 dark:text-slate-400 mt-1">{messages.length} messages</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Message List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700"><h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Inbox</h3></div>
          <div className="overflow-y-auto h-full">
            {messages.map((msg, i) => (
              <motion.button key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(msg)}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selected?.id === msg.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {!msg.is_read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span className="font-medium text-sm text-slate-800 dark:text-white">{msg.sender_name || 'Unknown'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">{msg.subject || 'No subject'}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{msg.content}</p>
              </motion.button>
            ))}
            {messages.length === 0 && <div className="text-center py-16 text-slate-400"><Mail className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">No messages</p></div>}
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col">
          {selected ? (
            <>
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{selected.subject || 'No Subject'}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span>From: <strong>{selected.sender_name}</strong></span>
                  {selected.recipient_name && <span>To: <strong>{selected.recipient_name}</strong></span>}
                  <span>{formatDate(selected.created_at)}</span>
                </div>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a message to read</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
