import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, X, Trash2, Search, ArrowUpDown, RefreshCw, Brain, Sparkles } from 'lucide-react';
import { expenseApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';
import { classifyExpense, learnPattern } from '../../lib/ai-engine';

const subEmojis = { rent: '🏠', groceries: '🛒', utilities: '⚡', transportation: '🚗', healthcare: '🏥', dining: '🍽️', entertainment: '🎬', shopping: '🛍️', subscriptions: '📱', emergency_fund: '🛡️', investments: '📈', retirement: '🏖️' };
const catColors = { needs: 'bg-blue-100 text-blue-700', wants: 'bg-purple-100 text-purple-700', savings: 'bg-green-100 text-green-700' };
const subOptions = { needs: ['rent', 'groceries', 'utilities', 'transportation', 'healthcare'], wants: ['dining', 'entertainment', 'shopping', 'subscriptions'], savings: ['emergency_fund', 'investments', 'retirement'] };

export default function Expenses() {
  const { formatCurrency, formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'needs', subcategory: 'groceries', date: new Date().toISOString().slice(0, 10), is_recurring: 0 });
  const { data: expenses = [], isLoading } = useQuery({ queryKey: ['expenses'], queryFn: expenseApi.list });
  const createMut = useMutation({ mutationFn: d => expenseApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowForm(false); setForm({ description: '', amount: '', category: 'needs', subcategory: 'groceries', date: new Date().toISOString().slice(0, 10), is_recurring: 0 }); } });
  const deleteMut = useMutation({ mutationFn: id => expenseApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }) });

  let filtered = tab === 'all' ? expenses : expenses.filter(e => e.category === tab);
  if (search) filtered = filtered.filter(e => e.description?.toLowerCase().includes(search.toLowerCase()));

  const totals = { needs: expenses.filter(e => e.category === 'needs').reduce((s, e) => s + e.amount, 0), wants: expenses.filter(e => e.category === 'wants').reduce((s, e) => s + e.amount, 0), savings: expenses.filter(e => e.category === 'savings').reduce((s, e) => s + e.amount, 0) };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Expenses</h1><p className="text-slate-500 mt-1">{expenses.length} expenses</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl font-medium shadow-lg shadow-sage-500/25 transition-all"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(totals).map(([cat, total]) => (
          <div key={cat} className={`rounded-xl p-4 ${cat === 'needs' ? 'bg-blue-50 dark:bg-blue-900/20' : cat === 'wants' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <p className="text-xs font-medium capitalize text-slate-500">{cat}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(total)}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        {['all', 'needs', 'wants', 'savings'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-sage-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm outline-none" />
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        {filtered.map((exp, i) => (
          <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{subEmojis[exp.subcategory] || '📋'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{exp.description}</p>
                  {exp.is_recurring ? <RefreshCw className="w-3 h-3 text-blue-400" /> : null}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catColors[exp.category]}`}>{exp.category}</span>
                  <span className="text-xs text-slate-400">{exp.subcategory}</span>
                  <span className="text-xs text-slate-400">• {formatDate(exp.date)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-red-500">-{formatCurrency(exp.amount)}</span>
              <button onClick={() => deleteMut.mutate(exp.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-16"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No expenses found</p></div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">Add Expense</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div className="relative">
                <input value={form.description} onChange={e => {
                  const desc = e.target.value;
                  setForm(prev => {
                    const updated = { ...prev, description: desc };
                    const suggestion = classifyExpense(desc);
                    if (suggestion && suggestion.confidence > 0.5) {
                      updated.category = suggestion.category;
                      updated.subcategory = suggestion.subcategory;
                      updated._aiSuggested = true;
                      updated._aiConfidence = Math.round(suggestion.confidence * 100);
                      updated._aiSource = suggestion.source;
                    } else {
                      updated._aiSuggested = false;
                    }
                    return updated;
                  });
                }} placeholder="Description (AI auto-categorizes ✨)" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
                <AnimatePresence>
                  {form._aiSuggested && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-1 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <Brain className="w-3 h-3 text-indigo-500" />
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                        AI: {subEmojis[form.subcategory] || '📋'} {form.category} → {form.subcategory?.replace('_',' ')} ({form._aiConfidence}% match{form._aiSource === 'learned' ? ', learned from you' : ''})
                      </span>
                      <Sparkles className="w-3 h-3 text-amber-500 ml-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value, subcategory: subOptions[e.target.value]?.[0] || ''})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                <option value="needs">Needs</option><option value="wants">Wants</option><option value="savings">Savings</option>
              </select>
              <select value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                {(subOptions[form.category] || []).map(s => <option key={s} value={s}>{subEmojis[s]} {s.replace('_', ' ')}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked ? 1 : 0})} className="rounded" /> Recurring expense</label>
              <button onClick={() => createMut.mutate({ ...form, amount: Number(form.amount) || 0 })} className="w-full py-2.5 bg-sage-500 text-white rounded-xl font-medium">Add Expense</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
