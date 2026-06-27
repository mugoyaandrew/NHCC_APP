import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Plus, X } from 'lucide-react';
import { goalsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

export default function Goals() {
  const { formatCurrency, formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target_amount: '', deadline: '', icon: '🎯' });
  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: goalsApi.list });
  const createMut = useMutation({ mutationFn: d => goalsApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => goalsApi.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }) });
  const deleteMut = useMutation({ mutationFn: id => goalsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }) });
  const [addAmount, setAddAmount] = useState({});

  const icons = ['🎯', '🛡️', '🚗', '✈️', '📈', '🏠', '💎', '🎓', '👶', '💊'];
  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Goals</h1><p className="text-slate-500 mt-1">Track your financial goals</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-medium shadow-lg shadow-sage-500/25 transition-all"><Plus className="w-4 h-4" /> New Goal</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal, i) => {
          const pct = goal.target_amount ? Math.round(goal.current_amount / goal.target_amount * 100) : 0;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{goal.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{goal.title}</h3>
                    {goal.deadline && <p className="text-xs text-slate-400 mt-0.5">Deadline: {formatDate(goal.deadline)}</p>}
                  </div>
                </div>
                <span className={`text-lg font-bold ${pct > 66 ? 'text-green-600' : pct > 33 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-2">
                <div className={`h-full rounded-full transition-all duration-500 ${pct > 66 ? 'bg-green-500' : pct > 33 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-3">
                <span>{formatCurrency(goal.current_amount)}</span><span>{formatCurrency(goal.target_amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Add funds..." value={addAmount[goal.id] || ''} onChange={e => setAddAmount({ ...addAmount, [goal.id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white text-xs outline-none" />
                <button onClick={() => { const amt = Number(addAmount[goal.id]) || 0; if (amt > 0) { updateMut.mutate({ id: goal.id, data: { current_amount: goal.current_amount + amt } }); setAddAmount({ ...addAmount, [goal.id]: '' }); } }}
                  className="px-3 py-2 bg-sage-500 text-white text-xs rounded-lg font-medium">+ Add</button>
                <button onClick={() => deleteMut.mutate(goal.id)} className="px-2 py-2 text-red-400 hover:text-red-600 text-xs">🗑️</button>
              </div>
            </motion.div>
          );
        })}
      </div>
      {goals.length === 0 && <div className="text-center py-16"><Target className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No goals yet</p></div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">New Goal</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Goal Title" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <input type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} placeholder="Target Amount" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <div><p className="text-sm text-slate-500 mb-2">Icon</p><div className="flex gap-2 flex-wrap">{icons.map(ic => <button key={ic} onClick={() => setForm({...form, icon: ic})} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${form.icon === ic ? 'bg-sage-100 ring-2 ring-sage-500' : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100'}`}>{ic}</button>)}</div></div>
              <button onClick={() => createMut.mutate({ ...form, target_amount: Number(form.target_amount) || 0, current_amount: 0 })} className="w-full py-2.5 bg-sage-500 text-white rounded-xl font-medium">Create Goal</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
