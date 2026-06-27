import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Moon, Sun, DollarSign, Globe, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

const currencies = ['UGX', 'USD', 'EUR', 'GBP', 'KES'];

export default function Settings() {
  const { user } = useAuth();
  const { currency, setCurrency, darkMode, toggleDarkMode } = useSettings();

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1><p className="text-slate-500 mt-1">Configure your preferences</p></div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">👤 Profile</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-medium text-slate-800 dark:text-white">{user?.full_name}</span></div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700"><span className="text-sm text-slate-500">Email</span><span className="text-sm font-medium text-slate-800 dark:text-white">{user?.email}</span></div>
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700"><span className="text-sm text-slate-500">Role</span><span className="text-sm font-medium text-slate-800 dark:text-white">{user?.role}</span></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Currency</h3>
        <div className="flex gap-2 flex-wrap">
          {currencies.map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currency === c ? 'bg-sage-500 text-white shadow' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'}`}>
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">{darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} Appearance</h3>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-slate-800 dark:text-white">Dark Mode</p><p className="text-xs text-slate-400">Toggle dark/light theme</p></div>
          <button onClick={toggleDarkMode} className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-sage-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Info className="w-5 h-5" /> About</h3>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Finara — Your Financial Co-Pilot</p>
          <p>Version 1.0.0</p>
          <p>Built with React, Express, SQLite</p>
        </div>
      </motion.div>
    </div>
  );
}
