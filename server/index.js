const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db/init');
const { authMiddleware } = require('./middleware/auth');
const { createCrudRouter } = require('./routes/crud');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/reports');
const approvalRoutes = require('./routes/approvals');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

async function start() {
  // Initialize database (async with sql.js)
  await initializeDatabase();

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes
  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/audit', authMiddleware, auditRoutes);
  app.use('/api/reports', authMiddleware, reportRoutes);

  // Finara entity routes (user-scoped)
  app.use('/api/income', authMiddleware, createCrudRouter('income', { userScoped: true, allowedFilters: ['category', 'frequency', 'is_active'] }));
  app.use('/api/expenses', authMiddleware, createCrudRouter('expenses', { userScoped: true, allowedFilters: ['category', 'subcategory', 'is_recurring'] }));
  app.use('/api/goals', authMiddleware, createCrudRouter('goals', { userScoped: true }));
  app.use('/api/accounts', authMiddleware, createCrudRouter('accounts', { userScoped: true, allowedFilters: ['type'] }));
  app.use('/api/investments', authMiddleware, createCrudRouter('investments', { userScoped: true, allowedFilters: ['type'] }));

  // NHCC entity routes (shared, not user-scoped)
  app.use('/api/projects', authMiddleware, createCrudRouter('projects', { allowedFilters: ['status', 'rag_status', 'location'], writeRoles: ['CEO', 'ENGINEERING', 'OPERATIONS', 'ICT'] }));
  app.use('/api/tasks', authMiddleware, createCrudRouter('tasks', { allowedFilters: ['status', 'priority', 'project_id', 'assignee_id'], writeRoles: ['CEO', 'ENGINEERING', 'OPERATIONS', 'ICT'] }));
  app.use('/api/documents', authMiddleware, createCrudRouter('documents', { allowedFilters: ['type', 'project_id'], writeRoles: ['CEO', 'ICT', 'ENGINEERING', 'OPERATIONS', 'FINANCE', 'PROCUREMENT', 'HR'] }));
  app.use('/api/approvals', authMiddleware, approvalRoutes);
  app.use('/api/site-reports', authMiddleware, createCrudRouter('site_reports', { allowedFilters: ['project_id', 'weather'], writeRoles: ['CEO', 'ENGINEERING', 'OPERATIONS', 'ICT'] }));
  app.use('/api/announcements', authMiddleware, createCrudRouter('announcements', { allowedFilters: ['priority'], writeRoles: ['CEO', 'HR', 'ICT'] }));
  app.use('/api/messages', authMiddleware, createCrudRouter('messages', { allowedFilters: ['is_read'] }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`\nNHCC + Finara API Server running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`\nDemo accounts:`);
    console.log(`   NHCC Admin:  admin@nhcc.go.ug / password123`);
    console.log(`   Finara Demo: demo@finara.app / password123\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
