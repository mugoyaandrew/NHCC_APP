import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, ShieldCheck, Users, FileText, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usersApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const TASK_COLORS = ['#64748b', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];

export default function Dashboard() {
  const { formatCurrency } = useSettings();
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: usersApi.dashboardStats });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Active Projects', value: stats?.activeProjects || 0, icon: FolderKanban, color: 'stat-blue' },
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: CheckSquare, color: 'stat-green' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: ShieldCheck, color: 'stat-amber' },
    { label: 'Active Staff', value: stats?.totalUsers || 0, icon: Users, color: 'stat-purple' },
    { label: 'Documents', value: stats?.totalDocuments || 0, icon: FileText, color: 'stat-teal' },
    { label: 'Unread Messages', value: stats?.unreadMessages || 0, icon: MessageSquare, color: 'stat-red' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome to NHCC Portal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`${card.color} rounded-2xl p-5 text-white card-hover`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RAG Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Projects by RAG Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats?.projectsByRag || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="rag_status" label={({ rag_status, count }) => `${rag_status}: ${count}`}>
                {(stats?.projectsByRag || []).map((entry, i) => (
                  <Cell key={i} fill={entry.rag_status === 'green' ? '#22c55e' : entry.rag_status === 'amber' ? '#f59e0b' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Budget Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Budget Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Budget</span>
              <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(stats?.totalBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Spent</span>
              <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(stats?.totalSpent)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${stats?.totalBudget ? (stats.totalSpent / stats.totalBudget * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-slate-400">{stats?.totalBudget ? Math.round(stats.totalSpent / stats.totalBudget * 100) : 0}% utilized</p>
          </div>

          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-6 mb-3">Tasks by Status</h4>
          <div className="grid grid-cols-2 gap-2">
            {(stats?.tasksByStatus || []).map((t, i) => (
              <div key={t.status} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: TASK_COLORS[i % TASK_COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-400 capitalize">{t.status.replace('_', ' ')}</span>
                <span className="ml-auto font-medium text-slate-800 dark:text-white">{t.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
