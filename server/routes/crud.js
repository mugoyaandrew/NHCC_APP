const express = require('express');
const { getDb, saveDb } = require('../db/init');

/**
 * sql.js helper: converts db.exec() result into array of objects
 */
function execToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function createCrudRouter(tableName, options = {}) {
  const router = express.Router();
  const { userScoped = false, allowedFilters = [] } = options;

  // LIST
  router.get('/', async (req, res) => {
    try {
      const db = await getDb();
      let sql = `SELECT * FROM ${tableName}`;
      const params = [];
      const conditions = [];

      if (userScoped) {
        conditions.push('user_id = ?');
        params.push(req.user.id);
      }

      for (const f of allowedFilters) {
        if (req.query[f] !== undefined && req.query[f] !== '') {
          conditions.push(`${f} = ?`);
          params.push(req.query[f]);
        }
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY id DESC';

      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      // Enrich with user names for NHCC entities
      if (!userScoped) {
        for (const row of rows) {
          if (row.manager_id || row.assignee_id || row.uploaded_by || row.requested_by || row.reported_by || row.author_id || row.sender_id || row.recipient_id) {
            // Get project name for tasks
            if (row.project_id && tableName !== 'projects') {
              const pr = db.exec('SELECT name FROM projects WHERE id = ?', [row.project_id]);
              row.project_name = pr.length > 0 ? pr[0].values[0][0] : null;
            }
            // Get user names
            const nameFields = { assignee_id: 'assignee_name', uploaded_by: 'uploader_name', requested_by: 'requester_name', reviewed_by: 'reviewer_name', reported_by: 'reporter_name', author_id: 'author_name', sender_id: 'sender_name', recipient_id: 'recipient_name', manager_id: 'manager_name' };
            for (const [idField, nameField] of Object.entries(nameFields)) {
              if (row[idField]) {
                const u = db.exec('SELECT full_name FROM users WHERE id = ?', [row[idField]]);
                row[nameField] = u.length > 0 ? u[0].values[0][0] : null;
              }
            }
          }
        }
      }

      res.json(rows);
    } catch (err) {
      console.error(`GET /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // CREATE
  router.post('/', async (req, res) => {
    try {
      const db = await getDb();
      const data = { ...req.body };
      if (userScoped) data.user_id = req.user.id;

      const cols = Object.keys(data);
      const vals = Object.values(data);
      const placeholders = cols.map(() => '?').join(', ');

      db.run(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`, vals);
      saveDb();

      const result = db.exec(`SELECT last_insert_rowid() as id`);
      const id = result[0].values[0][0];

      const row = db.exec(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
      const created = execToObjects(row)[0];
      res.status(201).json(created);
    } catch (err) {
      console.error(`POST /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // UPDATE
  router.put('/:id', async (req, res) => {
    try {
      const db = await getDb();
      const data = { ...req.body };
      delete data.id;
      delete data.user_id;

      const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
      const vals = [...Object.values(data), req.params.id];

      let sql = `UPDATE ${tableName} SET ${sets} WHERE id = ?`;
      if (userScoped) {
        sql += ' AND user_id = ?';
        vals.push(req.user.id);
      }

      db.run(sql, vals);
      saveDb();

      const row = db.exec(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      const updated = execToObjects(row)[0];
      res.json(updated || { id: req.params.id });
    } catch (err) {
      console.error(`PUT /${tableName}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const db = await getDb();
      let sql = `DELETE FROM ${tableName} WHERE id = ?`;
      const params = [req.params.id];
      if (userScoped) {
        sql += ' AND user_id = ?';
        params.push(req.user.id);
      }
      db.run(sql, params);
      saveDb();
      res.json({ success: true });
    } catch (err) {
      console.error(`DELETE /${tableName}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createCrudRouter };
