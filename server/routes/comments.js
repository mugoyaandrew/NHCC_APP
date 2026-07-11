const express = require('express');
const { prisma } = require('../lib/prisma');
const { toApiShape } = require('./crud');
const router = express.Router();

router.get('/:taskId', async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const comments = await prisma.comment.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
    // Enrich with user names
    const enriched = [];
    for (const c of comments) {
      const user = await prisma.user.findUnique({ where: { id: c.userId }, select: { fullName: true } });
      enriched.push({ ...c, userName: user?.fullName || 'Unknown' });
    }
    res.json(toApiShape(enriched));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:taskId', async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { content, parent_id } = req.body;
    const comment = await prisma.comment.create({ data: { content, taskId, userId: req.user.id, parentId: parent_id ? Number(parent_id) : null } });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { fullName: true } });
    res.status(201).json(toApiShape({ ...comment, userName: user?.fullName }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.comment.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
