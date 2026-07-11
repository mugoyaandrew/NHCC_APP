import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Mail, MessageSquarePlus, X, Reply, Forward } from 'lucide-react';
import { messagesApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

export default function Messages() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [composeMode, setComposeMode] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [composeForm, setComposeForm] = useState({ subject: '', content: '', recipient_id: '' });
  
  const { data: messages = [], isLoading } = useQuery({ queryKey: ['messages'], queryFn: () => messagesApi.list() });
  
  const sendMutation = useMutation({
    mutationFn: (data) => messagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setComposeMode(false);
      setComposeForm({ subject: '', content: '', recipient_id: '' });
    }
  });

  const handleReply = (msg) => {
    setReplyTo(msg);
    setComposeForm({
      subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
      content: `\n\n--- Original Message from ${msg.sender_name} ---\n${msg.content}`,
      recipient_id: msg.sender_id.toString()
    });
    setComposeMode(true);
  };

  const handleForward = (msg) => {
    setReplyTo(null);
    setComposeForm({
      subject: msg.subject.startsWith('Fwd:') ? msg.subject : `Fwd: ${msg.subject}`,
      content: `\n\n--- Forwarded Message from ${msg.sender_name} ---\nDate: ${formatDate(msg.created_at)}\nSubject: ${msg.subject}\n\n${msg.content}`,
      recipient_id: ''
    });
    setComposeMode(true);
  };

  const handleSend = () => {
    sendMutation.mutate({
      recipient_id: Number(composeForm.recipient_id),
      subject: composeForm.subject,
      content: composeForm.content
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1><p className="text-slate-500 dark:text-slate-400 mt-1">{messages.length} messages</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Message List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden lg:col-span-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Inbox</h3>
            <button onClick={() => { setComposeMode(true); setReplyTo(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-nhcc-blue-500">
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {messages.map((msg, i) => (
              <motion.button key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                onClick={() => { setSelected(msg); setComposeMode(false); }}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selected?.id === msg.id && !composeMode ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''}`}>
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

        {/* Message Content or Compose */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col relative overflow-hidden">
          {composeMode ? (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {replyTo ? `Reply to ${replyTo.sender_name}` : 'New Message'}
                </h2>
                <button onClick={() => setComposeMode(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                {!replyTo && (
                  <input value={composeForm.recipient_id} onChange={e => setComposeForm({...composeForm, recipient_id: e.target.value})} placeholder="Recipient ID (e.g. 1)" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-nhcc-blue-500" />
                )}
                <input value={composeForm.subject} onChange={e => setComposeForm({...composeForm, subject: e.target.value})} placeholder="Subject" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-nhcc-blue-500" />
                <textarea value={composeForm.content} onChange={e => setComposeForm({...composeForm, content: e.target.value})} placeholder="Type your message here..." className="w-full flex-1 min-h-[200px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-nhcc-blue-500 resize-none" />
                
                <div className="flex justify-end pt-2">
                  <button onClick={handleSend} disabled={sendMutation.isPending} className="flex items-center gap-2 px-6 py-3 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50">
                    {sendMutation.isPending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{selected.subject || 'No Subject'}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                    <span>From: <strong>{selected.sender_name}</strong></span>
                    {selected.recipient_name && <span>To: <strong>{selected.recipient_name}</strong></span>}
                    <span>{formatDate(selected.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleForward(selected)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                    <Forward className="w-4 h-4" /> Forward
                  </button>
                  <button onClick={() => handleReply(selected)} className="flex items-center gap-2 px-3 py-1.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    <Reply className="w-4 h-4" /> Reply
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/30">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/30">
              <div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a message to read</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
