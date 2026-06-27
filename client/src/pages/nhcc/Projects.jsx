import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, MapPin, Calendar, X } from 'lucide-react';
import { projectsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const statusColors = { planning: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', on_hold: 'bg-red-100 text-red-700' };
const ragColors = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };

export default function Projects() {
  const { formatCurrency, formatDate } = useSettings();
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location: '', budget: '', status: 'planning', rag_status: 'green' });
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const createMutation = useMutation({ mutationFn: (d) => projectsApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setShowForm(false); setForm({ name: '', description: '', location: '', budget: '', status: 'planning', rag_status: 'green' }); } });
  const deleteMutation = useMutation({ mutationFn: (id) => projectsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }) });

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);
  const filters = ['all', 'planning', 'in_progress', 'completed', 'on_hold'];

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{projects.length} total projects</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-nhcc-blue-500 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project, i) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: ragColors[project.rag_status] || '#94a3b8' }} />
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{project.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" /> {project.location || 'No location'}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{project.description || 'No description'}</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Completion</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{project.completion || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${project.completion || 0}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Budget</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(project.budget)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Spent</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(project.spent)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" /> {formatDate(project.start_date)}
              </div>
              <button onClick={() => deleteMutation.mutate(project.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No projects found</p>
        </div>
      )}

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Project</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Project Name" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="Budget" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={() => createMutation.mutate({ ...form, budget: Number(form.budget) || 0, spent: 0, completion: 0 })}
                className="w-full py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium transition-all">
                Create Project
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
