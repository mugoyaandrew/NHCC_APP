import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckSquare, Clock, AlignLeft, Send, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { tasksApi, subtasksApi, commentsApi } from '../../../lib/api';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function TaskDetailModal({ taskId, onClose }) {
  const { formatDate } = useSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.get(taskId),
  });

  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtasksApi.list(taskId),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId),
  });

  const addSubtaskMutation = useMutation({
    mutationFn: (data) => subtasksApi.create(taskId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] }); setSubtaskTitle(''); }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: (id) => subtasksApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => commentsApi.create(taskId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', taskId] }); setCommentText(''); }
  });

  if (taskLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-center w-96 h-48">
        <div className="spinner" />
      </div>
    </div>
  );

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{task.project_name || 'No Project'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>{task.priority} priority</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-nhcc-blue-500" />
              {task.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Main Column */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-200 dark:border-slate-700 space-y-8">
            
            {/* Description */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <AlignLeft className="w-4 h-4" /> Description
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </div>
            </section>

            {/* Subtasks */}
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <CheckSquare className="w-4 h-4" /> Subtasks
              </h3>
              
              {/* Progress Bar */}
              {subtasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${(subtasks.filter(s => s.is_completed).length / subtasks.length) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg group transition-colors">
                    <button onClick={() => toggleSubtaskMutation.mutate(sub.id)} className="flex-shrink-0 focus:outline-none">
                      {sub.is_completed ? 
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-nhcc-blue-500 transition-colors" />
                      }
                    </button>
                    <span className={`text-sm flex-1 ${sub.is_completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="text" 
                    value={subtaskTitle} 
                    onChange={e => setSubtaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && subtaskTitle.trim() && addSubtaskMutation.mutate({ title: subtaskTitle })}
                    placeholder="Add a subtask..." 
                    className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm outline-none focus:border-nhcc-blue-500 dark:focus:border-nhcc-blue-500 transition-colors dark:text-white"
                  />
                  <button 
                    onClick={() => subtaskTitle.trim() && addSubtaskMutation.mutate({ title: subtaskTitle })}
                    disabled={!subtaskTitle.trim() || addSubtaskMutation.isPending}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar / Comments */}
          <div className="w-full lg:w-80 flex flex-col bg-slate-50 dark:bg-slate-900/30">
            {/* Meta Info */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Status</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm uppercase">
                  {task.status?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-nhcc-gold-400 flex items-center justify-center text-[10px] font-bold text-nhcc-blue-900">
                    {task.assignee_name?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.assignee_name || 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Start Date</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatDate(task.start_date) || 'No date set'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Due Date</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatDate(task.end_date || task.due_date) || 'No date set'}
                </span>
              </div>
            </div>

            {/* Comments Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm px-2">Activity</h3>
              
              {comments.map(comment => (
                <div key={comment.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{comment.author_name}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && <div className="text-center text-xs text-slate-400 py-4">No comments yet</div>}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="relative">
                <textarea 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ask a question or post an update..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-nhcc-blue-500 resize-none h-20 dark:text-white"
                />
                <button 
                  onClick={() => commentText.trim() && addCommentMutation.mutate({ content: commentText })}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="absolute bottom-2 right-2 p-1.5 bg-nhcc-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-nhcc-blue-600 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
