const { createCrudRouter } = require('./crud');
const { getDb, saveDb } = require('../db/init');
const { writeAuditLog, requireRoles } = require('../lib/audit');

const reviewerRoles = ['CEO', 'FINANCE', 'HR', 'PROCUREMENT', 'OPERATIONS', 'ICT'];
const router = createCrudRouter('approvals', {
  allowedFilters: ['status', 'type'],
  createRoles: null,
  updateRoles: reviewerRoles,
  deleteRoles: reviewerRoles,
});

function execToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function hasColumn(db, table, column) {
  const rows = execToObjects(db.exec(`PRAGMA table_info(${table})`));
  return rows.some(row => row.name === column);
}

router.post('/:id/review', requireRoles(...reviewerRoles), async (req, res) => {
  try {
    const { status, review_notes = '' } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    if (status === 'rejected' && !review_notes.trim()) {
      return res.status(400).json({ error: 'Review notes are required when rejecting an approval' });
    }

    const db = await getDb();
    const previous = execToObjects(db.exec('SELECT * FROM approvals WHERE id = ?', [req.params.id]))[0];
    if (!previous) return res.status(404).json({ error: 'Approval not found' });

    const reviewedAtSql = hasColumn(db, 'approvals', 'reviewed_at') ? ', reviewed_at = CURRENT_TIMESTAMP' : '';
    db.run(
      `UPDATE approvals SET status = ?, reviewed_by = ?, review_notes = ?${reviewedAtSql} WHERE id = ?`,
      [status, req.user.id, review_notes.trim() || null, req.params.id]
    );
    saveDb();

    const updated = execToObjects(db.exec('SELECT * FROM approvals WHERE id = ?', [req.params.id]))[0];
    await writeAuditLog(req, {
      operation: 'REVIEW',
      model: 'approvals',
      recordId: req.params.id,
      previousValues: previous,
      newValues: updated,
    });

    res.json(updated);
  } catch (err) {
    console.error('POST /approvals/:id/review error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
