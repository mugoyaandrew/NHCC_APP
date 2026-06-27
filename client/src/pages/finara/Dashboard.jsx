import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Brain, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usersApi, expenseApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';
import AnomalyBanner from '../../components/ai/AnomalyBanner';
import { forecastSpending, forecastGoal } from '../../lib/ai-engine';

const COLORS = ['#3b82f6', '#a855f7', '#22c55e'];
const subEmojis = { rent: '🏠', groceries: '🛒', utilities: '⚡', transportation: '🚗', healthcare: '🏥', dining: '🍽️', entertainment: '🎬', shopping: '🛍️', subscriptions: '📱', emergency_fund: '🛡️', investments: '📈', retirement: '🏖️' };

export default function FinaraDashboard() {
  const { formatCurrency } = useSettings();
  const { data: stats, isLoading } = useQuery({ queryKey: ['finara-stats'], queryFn: usersApi.finaraStats });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: expenseApi.list });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  const forecast = forecastSpending(expenses);
  const balance = (stats?.totalIncome || 0) - (stats?.totalExpenses || 0);
  const savingsRate = stats?.totalIncome ? Math.round(((balance) / stats.totalIncome) * 100) : 0;


  const cards = [
    { label: 'Total Income', value: formatCurrency(stats?.totalIncome), icon: TrendingUp, color: 'stat-green' },
    { label: 'Total Expenses', value: formatCurrency(stats?.totalExpenses), icon: TrendingDown, color: 'stat-red' },
    { label: 'Balance', value: formatCurrency(balance), icon: Wallet, color: 'stat-blue' },
    { label: 'Bank Balance', value: formatCurrency(stats?.totalBalance), icon: PiggyBank, color: 'stat-purple' },
  ];

  const catData = (stats?.expensesByCategory || []).map(c => ({ name: c.category, value: c.total }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Dashboard</h1><p className="text-slate-500 mt-1">Your financial overview</p></div>

      {/* AI Anomaly Detection */}
      <AnomalyBanner expenses={expenses} />

      {/* AI Forecast Widget */}
      {forecast && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">AI Spending Forecast</span>
            <Zap className="w-3 h-3 text-amber-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><p className="text-[10px] text-slate-500">Daily Rate</p><p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(forecast.dailyRate)}/day</p></div>
            <div><p className="text-[10px] text-slate-500">Projected Monthly</p><p className="text-sm font-bold text-indigo-600">{formatCurrency(forecast.projectedMonthly)}</p></div>
            <div><p className="text-[10px] text-slate-500">Savings Rate</p><p className={`text-sm font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>{savingsRate}%</p></div>
            <div><p className="text-[10px] text-slate-500">Trend</p><p className="text-sm font-bold text-slate-800 dark:text-white">{forecast.trend === 'increasing' ? '📈 Increasing' : '📊 Stable'}</p></div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`${card.color} rounded-2xl p-5 text-white card-hover`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-white/80">{card.label}</p><p className="text-xl font-bold mt-1">{card.value}</p></div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><card.icon className="w-6 h-6" /></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {(stats?.recentExpenses || []).map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{subEmojis[exp.subcategory] || '📋'}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{exp.description}</p>
                    <p className="text-xs text-slate-400">{exp.date}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Goals Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5" /> Goals Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.goalsProgress || []).map(goal => {
            const pct = goal.target_amount ? Math.round(goal.current_amount / goal.target_amount * 100) : 0;
            return (
              <div key={goal.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{goal.icon} {goal.title}</span>
                  <span className="text-xs font-medium text-slate-500">{pct}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mb-1">
                  <div className={`h-full rounded-full transition-all ${pct > 66 ? 'bg-green-500' : pct > 33 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{formatCurrency(goal.current_amount)}</span>
                  <span>{formatCurrency(goal.target_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
