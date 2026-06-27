import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Landmark } from 'lucide-react';
import { accountsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const typeIcons = { checking: '💳', savings: '🏦', mobile_money: '📱', fixed_deposit: '🔒' };
const typeColors = { checking: 'bg-blue-100 text-blue-700', savings: 'bg-green-100 text-green-700', mobile_money: 'bg-amber-100 text-amber-700', fixed_deposit: 'bg-purple-100 text-purple-700' };

export default function Accounts() {
  const { formatCurrency } = useSettings();
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Accounts</h1><p className="text-slate-500 mt-1">{accounts.length} accounts</p></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/80">Total Balance</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        <p className="text-xs text-white/60 mt-1">Across {accounts.length} accounts</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc, i) => (
          <motion.div key={acc.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 card-hover">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{typeIcons[acc.type] || '💰'}</span>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{acc.name}</h3>
                <p className="text-xs text-slate-400">{acc.institution || 'Unknown'}</p>
              </div>
              <span className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[acc.type] || 'bg-gray-100'}`}>{(acc.type || '').replace('_', ' ')}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(acc.balance)}</p>
          </motion.div>
        ))}
      </div>
      {accounts.length === 0 && <div className="text-center py-16"><Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No accounts yet</p></div>}
    </div>
  );
}
