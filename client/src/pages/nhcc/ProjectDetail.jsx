import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, CheckSquare, FileText, HardHat, MapPin,
  User, WalletCards, Activity, BrainCircuit, TrendingUp, AlertTriangle
} from 'lucide-react';
import { documentsApi, projectsApi, siteReportsApi, tasksApi, mlApi } from '../../lib/api';
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
  const [mlData, setMlData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const budgetData = {
        budget: budget,
        spent: spent,
        completion: completion,
        months_elapsed: 6, // Mock for demo
        planned_duration_months: 12
      };
      
      const riskData = {
        completion: completion,
        budget_utilization: budget > 0 ? (spent / budget) * 100 : 0,
        months_elapsed: 6,
        planned_duration_months: 12,
        open_tasks: tasks.filter(t => t.status !== 'completed').length,
        blocked_tasks: tasks.filter(t => t.status === 'blocked').length
      };

      const [forecast, risk] = await Promise.all([
        mlApi.forecastBudget(budgetData),
        mlApi.classifyRisk(riskData)
      ]);
      setMlData({ forecast, risk });
    } catch (err) {
      console.error('ML Analysis failed', err);
      alert('Failed to connect to ML Service. Check your network connection or server status.');
    } finally {
      setAnalyzing(false);
    }
  };

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

      {/* AI Financial Advisor Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">AI Financial Advisor</h2>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Run ML Analysis'}
          </button>
        </div>

        {mlData ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {/* Forecast Card */}
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-3 font-semibold text-sm">
                <TrendingUp className="w-4 h-4" /> Cost Forecast
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Projected Total Cost</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(mlData.forecast.projected_total_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Projected Overrun</span>
                  <span className={`font-bold ${mlData.forecast.projected_overrun > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {mlData.forecast.projected_overrun > 0 ? '+' : ''}{formatCurrency(mlData.forecast.projected_overrun)} ({mlData.forecast.overrun_percentage}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded mt-2">
                  {mlData.forecast.recommendation}
                </p>
              </div>
            </div>

            {/* Risk Card */}
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-3 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" /> Risk Classification
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Predicted RAG Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase text-white ${ragColors[mlData.risk.predicted_rag] || 'bg-slate-500'}`}>
                    {mlData.risk.predicted_rag}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">ML Confidence</span>
                  <span className="font-bold text-slate-800 dark:text-white">{(mlData.risk.confidence * 100).toFixed(0)}%</span>
                </div>
                <ul className="text-xs text-slate-500 list-disc pl-4 space-y-1">
                  {mlData.risk.risk_factors.map((rf, i) => <li key={i}>{rf}</li>)}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">
            Click the button above to run a live scikit-learn projection on this project's spending and schedule data.
          </p>
        )}
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
