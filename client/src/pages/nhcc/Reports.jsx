import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportsApi, usersApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];
const RAG_COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };

export default function Reports() {
  const { formatCurrency } = useSettings();
  const [generatedReport, setGeneratedReport] = useState(null);
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: usersApi.dashboardStats });
  const reportMutation = useMutation({
    mutationFn: reportsApi.generateCeo,
    onSuccess: data => {
      if (generatedReport?.reportUrl) URL.revokeObjectURL(generatedReport.reportUrl);
      const reportUrl = URL.createObjectURL(new Blob([data.html], { type: 'text/html' }));
      setGeneratedReport({ ...data, reportUrl });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  const locationData = (stats?.projectLocations || []).map(l => ({ name: l.location?.split(',')[0] || 'Unknown', projects: l.count, budget: l.budget / 1e9, spent: l.spent / 1e9 }));
  const ragData = (stats?.projectsByRag || []).map(r => ({ name: r.rag_status, value: r.count }));
  const taskData = (stats?.tasksByStatus || []).map(t => ({ name: t.status.replace('_', ' '), value: t.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Comprehensive overview</p>
        </div>
        <div className="flex items-center gap-3">
          {generatedReport?.reportUrl && (
            <a
              href={generatedReport.reportUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Open CEO Report
            </a>
          )}
          <button
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 disabled:opacity-60 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            {reportMutation.isPending ? 'Generating...' : 'Generate CEO Report'}
          </button>
        </div>
      </div>

      {reportMutation.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {reportMutation.error.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Projects by Location</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" name="Budget (Bn)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent (Bn)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* RAG Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">RAG Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ragData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                {ragData.map((entry, i) => <Cell key={i} fill={RAG_COLORS[entry.name] || COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tasks Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={taskData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label>
                {taskData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Summary Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-sm text-blue-600 dark:text-blue-400">Total Budget</p><p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats?.totalBudget)}</p></div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"><p className="text-sm text-green-600 dark:text-green-400">Total Expenditure</p><p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats?.totalSpent)}</p></div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><p className="text-sm text-amber-600 dark:text-amber-400">Remaining</p><p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency((stats?.totalBudget || 0) - (stats?.totalSpent || 0))}</p></div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"><p className="text-sm text-purple-600 dark:text-purple-400">Utilization Rate</p><p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats?.totalBudget ? Math.round(stats.totalSpent / stats.totalBudget * 100) : 0}%</p></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
