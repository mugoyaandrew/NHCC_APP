import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Brain, TrendingUp } from 'lucide-react';
import { detectAnomalies } from '../../lib/ai-engine';

export default function AnomalyBanner({ expenses }) {
  const [dismissed, setDismissed] = useState([]);
  const anomalies = detectAnomalies(expenses || []);
  const visible = anomalies.filter((_, i) => !dismissed.includes(i));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">AI Insights</span>
      </div>
      <AnimatePresence>
        {anomalies.map((anomaly, i) => {
          if (dismissed.includes(i)) return null;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                anomaly.severity === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                anomaly.severity === 'high' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
              }`}>
                {anomaly.type === 'category_spike' 
                  ? <TrendingUp className={`w-4 h-4 ${anomaly.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                  : <AlertTriangle className={`w-4 h-4 ${anomaly.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${anomaly.severity === 'high' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {anomaly.type === 'high_expense' ? '⚠️ Unusual Expense Detected' : '📈 Category Spending Spike'}
                </p>
                <p className={`text-xs mt-0.5 ${anomaly.severity === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {anomaly.message}
                </p>
              </div>
              <button onClick={() => setDismissed(prev => [...prev, i])} className="p-1 hover:bg-white/50 rounded">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
