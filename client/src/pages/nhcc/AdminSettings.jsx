import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Database, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminSettings() {
  const [confirmPurge, setConfirmPurge] = useState(false);

  const seedMutation = useMutation({
    mutationFn: () => api.post('/seed/synthetic', {}),
  });

  const purgeMutation = useMutation({
    mutationFn: () => api.delete('/seed/synthetic'),
    onSuccess: () => setConfirmPurge(false),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Settings</h1>
        <p className="text-slate-500 mt-1">Manage system data and configuration</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Synthetic Data Management</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Generate realistic test data for demonstrations and development. All synthetic records are flagged with <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">is_synthetic = true</code> and can be safely purged without affecting real data.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${seedMutation.isPending ? 'animate-spin' : ''}`} />
            {seedMutation.isPending ? 'Generating...' : 'Regenerate Data'}
          </button>

          {!confirmPurge ? (
            <button
              onClick={() => setConfirmPurge(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" /> Purge Synthetic Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Are you sure?
              </span>
              <button
                onClick={() => purgeMutation.mutate()}
                disabled={purgeMutation.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all"
              >
                {purgeMutation.isPending ? 'Purging...' : 'Yes, Purge'}
              </button>
              <button
                onClick={() => setConfirmPurge(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {seedMutation.isSuccess && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl text-sm">
            Synthetic data generated successfully! Refresh any page to see the new data.
          </div>
        )}
        {seedMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
            {seedMutation.error.message}
          </div>
        )}
        {purgeMutation.isSuccess && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-xl text-sm">
            All synthetic data has been purged. Only real records remain.
          </div>
        )}
      </motion.div>
    </div>
  );
}
