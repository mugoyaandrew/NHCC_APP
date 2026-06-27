import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usersApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const CAT_COLORS = { needs: '#3b82f6', wants: '#a855f7', savings: '#22c55e' };
const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#f97316'];

export default function Analytics() {
  const { formatCurrency } = useSettings();
  const { data: stats, isLoading } = useQuery({ queryKey: ['finara-stats'], queryFn: usersApi.finaraStats });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  const catData = (stats?.expensesByCategory || []).map(c => ({ name: c.category, value: c.total }));
  const subData = (stats?.expensesBySubcategory || []).slice(0, 8).map(s => ({ name: (s.subcategory || 'other').replace('_', ' '), value: s.total }));
  const incCatData = (stats?.incomeByCategory || []).map(c => ({ name: c.category, value: c.total }));
  const savingsRate = stats?.totalIncome ? Math.round(((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics</h1><p className="text-slate-500 mt-1">Financial insights</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500">Income</p><p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(stats?.totalIncome)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500">Expenses</p><p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(stats?.totalExpenses)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500">Savings Rate</p><p className={`text-xl font-bold mt-1 ${savingsRate >= 20 ? 'text-green-600' : 'text-amber-500'}`}>{savingsRate}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" nameKey="name" label={({ name }) => name}>
              {catData.map(entry => <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#94a3b8'} />)}
            </Pie><Tooltip formatter={v => formatCurrency(v)} /></PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Top Subcategories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => formatCurrency(v)} /><Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {subData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Income by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={incCatData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
              {incCatData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie><Tooltip formatter={v => formatCurrency(v)} /><Legend /></PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
