import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, Plus, X, Trash2, Edit } from 'lucide-react';
import { incomeApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const freqColors = { monthly: 'bg-blue-100 text-blue-700', weekly: 'bg-green-100 text-green-700', 'bi-weekly': 'bg-purple-100 text-purple-700', quarterly: 'bg-teal-100 text-teal-700', annual: 'bg-amber-100 text-amber-700' };
const catColors = { primary: 'bg-blue-100 text-blue-700', secondary: 'bg-purple-100 text-purple-700', passive: 'bg-green-100 text-green-700', other: 'bg-gray-100 text-gray-600' };
const toMonthly = (amount, freq) => { const m = { weekly: 4.33, 'bi-weekly': 2.17, monthly: 1, quarterly: 1/3, annual: 1/12 }; return amount * (m[freq] || 1); };

export default function Income() {
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ source_name: '', amount: '', frequency: 'monthly', category: 'primary' });
  const { data: incomes = [], isLoading } = useQuery({ queryKey: ['income'], queryFn: incomeApi.list });
  const createMut = useMutation({ mutationFn: d => incomeApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); setShowForm(false); setForm({ source_name: '', amount: '', frequency: 'monthly', category: 'primary' }); } });
  const deleteMut = useMutation({ mutationFn: id => incomeApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income'] }) });

  const totalMonthly = incomes.filter(i => i.is_active).reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Income</h1><p className="text-slate-500 mt-1">{incomes.length} income sources</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-medium shadow-lg shadow-sage-500/25 transition-all"><Plus className="w-4 h-4" /> Add Income</button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/80">Total Monthly Income</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthly)}</p>
        <p className="text-xs text-white/60 mt-1">{incomes.filter(i => i.is_active).length} active sources</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incomes.map((income, i) => (
          <motion.div key={income.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 card-hover ${!income.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{income.source_name}</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(income.amount)}</p>
              </div>
              <button onClick={() => deleteMut.mutate(income.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${freqColors[income.frequency] || 'bg-gray-100'}`}>{income.frequency}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${catColors[income.category] || 'bg-gray-100'}`}>{income.category}</span>
              {income.is_active ? <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">Active</span> : <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">Inactive</span>}
            </div>
            <p className="text-xs text-slate-400 mt-2">Monthly: {formatCurrency(toMonthly(income.amount, income.frequency))}</p>
          </motion.div>
        ))}
      </div>
      {incomes.length === 0 && <div className="text-center py-16"><Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No income sources yet</p></div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">Add Income</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input value={form.source_name} onChange={e => setForm({...form, source_name: e.target.value})} placeholder="Source Name" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <div className="flex gap-2 flex-wrap">
                {[100000, 500000, 1000000, 5000000].map(a => <button key={a} onClick={() => setForm({...form, amount: String(a)})} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">{formatCurrency(a)}</button>)}
              </div>
              <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="bi-weekly">Bi-Weekly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
              </select>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                <option value="primary">Primary</option><option value="secondary">Secondary</option><option value="passive">Passive</option><option value="other">Other</option>
              </select>
              <button onClick={() => createMut.mutate({ ...form, amount: Number(form.amount) || 0, is_active: 1 })} className="w-full py-2.5 bg-sage-500 text-white rounded-xl font-medium">Add Income</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
