const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { prisma } = require('../lib/prisma');

const REPORT_DIR = path.join(__dirname, '..', 'reports');

function money(value) {
  return `UGX ${Number(value || 0).toLocaleString('en-UG')}`;
}

function renderTemplate(template, data) {
  return Object.entries(data).reduce((html, [key, value]) => html.replaceAll(`{{${key}}}`, String(value)), template);
}

async function generateCeoReport() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const [activeProjects, pendingApprovals, totals, redProjects, risks, deadlines] = await Promise.all([
    prisma.project.count({ where: { status: { in: ['planning', 'in_progress'] } } }),
    prisma.approval.count({ where: { status: 'pending' } }),
    prisma.project.aggregate({ _sum: { budget: true, spent: true } }),
    prisma.project.count({ where: { ragStatus: 'red' } }),
    prisma.project.findMany({ where: { ragStatus: { in: ['red', 'amber'] } }, orderBy: { spent: 'desc' }, take: 10 }),
    prisma.task.findMany({ where: { status: { not: 'done' } }, orderBy: { dueDate: 'asc' }, take: 10 }),
  ]);

  const totalBudget = totals._sum.budget || 0;
  const totalSpent = totals._sum.spent || 0;
  const template = fs.readFileSync(path.join(__dirname, '..', 'templates', 'ceo-report.html'), 'utf8');
  const html = renderTemplate(template, {
    generatedAt: new Date().toLocaleString('en-UG'),
    activeProjects,
    pendingApprovals,
    budgetUtilisation: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
    redProjects,
    riskRows: risks.map((project) => `<tr><td>${project.name}</td><td>${project.location || ''}</td><td>${project.ragStatus}</td><td>${money(project.budget)}</td><td>${money(project.spent)}</td></tr>`).join(''),
    deadlineRows: deadlines.map((task) => `<tr><td>${task.title}</td><td>${task.priority}</td><td>${task.dueDate || ''}</td></tr>`).join(''),
  });

  const filename = `ceo-report-${new Date().toISOString().slice(0, 10)}.html`;
  const filePath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filePath, html);
  return { filename, path: filePath, html };
}

function scheduleCeoReports() {
  cron.schedule('0 8 * * 0', () => {
    generateCeoReport().catch((err) => console.error('CEO report generation failed:', err));
  }, { timezone: 'Africa/Kampala' });
}

module.exports = { generateCeoReport, scheduleCeoReports };
