const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const { prisma } = require('../lib/prisma');

const router = express.Router();

function canManageData(user) {
  return ['CEO', 'DEPUTY_CEO', 'ICT'].includes(user.role);
}

router.post('/synthetic', async (req, res) => {
  if (!canManageData(req.user)) return res.status(403).json({ error: 'Synthetic data tools require CEO or ICT access' });

  execFile('npm', ['run', 'seed'], { cwd: path.join(__dirname, '..'), shell: true }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: error.message, stderr });
    res.json({ success: true, output: stdout });
  });
});

router.delete('/synthetic', async (req, res) => {
  try {
    if (!canManageData(req.user)) return res.status(403).json({ error: 'Synthetic data tools require CEO or ICT access' });

    const results = await prisma.$transaction([
      prisma.notification.deleteMany({ where: { isSynthetic: true } }),
      prisma.calendarEvent.deleteMany({ where: { isSynthetic: true } }),
      prisma.invoice.deleteMany({ where: { isSynthetic: true } }),
      prisma.contract.deleteMany({ where: { isSynthetic: true } }),
      prisma.procurementRecord.deleteMany({ where: { isSynthetic: true } }),
      prisma.message.deleteMany({ where: { isSynthetic: true } }),
      prisma.announcement.deleteMany({ where: { isSynthetic: true } }),
      prisma.siteReport.deleteMany({ where: { isSynthetic: true } }),
      prisma.approval.deleteMany({ where: { isSynthetic: true } }),
      prisma.document.deleteMany({ where: { isSynthetic: true } }),
      prisma.task.deleteMany({ where: { isSynthetic: true } }),
      prisma.project.deleteMany({ where: { isSynthetic: true } }),
      prisma.department.deleteMany({ where: { isSynthetic: true } }),
    ]);

    res.json({ success: true, deleted: results.reduce((sum, item) => sum + item.count, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
