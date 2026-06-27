import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, X, Clock, AlertTriangle, Flag } from 'lucide-react';
import { tasksApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const columns = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'under_review', label: 'Under Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-500' },
];
const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

export default function Tasks() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'backlog' });
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list() });
  const createMutation = useMutation({ mutationFn: (d) => tasksApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); setForm({ title: '', description: '', priority: 'medium', status: 'backlog' }); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => tasksApi.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }) });

  const moveTask = (taskId, newStatus) => {
    updateMutation.mutate({ id: taskId, data: { status: newStatus } });
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kanban board • {tasks.length} tasks</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="min-w-[280px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{col.label}</h3>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-500">{colTasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
                {colTasks.map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="kanban-card bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-sm text-slate-800 dark:text-white mb-2">{task.title}</h4>
                    {task.project_name && (
                      <p className="text-xs text-slate-400 mb-2">📁 {task.project_name}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" /> {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                    {task.assignee_name && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[11px] text-slate-400">👤 {task.assignee_name}</p>
                      </div>
                    )}
                    {/* Quick move */}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {columns.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveTask(task.id, c.id)}
                          className="px-2 py-0.5 text-[9px] bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Task</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task Title" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={2} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none">
                <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
              </select>
              <button onClick={() => createMutation.mutate(form)} className="w-full py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium transition-all">Create Task</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
