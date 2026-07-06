import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, CheckSquare, FileText, HardHat, MapPin,
  User, WalletCards, Activity
} from 'lucide-react';
import { documentsApi, projectsApi, siteReportsApi, tasksApi } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const statusColors = {
  planning: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-red-100 text-red-700',
};

const ragColors = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="text-center py-10">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { formatCurrency, formatDate } = useSettings();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project_id: id }],
    queryFn: () => tasksApi.list({ project_id: id }),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', { project_id: id }],
    queryFn: () => documentsApi.list({ project_id: id }),
  });
  const { data: siteReports = [] } = useQuery({
    queryKey: ['site-reports', { project_id: id }],
    queryFn: () => siteReportsApi.list({ project_id: id }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;
  if (!project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-nhcc-blue-500 hover:text-nhcc-blue-700">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <EmptyState icon={Activity} label="Project not found" />
      </div>
    );
  }

  const completion = Number(project.completion) || 0;
  const spent = Number(project.spent) || 0;
  const budget = Number(project.budget) || 0;
  const budgetUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-nhcc-blue-500 hover:text-nhcc-blue-700">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${ragColors[project.rag_status] || 'bg-slate-400'}`} />
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{project.rag_status || 'unknown'} risk</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{project.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">{project.description || 'No description'}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColors[project.status] || 'bg-slate-100 text-slate-700'}`}>
            {project.status?.replace('_', ' ') || 'unknown'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
          <InfoTile icon={MapPin} label="Location" value={project.location} />
          <InfoTile icon={User} label="Manager" value={project.manager_name || 'Unassigned'} />
          <InfoTile icon={Calendar} label="Timeline" value={`${formatDate(project.start_date)} to ${formatDate(project.end_date)}`} />
          <InfoTile icon={WalletCards} label="Budget" value={formatCurrency(project.budget)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500">Completion</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{completion}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500">Budget used</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(spent)} of {formatCurrency(budget)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${budgetUsed}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white"><CheckSquare className="w-5 h-5 text-blue-500" /> Tasks</h2>
          <div className="mt-4 space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                  <span className="text-xs text-slate-500">{task.status?.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{task.assignee_name || 'Unassigned'} - due {formatDate(task.due_date)}</p>
              </div>
            ))}
            {tasks.length === 0 && <EmptyState icon={CheckSquare} label="No tasks linked to this project" />}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white"><FileText className="w-5 h-5 text-emerald-500" /> Documents</h2>
          <div className="mt-4 space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                <p className="text-sm font-medium text-slate-800 dark:text-white">{doc.title}</p>
                <p className="text-xs text-slate-500 mt-1">{doc.type} - expires {formatDate(doc.expiry_date)}</p>
              </div>
            ))}
            {documents.length === 0 && <EmptyState icon={FileText} label="No documents linked to this project" />}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white"><HardHat className="w-5 h-5 text-amber-500" /> Site Reports</h2>
          <div className="mt-4 space-y-3">
            {siteReports.map(report => (
              <div key={report.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(report.date)}</p>
                  <span className="text-xs text-slate-500">{report.completion || 0}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.work_done || 'No work summary'}</p>
              </div>
            ))}
            {siteReports.length === 0 && <EmptyState icon={HardHat} label="No site reports linked to this project" />}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
