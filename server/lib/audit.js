const { getDb, saveDb } = require('../db/init');

function safeJson(value) {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: 'Unable to serialize audit value' });
  }
}

function getChangedFields(previousValues, newValues) {
  if (!previousValues || !newValues) return [];
  const fields = new Set([...Object.keys(previousValues), ...Object.keys(newValues)]);
  return [...fields].filter(field => previousValues[field] !== newValues[field]);
}

async function writeAuditLog(req, details) {
  const db = await getDb();
  const previousValues = details.previousValues || null;
  const newValues = details.newValues || null;
  const changedFields = details.changedFields || getChangedFields(previousValues, newValues);

  db.run(
    `INSERT INTO audit_logs (
      user_id, user_email, operation, model, record_id, changed_fields,
      previous_values, new_values, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user?.id || null,
      req.user?.email || null,
      details.operation,
      details.model,
      details.recordId === undefined || details.recordId === null ? null : String(details.recordId),
      safeJson(changedFields),
      safeJson(previousValues),
      safeJson(newValues),
      req.ip || req.socket?.remoteAddress || null,
      req.headers['user-agent'] || null,
    ]
  );
  saveDb();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { writeAuditLog, requireRoles };
