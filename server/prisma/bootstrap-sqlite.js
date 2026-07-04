const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '..', 'db', 'app.db');
const BACKUP_PATH = path.join(__dirname, '..', 'db', `app.db.pre-enterprise-${Date.now()}.bak`);

const schema = `
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS income;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS investments;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS site_reports;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS procurement_records;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS idempotency_keys;
DROP TABLE IF EXISTS report_settings;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF',
  department TEXT NOT NULL DEFAULT 'OPERATIONS',
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  two_factor BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  amount REAL NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  category TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'needs',
  subcategory TEXT,
  date TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  deadline TEXT,
  icon TEXT NOT NULL DEFAULT 'target',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking',
  balance REAL NOT NULL DEFAULT 0,
  institution TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stocks',
  amount REAL NOT NULL,
  current_value REAL NOT NULL,
  purchase_date TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  rag_status TEXT NOT NULL DEFAULT 'green',
  location TEXT,
  budget REAL NOT NULL DEFAULT 0,
  spent REAL NOT NULL DEFAULT 0,
  completion INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  manager_id INTEGER,
  department TEXT NOT NULL DEFAULT 'ENGINEERING',
  site TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id INTEGER,
  due_date TEXT,
  department TEXT NOT NULL DEFAULT 'ENGINEERING',
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'report',
  project_id INTEGER,
  file_path TEXT,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by INTEGER,
  expiry_date TEXT,
  department TEXT NOT NULL DEFAULT 'OPERATIONS',
  mime_type TEXT,
  version_no INTEGER NOT NULL DEFAULT 1,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  requested_by INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by INTEGER,
  review_notes TEXT,
  department TEXT NOT NULL DEFAULT 'OPERATIONS',
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE site_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  date TEXT NOT NULL,
  weather TEXT NOT NULL DEFAULT 'sunny',
  manpower INTEGER NOT NULL DEFAULT 0,
  completion INTEGER NOT NULL DEFAULT 0,
  work_done TEXT,
  materials TEXT,
  issues TEXT,
  reported_by INTEGER,
  site TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  author_id INTEGER,
  department TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT 0,
  channel TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  head_role TEXT,
  site TEXT,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE procurement_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  supplier TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  project_id INTEGER,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  party TEXT NOT NULL,
  value REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TEXT,
  expiry_date TEXT,
  project_id INTEGER,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  supplier TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  project_id INTEGER,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  department TEXT,
  site TEXT,
  project_id INTEGER,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT 0,
  is_synthetic BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  record_id TEXT,
  changed_fields TEXT,
  previous_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idempotency_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  user_id INTEGER,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  response TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE(key, user_id, method, path)
);

CREATE TABLE report_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'CEO Weekly Executive Report',
  recipients TEXT NOT NULL DEFAULT 'ceo@nhcc.go.ug',
  enabled BOOLEAN NOT NULL DEFAULT 1,
  schedule TEXT NOT NULL DEFAULT '0 8 * * 0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX audit_logs_model_record_id_idx ON audit_logs(model, record_id);
`;

async function main() {
  const SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, BACKUP_PATH);
  const db = new SQL.Database();
  db.run(schema);
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  console.log(`SQLite database bootstrapped at ${DB_PATH}`);
  if (fs.existsSync(BACKUP_PATH)) console.log(`Previous database backed up at ${BACKUP_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
