const express = require('express');
const { getDb } = require('../db/init');
const { requireRoles } = require('../lib/audit');

const router = express.Router();

router.get('/', requireRoles('CEO', 'ICT'), async (req, res) => {
  try {
    const db = await getDb();
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const stmt = db.prepare(`
      SELECT id, user_id, user_email, operation, model, record_id,
             changed_fields, previous_values, new_values, ip_address,
             user_agent, created_at
      FROM audit_logs
      ORDER BY id DESC
      LIMIT ?
    `);
    stmt.bind([limit]);

    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      for (const key of ['changed_fields', 'previous_values', 'new_values']) {
        if (row[key]) {
          try { row[key] = JSON.parse(row[key]); } catch {}
        }
      }
      rows.push(row);
    }
    stmt.free();
    res.json(rows);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
