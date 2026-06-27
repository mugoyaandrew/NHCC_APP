const express = require('express');
const { getDb, saveDb } = require('../db/init');
const router = express.Router();

function execToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function execSingle(result) {
  const rows = execToObjects(result);
  return rows[0] || null;
}

// GET /api/users - list all users
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, email, full_name, role, department, is_active, two_factor, created_at FROM users ORDER BY id');
    res.json(execToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const data = { ...req.body };
    delete data.id;
    delete data.password_hash;
    delete data.password;

    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(data), req.params.id];
    db.run(`UPDATE users SET ${sets} WHERE id = ?`, vals);
    saveDb();

    const result = db.exec('SELECT id, email, full_name, role, department, is_active, two_factor, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(execSingle(result) || { id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/stats/dashboard - NHCC dashboard stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const db = await getDb();

    const activeProjects = db.exec("SELECT COUNT(*) as c FROM projects WHERE status IN ('planning','in_progress')");
    const totalTasks = db.exec('SELECT COUNT(*) as c FROM tasks');
    const pendingApprovals = db.exec("SELECT COUNT(*) as c FROM approvals WHERE status = 'pending'");
    const totalUsers = db.exec('SELECT COUNT(*) as c FROM users WHERE is_active = 1');
    const totalDocuments = db.exec('SELECT COUNT(*) as c FROM documents');
    const unreadMessages = db.exec('SELECT COUNT(*) as c FROM messages WHERE is_read = 0');
    const totalBudget = db.exec('SELECT COALESCE(SUM(budget),0) as t FROM projects');
    const totalSpent = db.exec('SELECT COALESCE(SUM(spent),0) as t FROM projects');

    const projectsByRag = db.exec('SELECT rag_status, COUNT(*) as count FROM projects GROUP BY rag_status');
    const tasksByStatus = db.exec('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
    const projectLocations = db.exec('SELECT location, COUNT(*) as count, SUM(budget) as budget, SUM(spent) as spent FROM projects GROUP BY location');

    res.json({
      activeProjects: activeProjects.length > 0 ? activeProjects[0].values[0][0] : 0,
      totalTasks: totalTasks.length > 0 ? totalTasks[0].values[0][0] : 0,
      pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals[0].values[0][0] : 0,
      totalUsers: totalUsers.length > 0 ? totalUsers[0].values[0][0] : 0,
      totalDocuments: totalDocuments.length > 0 ? totalDocuments[0].values[0][0] : 0,
      unreadMessages: unreadMessages.length > 0 ? unreadMessages[0].values[0][0] : 0,
      totalBudget: totalBudget.length > 0 ? totalBudget[0].values[0][0] : 0,
      totalSpent: totalSpent.length > 0 ? totalSpent[0].values[0][0] : 0,
      projectsByRag: execToObjects(projectsByRag),
      tasksByStatus: execToObjects(tasksByStatus),
      projectLocations: execToObjects(projectLocations),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/stats/finara - Finara dashboard stats
router.get('/stats/finara', async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;

    const totalIncome = db.exec('SELECT COALESCE(SUM(amount),0) as t FROM income WHERE user_id = ? AND is_active = 1', [userId]);
    const totalExpenses = db.exec('SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE user_id = ?', [userId]);
    const totalBalance = db.exec('SELECT COALESCE(SUM(balance),0) as t FROM accounts WHERE user_id = ?', [userId]);

    const expensesByCategory = db.exec('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category', [userId]);
    const expensesBySubcategory = db.exec('SELECT subcategory, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY subcategory ORDER BY total DESC', [userId]);
    const incomeByCategory = db.exec('SELECT category, SUM(amount) as total FROM income WHERE user_id = ? AND is_active = 1 GROUP BY category', [userId]);
    const recentExpenses = db.exec('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 10', [userId]);
    const goalsProgress = db.exec('SELECT * FROM goals WHERE user_id = ? ORDER BY deadline', [userId]);

    res.json({
      totalIncome: totalIncome.length > 0 ? totalIncome[0].values[0][0] : 0,
      totalExpenses: totalExpenses.length > 0 ? totalExpenses[0].values[0][0] : 0,
      totalBalance: totalBalance.length > 0 ? totalBalance[0].values[0][0] : 0,
      expensesByCategory: execToObjects(expensesByCategory),
      expensesBySubcategory: execToObjects(expensesBySubcategory),
      incomeByCategory: execToObjects(incomeByCategory),
      recentExpenses: execToObjects(recentExpenses),
      goalsProgress: execToObjects(goalsProgress),
    });
  } catch (err) {
    console.error('Finara stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
