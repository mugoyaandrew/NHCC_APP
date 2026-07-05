import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Check, ClipboardList, Package, ShieldCheck, UserRound, WalletCards, XIcon } from 'lucide-react';
import { approvalsApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const typeIcons = {
  budget: WalletCards,
  hr: UserRound,
  procurement: Package,
  travel: Briefcase,
  contract: ClipboardList,
  general: ShieldCheck,
};

export default function Approvals() {
  const { formatDate } = useSettings();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsApi.list(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => approvalsApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setReviewTarget(null);
      setReviewNotes('');
    },
  });

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === filter);

  const openReview = (item, status) => {
    setReviewTarget({ ...item, nextStatus: status });
    setReviewNotes('');
  };

  const submitReview = () => {
    if (!reviewTarget) return;
    reviewMutation.mutate({
      id: reviewTarget.id,
      data: { status: reviewTarget.nextStatus, review_notes: reviewNotes },
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Approvals</h1>
        <p className="text-slate-500 mt-1">{approvals.filter(a => a.status === 'pending').length} pending</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-nhcc-blue-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item, i) => {
          const TypeIcon = typeIcons[item.type] || ShieldCheck;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <TypeIcon className="w-5 h-5 text-nhcc-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">By {item.requester_name || 'Unknown'} - {formatDate(item.created_at)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{item.description}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
              </div>

              {item.status !== 'pending' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  <p>Reviewed by {item.reviewer_name || 'Unknown'}{item.reviewed_at ? ` on ${formatDate(item.reviewed_at)}` : ''}</p>
                  {item.review_notes && <p className="mt-1 text-slate-600 dark:text-slate-300">{item.review_notes}</p>}
                </div>
              )}

              {item.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => openReview(item, 'approved')}
                    className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => openReview(item, 'rejected')}
                    className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all">
                    <XIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-16"><ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No approval requests</p></div>}
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {reviewTarget.nextStatus === 'approved' ? 'Approve Request' : 'Reject Request'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{reviewTarget.title}</p>
              </div>
              <button onClick={() => setReviewTarget(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder={reviewTarget.nextStatus === 'rejected' ? 'Reason for rejection' : 'Optional review notes'}
              rows={4}
              className="w-full mt-4 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />

            {reviewMutation.isError && (
              <p className="text-sm text-red-500 mt-3">{reviewMutation.error.message}</p>
            )}

            <button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              className={`w-full mt-4 py-2.5 text-white rounded-xl font-medium transition-all disabled:opacity-60 ${reviewTarget.nextStatus === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {reviewMutation.isPending ? 'Saving...' : reviewTarget.nextStatus === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
