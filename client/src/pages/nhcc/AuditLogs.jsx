import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, Search } from 'lucide-react';
import { auditApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const operationColors = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  REPORT: 'bg-purple-100 text-purple-700',
};

function summarizeFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return '-';
  return fields.slice(0, 4).join(', ') + (fields.length > 4 ? ` +${fields.length - 4}` : '');
}

export default function AuditLogs() {
  const { formatDate } = useSettings();
  const [search, setSearch] = useState('');
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list(200),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(log => (
      log.user_email?.toLowerCase().includes(q) ||
      log.operation?.toLowerCase().includes(q) ||
      log.model?.toLowerCase().includes(q) ||
      String(log.record_id || '').toLowerCase().includes(q)
    ));
  }, [logs, search]);

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Logs</h1>
        <p className="text-red-500 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Logs</h1>
          <p className="text-slate-500 mt-1">{logs.length} recent events</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Time</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Action & User</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Entity</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Record</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Changed Fields</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-5 py-3 text-slate-500">{formatDate(log.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide ${operationColors[log.operation] || 'bg-slate-100 text-slate-700'}`}>
                      {log.operation} BY {log.user_email?.split('@')[0].toUpperCase() || 'SYSTEM'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{log.model}</td>
                  <td className="px-5 py-3 text-slate-500">{log.record_id || '-'}</td>
                  <td className="px-5 py-3 text-slate-500">{summarizeFields(log.changed_fields)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No audit events found</p>
        </div>
      )}
    </div>
  );
}
