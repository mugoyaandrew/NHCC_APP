const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:../db/app.db';

const { authMiddleware } = require('./middleware/auth');
const { requestContextMiddleware } = require('./middleware/request-context');
const { idempotencyMiddleware } = require('./middleware/idempotency');
const { createCrudRouter } = require('./routes/crud');
const { initSocket } = require('./lib/socket');
const { scheduleCeoReports } = require('./jobs/ceo-report');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const uploadRoutes = require('./routes/uploads');
const seedRoutes = require('./routes/seed');
const reportRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const protectedMiddleware = [authMiddleware, requestContextMiddleware, idempotencyMiddleware];

app.use('/api/auth', authRoutes);
app.use('/api/users', protectedMiddleware, userRoutes);
app.use('/api/audit', protectedMiddleware, auditRoutes);
app.use('/api/uploads', protectedMiddleware, uploadRoutes);
app.use('/api/seed', protectedMiddleware, seedRoutes);
app.use('/api/reports', protectedMiddleware, reportRoutes);

app.use('/api/income', protectedMiddleware, createCrudRouter('income', { userScoped: true, allowedFilters: ['category', 'frequency', 'is_active'] }));
app.use('/api/expenses', protectedMiddleware, createCrudRouter('expenses', { userScoped: true, allowedFilters: ['category', 'subcategory', 'is_recurring'] }));
app.use('/api/goals', protectedMiddleware, createCrudRouter('goals', { userScoped: true }));
app.use('/api/accounts', protectedMiddleware, createCrudRouter('accounts', { userScoped: true, allowedFilters: ['type'] }));
app.use('/api/investments', protectedMiddleware, createCrudRouter('investments', { userScoped: true, allowedFilters: ['type'] }));

app.use('/api/projects', protectedMiddleware, createCrudRouter('projects', { allowedFilters: ['status', 'rag_status', 'location', 'department', 'site'] }));
app.use('/api/tasks', protectedMiddleware, createCrudRouter('tasks', { allowedFilters: ['status', 'priority', 'project_id', 'assignee_id', 'department'] }));
app.use('/api/documents', protectedMiddleware, createCrudRouter('documents', { allowedFilters: ['type', 'project_id', 'department'] }));
app.use('/api/approvals', protectedMiddleware, createCrudRouter('approvals', { allowedFilters: ['status', 'type', 'department'] }));
app.use('/api/site-reports', protectedMiddleware, createCrudRouter('site_reports', { allowedFilters: ['project_id', 'weather', 'site'] }));
app.use('/api/announcements', protectedMiddleware, createCrudRouter('announcements', { allowedFilters: ['priority', 'department'] }));
app.use('/api/messages', protectedMiddleware, createCrudRouter('messages', { allowedFilters: ['is_read', 'channel'] }));
app.use('/api/departments', protectedMiddleware, createCrudRouter('departments', { allowedFilters: ['site'] }));
app.use('/api/procurement-records', protectedMiddleware, createCrudRouter('procurement_records', { allowedFilters: ['status', 'category', 'project_id'] }));
app.use('/api/contracts', protectedMiddleware, createCrudRouter('contracts', { allowedFilters: ['status', 'project_id'] }));
app.use('/api/invoices', protectedMiddleware, createCrudRouter('invoices', { allowedFilters: ['status', 'project_id'] }));
app.use('/api/calendar-events', protectedMiddleware, createCrudRouter('calendar_events', { allowedFilters: ['type', 'department', 'site', 'project_id'] }));
app.use('/api/notifications', protectedMiddleware, createCrudRouter('notifications', { allowedFilters: ['user_id', 'is_read', 'type'] }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'prisma-sqlite' });
});

initSocket(server);
scheduleCeoReports();

server.listen(PORT, () => {
  console.log(`\nNHCC Enterprise API running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log('Demo accounts: admin@nhcc.go.ug / password123, demo@finara.app / password123\n');
});
