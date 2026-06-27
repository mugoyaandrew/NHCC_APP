import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, XIcon } from 'lucide-react';
import { approvalsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const statusColors = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
const typeIcons = { budget: '💰', hr: '👤', procurement: '📦', travel: '✈️', contract: '📋', general: '📄' };

export default function Approvals() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const { data: approvals = [], isLoading } = useQuery({ queryKey: ['approvals'], queryFn: () => approvalsApi.list() });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => approvalsApi.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }) });

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === filter);

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Approvals</h1><p className="text-slate-500 mt-1">{approvals.filter(a => a.status === 'pending').length} pending</p></div>

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-nhcc-blue-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">{typeIcons[item.type] || '📄'}</div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">By {item.requester_name || 'Unknown'} • {formatDate(item.created_at)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{item.description}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[item.status]}`}>{item.status}</span>
            </div>
            {item.status === 'pending' && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button onClick={() => updateMutation.mutate({ id: item.id, data: { status: 'approved' } })}
                  className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => updateMutation.mutate({ id: item.id, data: { status: 'rejected' } })}
                  className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all">
                  <XIcon className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16"><ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No approval requests</p></div>}
      </div>
    </div>
  );
}
