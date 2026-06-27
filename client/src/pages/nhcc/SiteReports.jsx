import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HardHat, Plus, X, CloudSun } from 'lucide-react';
import { useState } from 'react';
import { siteReportsApi, projectsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const weatherIcons = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️', windy: '💨' };

export default function SiteReports() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project_id: '', date: '', weather: 'sunny', manpower: '', completion: '', work_done: '', materials: '', issues: '' });
  const { data: reports = [], isLoading } = useQuery({ queryKey: ['site-reports'], queryFn: () => siteReportsApi.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const createMutation = useMutation({ mutationFn: d => siteReportsApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['site-reports'] }); setShowForm(false); } });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Site Reports</h1><p className="text-slate-500 mt-1">{reports.length} reports</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"><Plus className="w-4 h-4" /> New Report</button>
      </div>

      <div className="space-y-4">
        {reports.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{r.project_name || 'Unknown Project'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.date)} • Reported by {r.reporter_name || 'Unknown'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{weatherIcons[r.weather] || '🌤️'}</span>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Manpower</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{r.manpower}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Completion</p>
                  <p className="text-lg font-bold text-blue-600">{r.completion}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Work Done</p>
                <p className="text-xs text-green-600 dark:text-green-300">{r.work_done || '—'}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Materials Used</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">{r.materials || '—'}</p>
              </div>
              <div className={`rounded-xl p-3 ${r.issues && r.issues !== 'None reported' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                <p className={`text-xs font-medium mb-1 ${r.issues && r.issues !== 'None reported' ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}>Issues</p>
                <p className={`text-xs ${r.issues && r.issues !== 'None reported' ? 'text-red-600 dark:text-red-300' : 'text-slate-400'}`}>{r.issues || 'None'}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {reports.length === 0 && <div className="text-center py-16"><HardHat className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No site reports yet</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">New Site Report</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <div className="grid grid-cols-3 gap-3">
                <select value={form.weather} onChange={e => setForm({...form, weather: e.target.value})} className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                  {Object.entries(weatherIcons).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
                </select>
                <input type="number" value={form.manpower} onChange={e => setForm({...form, manpower: e.target.value})} placeholder="Manpower" className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
                <input type="number" value={form.completion} onChange={e => setForm({...form, completion: e.target.value})} placeholder="Completion %" className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              </div>
              <textarea value={form.work_done} onChange={e => setForm({...form, work_done: e.target.value})} placeholder="Work Done" rows={2} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none resize-none" />
              <textarea value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} placeholder="Materials Used" rows={2} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none resize-none" />
              <textarea value={form.issues} onChange={e => setForm({...form, issues: e.target.value})} placeholder="Issues" rows={2} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none resize-none" />
              <button onClick={() => createMutation.mutate({ ...form, manpower: Number(form.manpower) || 0, completion: Number(form.completion) || 0, project_id: Number(form.project_id) || null })} className="w-full py-2.5 bg-nhcc-blue-500 text-white rounded-xl font-medium">Submit Report</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
