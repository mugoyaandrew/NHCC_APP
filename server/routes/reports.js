const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/init');
const { requireRoles, writeAuditLog } = require('../lib/audit');

const router = express.Router();
const REPORT_DIR = path.join(__dirname, '..', 'reports');

function execToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function singleValue(result, fallback = 0) {
  return result?.[0]?.values?.[0]?.[0] ?? fallback;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  return `UGX ${Math.round(Number(value || 0)).toLocaleString('en-US')}`;
}

function buildRows(rows, columns) {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length}" class="empty">No records found</td></tr>`;
  }
  return rows.map(row => (
    `<tr>${columns.map(col => `<td>${escapeHtml(row[col.key])}</td>`).join('')}</tr>`
  )).join('');
}

async function buildCeoReport(req) {
  const db = await getDb();
  const activeProjects = singleValue(db.exec("SELECT COUNT(*) FROM projects WHERE status IN ('planning','in_progress')"));
  const pendingApprovals = singleValue(db.exec("SELECT COUNT(*) FROM approvals WHERE status = 'pending'"));
  const redProjects = singleValue(db.exec("SELECT COUNT(*) FROM projects WHERE rag_status = 'red'"));
  const totalBudget = singleValue(db.exec('SELECT COALESCE(SUM(budget),0) FROM projects'));
  const totalSpent = singleValue(db.exec('SELECT COALESCE(SUM(spent),0) FROM projects'));
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const riskProjects = execToObjects(db.exec(`
    SELECT name, location, rag_status, budget, spent, completion
    FROM projects
    ORDER BY CASE rag_status WHEN 'red' THEN 1 WHEN 'amber' THEN 2 ELSE 3 END, completion ASC
    LIMIT 10
  `)).map(project => ({
    ...project,
    budget: formatCurrency(project.budget),
    spent: formatCurrency(project.spent),
    completion: `${project.completion || 0}%`,
  }));

  const upcomingTasks = execToObjects(db.exec(`
    SELECT tasks.title, tasks.priority, tasks.status, tasks.due_date, projects.name AS project
    FROM tasks
    LEFT JOIN projects ON tasks.project_id = projects.id
    WHERE tasks.due_date IS NOT NULL AND tasks.status != 'done'
    ORDER BY tasks.due_date ASC
    LIMIT 10
  `));

  const generatedAt = new Date().toISOString();
  const filename = `ceo-report-${generatedAt.slice(0, 10)}-${Date.now()}.html`;
  const reportPath = path.join(REPORT_DIR, filename);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NHCC CEO Weekly Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; background: #f8fafc; }
    main { max-width: 1040px; margin: 0 auto; background: white; padding: 32px; border: 1px solid #e5e7eb; }
    h1 { margin: 0 0 4px; color: #1e3a8a; }
    .meta { color: #64748b; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
    .card { border: 1px solid #e5e7eb; padding: 16px; background: #f8fafc; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 24px; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; color: #475569; }
    section { margin-top: 28px; }
    .empty { color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <main>
    <h1>NHCC CEO Weekly Report</h1>
    <div class="meta">Generated ${escapeHtml(generatedAt)} by ${escapeHtml(req.user?.email || 'system')}</div>
    <div class="grid">
      <div class="card"><div class="label">Active Projects</div><div class="value">${activeProjects}</div></div>
      <div class="card"><div class="label">Pending Approvals</div><div class="value">${pendingApprovals}</div></div>
      <div class="card"><div class="label">Red Projects</div><div class="value">${redProjects}</div></div>
      <div class="card"><div class="label">Budget Utilization</div><div class="value">${utilization}%</div></div>
    </div>
    <section>
      <h2>Financial Summary</h2>
      <p>Total Budget: <strong>${formatCurrency(totalBudget)}</strong></p>
      <p>Total Spent: <strong>${formatCurrency(totalSpent)}</strong></p>
      <p>Remaining: <strong>${formatCurrency(totalBudget - totalSpent)}</strong></p>
    </section>
    <section>
      <h2>Top Risk Projects</h2>
      <table>
        <thead><tr><th>Name</th><th>Location</th><th>RAG</th><th>Budget</th><th>Spent</th><th>Completion</th></tr></thead>
        <tbody>${buildRows(riskProjects, [
          { key: 'name' }, { key: 'location' }, { key: 'rag_status' },
          { key: 'budget' }, { key: 'spent' }, { key: 'completion' },
        ])}</tbody>
      </table>
    </section>
    <section>
      <h2>Upcoming Deadlines</h2>
      <table>
        <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead>
        <tbody>${buildRows(upcomingTasks, [
          { key: 'title' }, { key: 'project' }, { key: 'priority' },
          { key: 'status' }, { key: 'due_date' },
        ])}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(reportPath, html, 'utf8');

  return {
    generatedAt,
    filename,
    html,
    metrics: { activeProjects, pendingApprovals, redProjects, totalBudget, totalSpent, utilization },
  };
}

router.post('/ceo', requireRoles('CEO', 'FINANCE', 'ICT'), async (req, res) => {
  try {
    const report = await buildCeoReport(req);
    await writeAuditLog(req, {
      operation: 'REPORT',
      model: 'ceo_report',
      recordId: report.filename,
      newValues: report.metrics,
    });
    res.status(201).json(report);
  } catch (err) {
    console.error('CEO report error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
