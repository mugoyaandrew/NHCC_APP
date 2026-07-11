const express = require('express');
const { prisma } = require('../lib/prisma');
const { toApiShape } = require('./crud');
const router = express.Router();

// List sub-tasks for a task
router.get('/:taskId', async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const subtasks = await prisma.subTask.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
    res.json(toApiShape(subtasks));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create sub-task
router.post('/:taskId', async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { title, assignee_id } = req.body;
    const subtask = await prisma.subTask.create({ data: { title, taskId, assigneeId: assignee_id ? Number(assignee_id) : null } });
    res.status(201).json(toApiShape(subtask));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle sub-task done
router.put('/:id/toggle', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.subTask.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.subTask.update({
      where: { id },
      data: { isDone: !existing.isDone, completedAt: !existing.isDone ? new Date() : null, completedBy: !existing.isDone ? req.user.id : null }
    });
    res.json(toApiShape(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete sub-task
router.delete('/:id', async (req, res) => {
  try {
    await prisma.subTask.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
