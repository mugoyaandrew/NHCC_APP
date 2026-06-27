import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import { investmentsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const typeIcons = { stocks: '📊', bonds: '🏛️', mutual_fund: '📈', crypto: '₿' };
const typeColors = { stocks: 'bg-blue-100 text-blue-700', bonds: 'bg-green-100 text-green-700', mutual_fund: 'bg-purple-100 text-purple-700', crypto: 'bg-amber-100 text-amber-700' };

export default function Investments() {
  const { formatCurrency, formatDate } = useSettings();
  const { data: investments = [], isLoading } = useQuery({ queryKey: ['investments'], queryFn: investmentsApi.list });
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalGain = totalValue - totalInvested;
  const gainPct = totalInvested ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Investments</h1><p className="text-slate-500 mt-1">Portfolio overview</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Total Invested</p><p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatCurrency(totalInvested)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Current Value</p><p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalValue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-2xl p-5 shadow-sm border ${totalGain >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <p className="text-sm text-slate-500">Total Gain/Loss</p>
          <div className="flex items-center gap-2 mt-1">
            {totalGain >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-500'}`}>{totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}</p>
            <span className={`text-sm font-medium ${totalGain >= 0 ? 'text-green-600' : 'text-red-500'}`}>({gainPct}%)</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map((inv, i) => {
          const gain = inv.current_value - inv.amount;
          const pct = inv.amount ? ((gain / inv.amount) * 100).toFixed(1) : 0;
          return (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[inv.type] || '📊'}</span>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{inv.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${typeColors[inv.type] || 'bg-gray-100'}`}>{(inv.type || '').replace('_', ' ')}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {gain >= 0 ? '↑' : '↓'} {gain >= 0 ? '+' : ''}{pct}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Invested</p><p className="text-sm font-semibold text-slate-800 dark:text-white">{formatCurrency(inv.amount)}</p></div>
                <div><p className="text-xs text-slate-400">Current Value</p><p className="text-sm font-semibold text-blue-600">{formatCurrency(inv.current_value)}</p></div>
              </div>
              {inv.purchase_date && <p className="text-xs text-slate-400 mt-2">Purchased: {formatDate(inv.purchase_date)}</p>}
            </motion.div>
          );
        })}
      </div>
      {investments.length === 0 && <div className="text-center py-16"><LineChart className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No investments yet</p></div>}
    </div>
  );
}
