const express = require('express');
const { prisma } = require('../lib/prisma');
const { toApiShape } = require('./crud');

const router = express.Router();

function canViewAudit(user) {
  return ['CEO', 'DEPUTY_CEO', 'ICT'].includes(user.role);
}

router.get('/', async (req, res) => {
  try {
    if (!canViewAudit(req.user)) return res.status(403).json({ error: 'Audit logs require CEO or ICT access' });
    
    const logs = await prisma.auditLog.findMany({
      orderBy: { id: 'desc' },
      take: Math.min(Number(req.query.limit) || 100, 500)
    });
    
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    });
    const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user.email }), {});

    const mappedLogs = logs.map(log => {
      let parsedFields = [];
      try {
        if (log.changedFields) parsedFields = JSON.parse(log.changedFields);
      } catch (e) {}
      
      return {
        ...log,
        changedFields: parsedFields,
        user_email: log.userId ? (userMap[log.userId] || null) : null,
      };
    });

    res.json(toApiShape(mappedLogs));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
