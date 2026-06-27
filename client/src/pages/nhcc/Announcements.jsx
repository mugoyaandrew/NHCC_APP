import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Megaphone, Plus, X } from 'lucide-react';
import { announcementsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const priorityColors = { high: 'bg-red-100 text-red-700 border-red-200', normal: 'bg-blue-100 text-blue-700 border-blue-200', low: 'bg-slate-100 text-slate-600 border-slate-200' };
const priorityBorder = { high: 'border-l-red-500', normal: 'border-l-blue-500', low: 'border-l-slate-400' };

export default function Announcements() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });
  const { data: announcements = [], isLoading } = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.list });
  const createMutation = useMutation({ mutationFn: d => announcementsApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); setShowForm(false); setForm({ title: '', content: '', priority: 'normal' }); } });
  const deleteMutation = useMutation({ mutationFn: id => announcementsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }) });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Announcements</h1><p className="text-slate-500 mt-1">{announcements.length} announcements</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"><Plus className="w-4 h-4" /> New Announcement</button>
      </div>

      <div className="space-y-4">
        {announcements.map((ann, i) => (
          <motion.div key={ann.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 ${priorityBorder[ann.priority] || 'border-l-slate-400'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nhcc-blue-500/10 flex items-center justify-center"><Megaphone className="w-5 h-5 text-nhcc-blue-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{ann.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${priorityColors[ann.priority] || 'bg-gray-100'}`}>{ann.priority}</span>
                    <span className="text-xs text-slate-400">{ann.author_name} • {formatDate(ann.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(ann.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{ann.content}</p>
          </motion.div>
        ))}
        {announcements.length === 0 && <div className="text-center py-16"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No announcements yet</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">New Announcement</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Content" rows={4} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none resize-none" />
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                <option value="high">High Priority</option><option value="normal">Normal</option><option value="low">Low Priority</option>
              </select>
              <button onClick={() => createMutation.mutate(form)} className="w-full py-2.5 bg-nhcc-blue-500 text-white rounded-xl font-medium">Post Announcement</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
