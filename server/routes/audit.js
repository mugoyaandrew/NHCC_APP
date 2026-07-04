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
      take: Math.min(Number(req.query.limit) || 100, 500),
    });
    res.json(toApiShape(logs));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
