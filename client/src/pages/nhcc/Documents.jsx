import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Plus, Download, AlertTriangle, X, Upload, FileUp } from 'lucide-react';
import { useState } from 'react';
import { documentsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const typeIcons = { contract: '📋', tender: '📑', drawing: '📐', report: '📊', hr_file: '👤', financial: '💰', legal: '⚖️', policy: '📜', site_photo: '📸' };
const typeColors = { contract: 'bg-blue-100 text-blue-700', tender: 'bg-purple-100 text-purple-700', drawing: 'bg-teal-100 text-teal-700', report: 'bg-green-100 text-green-700', hr_file: 'bg-pink-100 text-pink-700', financial: 'bg-amber-100 text-amber-700', legal: 'bg-slate-100 text-slate-700', policy: 'bg-indigo-100 text-indigo-700', site_photo: 'bg-orange-100 text-orange-700' };

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function Documents() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'report', expiry_date: '' });
  const { data: docs = [], isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list() });
  const createMutation = useMutation({ mutationFn: d => documentsApi.create(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); setShowForm(false); } });
  const deleteMutation = useMutation({ mutationFn: id => documentsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }) });

  const handleFileUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await documentsApi.upload(file);
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const isExpiringSoon = (date) => { if (!date) return false; const d = new Date(date); const now = new Date(); const diff = (d - now) / (1000 * 60 * 60 * 24); return diff >= 0 && diff <= 30; };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Documents</h1><p className="text-slate-500 dark:text-slate-400 mt-1">{docs.length} documents</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"><Plus className="w-4 h-4" /> Add Document</button>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400'); }}
        onDragLeave={e => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400'); }}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-blue-400'); handleFileUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center transition-all hover:border-blue-400 cursor-pointer"
        onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.onchange = e => handleFileUpload(e.target.files); input.click(); }}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {uploading ? 'Uploading...' : 'Drag and drop files here, or click to browse'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Title</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Type</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Project</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Uploaded By</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Size</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Expiry</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-800 dark:text-white">{doc.title}</span></div></td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[doc.type] || 'bg-gray-100 text-gray-600'}`}>{typeIcons[doc.type] || '📄'} {doc.type}</span></td>
                  <td className="px-5 py-3 text-slate-500">{doc.project_name || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{doc.uploader_name || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{formatSize(doc.file_size)}</td>
                  <td className="px-5 py-3">
                    {doc.expiry_date ? (
                      <span className={`flex items-center gap-1 ${isExpiringSoon(doc.expiry_date) ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                        {isExpiringSoon(doc.expiry_date) && <AlertTriangle className="w-3 h-3" />}
                        {formatDate(doc.expiry_date)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => deleteMutation.mutate(doc.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">Add Document</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Document Title" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none">
                {Object.keys(typeIcons).map(t => <option key={t} value={t}>{typeIcons[t]} {t}</option>)}
              </select>
              <input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white text-sm outline-none" />
              <button onClick={() => createMutation.mutate(form)} className="w-full py-2.5 bg-nhcc-blue-500 text-white rounded-xl font-medium">Add Document</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
