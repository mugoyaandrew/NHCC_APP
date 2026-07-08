const express = require('express');
const { prisma } = require('../lib/prisma');
const { toApiShape } = require('./crud');

const router = express.Router();

function canManageUsers(user) {
  return ['CEO', 'DEPUTY_CEO', 'ICT'].includes(user.role);
}

router.get('/', async (req, res) => {
  try {
    if (!canManageUsers(req.user)) return res.status(403).json({ error: 'User management requires CEO or ICT access' });
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, email: true, fullName: true, role: true, department: true, isActive: true, twoFactor: true, createdAt: true, version: true },
    });
    res.json(toApiShape(users));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!canManageUsers(req.user)) return res.status(403).json({ error: 'User management requires CEO or ICT access' });
    const id = Number(req.params.id);
    const data = {};
    for (const key of ['email', 'full_name', 'role', 'department', 'is_active', 'two_factor']) {
      if (req.body[key] !== undefined) data[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = req.body[key];
    }
    data.updatedBy = req.user.id;
    const user = await prisma.user.update({ where: { id }, data: { ...data, version: { increment: 1 } } });
    const { passwordHash, ...safe } = user;
    res.json(toApiShape(safe));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!canManageUsers(req.user)) return res.status(403).json({ error: 'User management requires CEO or ICT access' });
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/dashboard', async (req, res) => {
  try {
    let projectWhere = { status: { in: ['planning', 'in_progress'] } };
    let taskWhere = {};
    let approvalWhere = { status: 'pending' };
    let docWhere = {};

    if (req.user.role === 'PROJECT_IMPLEMENTER') {
      projectWhere = { ...projectWhere, OR: [{ managerId: req.user.id }, { tasks: { some: { assigneeId: req.user.id } } }] };
      taskWhere = { assigneeId: req.user.id };
      docWhere = { uploadedBy: req.user.id };
      approvalWhere = { ...approvalWhere, requestedBy: req.user.id };
    }

    const [
      activeProjects,
      totalTasks,
      pendingApprovals,
      totalUsers,
      totalDocuments,
      unreadMessages,
      budgetAgg,
      projectsByRag,
      tasksByStatus,
      projectLocations,
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.approval.count({ where: approvalWhere }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.document.count({ where: docWhere }),
      prisma.message.count({ where: { isRead: false, recipientId: req.user.id } }),
      prisma.project.aggregate({ _sum: { budget: true, spent: true }, where: projectWhere }),
      prisma.project.groupBy({ by: ['ragStatus'], _count: { _all: true }, where: projectWhere }),
      prisma.task.groupBy({ by: ['status'], _count: { _all: true }, where: taskWhere }),
      prisma.project.groupBy({ by: ['location'], _count: { _all: true }, _sum: { budget: true, spent: true }, where: projectWhere }),
    ]);

    res.json({
      activeProjects,
      totalTasks,
      pendingApprovals,
      totalUsers,
      totalDocuments,
      unreadMessages,
      totalBudget: budgetAgg._sum.budget || 0,
      totalSpent: budgetAgg._sum.spent || 0,
      projectsByRag: projectsByRag.map((row) => ({ rag_status: row.ragStatus, count: row._count._all })),
      tasksByStatus: tasksByStatus.map((row) => ({ status: row.status, count: row._count._all })),
      projectLocations: projectLocations.map((row) => ({
        location: row.location,
        count: row._count._all,
        budget: row._sum.budget || 0,
        spent: row._sum.spent || 0,
      })),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/finara', async (req, res) => {
  try {
    const userId = req.user.id;
    const [income, expenses, accounts, expensesByCategory, expensesBySubcategory, incomeByCategory, recentExpenses, goalsProgress] = await Promise.all([
      prisma.income.aggregate({ where: { userId, isActive: true }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.account.aggregate({ where: { userId }, _sum: { balance: true } }),
      prisma.expense.groupBy({ by: ['category'], where: { userId }, _sum: { amount: true } }),
      prisma.expense.groupBy({ by: ['subcategory'], where: { userId }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.income.groupBy({ by: ['category'], where: { userId, isActive: true }, _sum: { amount: true } }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 }),
      prisma.goal.findMany({ where: { userId }, orderBy: { deadline: 'asc' } }),
    ]);

    res.json({
      totalIncome: income._sum.amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      totalBalance: accounts._sum.balance || 0,
      expensesByCategory: expensesByCategory.map((row) => ({ category: row.category, total: row._sum.amount || 0 })),
      expensesBySubcategory: expensesBySubcategory.map((row) => ({ subcategory: row.subcategory, total: row._sum.amount || 0 })),
      incomeByCategory: incomeByCategory.map((row) => ({ category: row.category, total: row._sum.amount || 0 })),
      recentExpenses: toApiShape(recentExpenses),
      goalsProgress: toApiShape(goalsProgress),
    });
  } catch (err) {
    console.error('Finara stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
