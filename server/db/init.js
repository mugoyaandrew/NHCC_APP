const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'app.db');
let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }
  return dbInstance;
}

function saveDb() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function columnExists(db, tableName, columnName) {
  const result = db.exec(`PRAGMA table_info(${tableName})`);
  if (!result || result.length === 0) return false;
  const nameIndex = result[0].columns.indexOf('name');
  return result[0].values.some(row => row[nameIndex] === columnName);
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  if (!columnExists(db, tableName, columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

async function initializeDatabase() {
  const db = await getDb();
  
  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.run(schema);
  addColumnIfMissing(db, 'approvals', 'reviewed_at', 'DATETIME');

  // Keep existing demo databases aligned with the ASCII-safe seed values.
  const goalIconUpdates = [
    ['Shield', 'Emergency Fund'],
    ['Car', 'New Car'],
    ['Travel', 'Vacation Fund'],
    ['Growth', 'Investment Portfolio'],
  ];
  for (const [icon, title] of goalIconUpdates) {
    db.run('UPDATE goals SET icon = ? WHERE title = ?', [icon, title]);
  }

  // Check if already seeded
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = result.length > 0 ? result[0].values[0][0] : 0;
  if (userCount > 0) {
    saveDb();
    return;
  }

  console.log('Seeding database with demo data...');

  const hash = bcrypt.hashSync('password123', 10);

  // Seed users
  const users = [
    ['admin@nhcc.go.ug', hash, 'James Mukasa', 'CEO', 'OPERATIONS'],
    ['eng@nhcc.go.ug', hash, 'Sarah Nakamya', 'ENGINEERING', 'ENGINEERING'],
    ['finance@nhcc.go.ug', hash, 'David Ochieng', 'FINANCE', 'FINANCE'],
    ['hr@nhcc.go.ug', hash, 'Grace Auma', 'HR', 'HR'],
    ['ict@nhcc.go.ug', hash, 'Peter Ssempala', 'ICT', 'ICT'],
    ['procurement@nhcc.go.ug', hash, 'Mary Nalubega', 'PROCUREMENT', 'PROCUREMENT'],
    ['ops@nhcc.go.ug', hash, 'John Kato', 'OPERATIONS', 'OPERATIONS'],
    ['intern@nhcc.go.ug', hash, 'Rita Nambi', 'INTERN', 'ENGINEERING'],
    ['demo@finara.app', hash, 'Demo User', 'STAFF', 'OPERATIONS'],
  ];
  for (const u of users) {
    db.run('INSERT INTO users (email, password_hash, full_name, role, department, is_active) VALUES (?, ?, ?, ?, ?, 1)', u);
  }

  // Seed projects
  const projects = [
    ['Lubowa Housing Estate', 'Construction of 2,500 housing units in Lubowa', 'in_progress', 'green', 'Lubowa, Wakiso', 45000000000, 28000000000, 62, '2024-01-15', '2026-12-31', 2],
    ['Temangalo Phase II', 'Affordable housing development - Phase 2', 'in_progress', 'amber', 'Temangalo, Wakiso', 18000000000, 12500000000, 45, '2024-06-01', '2026-06-30', 2],
    ['Naalya Estates', 'Premium residential estate development', 'planning', 'green', 'Naalya, Kampala', 32000000000, 2000000000, 8, '2025-03-01', '2027-12-31', 2],
    ['Kampala Office Complex', 'Grade A office space development', 'in_progress', 'red', 'Kampala CBD', 55000000000, 42000000000, 78, '2023-01-01', '2025-12-31', 2],
    ['Entebbe Road Apartments', 'Mixed-use development along Entebbe Road', 'completed', 'green', 'Entebbe Road', 22000000000, 21500000000, 100, '2022-06-01', '2024-12-31', 2],
    ['Jinja Industrial Park', 'Industrial warehousing and logistics hub', 'on_hold', 'red', 'Jinja', 15000000000, 3000000000, 15, '2024-09-01', '2027-06-30', 2],
  ];
  for (const p of projects) {
    db.run('INSERT INTO projects (name, description, status, rag_status, location, budget, spent, completion, start_date, end_date, manager_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)', p);
  }

  // Seed tasks
  const tasks = [
    [1, 'Foundation inspection Block A', 'Complete structural inspection', 'done', 'high', 2, '2025-06-01'],
    [1, 'Electrical wiring Phase 1', 'Install electrical wiring for units 1-50', 'in_progress', 'high', 2, '2025-07-15'],
    [1, 'Plumbing installation Block B', 'Complete plumbing for Block B', 'in_progress', 'medium', 7, '2025-08-01'],
    [1, 'Landscaping design approval', 'Get landscape design approved', 'under_review', 'low', 2, '2025-07-01'],
    [2, 'Site clearing Phase 2', 'Clear remaining 5 acres', 'backlog', 'medium', 7, '2025-08-15'],
    [2, 'Environmental impact assessment', 'Complete EIA report', 'in_progress', 'high', 2, '2025-07-20'],
    [3, 'Architectural drawings', 'Complete final plans', 'under_review', 'high', 2, '2025-07-01'],
    [3, 'Tender documents preparation', 'Prepare tender documents', 'backlog', 'medium', 6, '2025-08-01'],
    [4, 'Glass facade installation', 'Install curtain wall floors 8-12', 'in_progress', 'high', 2, '2025-06-30'],
    [4, 'Fire safety certification', 'Obtain fire safety certificate', 'blocked', 'high', 7, '2025-06-15'],
    [4, 'Interior finishing Floor 5', 'Complete interior works', 'done', 'medium', 2, '2025-05-30'],
    [6, 'Land survey update', 'Update land survey', 'backlog', 'low', 2, '2025-09-01'],
  ];
  for (const t of tasks) {
    db.run('INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date) VALUES (?,?,?,?,?,?,?)', t);
  }

  // Seed documents
  const docs = [
    ['Lubowa EIA Report', 'report', 1, '/docs/lubowa_eia.pdf', 2400000, 2, '2026-01-15'],
    ['Construction Contract - Lubowa', 'contract', 1, '/docs/lubowa_contract.pdf', 1800000, 1, '2026-12-31'],
    ['Temangalo Tender Document', 'tender', 2, '/docs/temangalo_tender.pdf', 3200000, 6, '2025-12-31'],
    ['Naalya Architectural Plans', 'drawing', 3, '/docs/naalya_plans.pdf', 15000000, 2, null],
    ['HR Policy Manual 2025', 'policy', null, '/docs/hr_policy.pdf', 890000, 4, '2025-12-31'],
    ['Q2 Financial Report', 'financial', null, '/docs/q2_finance.pdf', 1200000, 3, null],
    ['Office Complex Site Photos', 'site_photo', 4, '/docs/office_photos.zip', 45000000, 2, null],
    ['Legal Opinion - Land Title', 'legal', 6, '/docs/legal_opinion.pdf', 560000, 1, '2025-09-30'],
  ];
  for (const d of docs) {
    db.run('INSERT INTO documents (title, type, project_id, file_path, file_size, uploaded_by, expiry_date) VALUES (?,?,?,?,?,?,?)', d);
  }

  // Seed approvals
  const approvals = [
    ['Budget increase - Lubowa Phase 3', 'budget', 'Request additional UGX 5B for Phase 3 materials', 2, 'pending', null],
    ['New hire - Senior Engineer', 'hr', 'Request to hire senior structural engineer', 4, 'approved', 1],
    ['Equipment purchase - Excavator', 'procurement', 'Purchase CAT 320 excavator for Temangalo site', 6, 'pending', null],
    ['Travel authorization - Jinja inspection', 'travel', 'Site inspection trip to Jinja Industrial Park', 7, 'approved', 1],
    ['Contract extension - Subcontractor', 'contract', 'Extend subcontractor agreement by 6 months', 2, 'rejected', 1],
  ];
  for (const a of approvals) {
    db.run('INSERT INTO approvals (title, type, description, requested_by, status, reviewed_by) VALUES (?,?,?,?,?,?)', a);
  }

  // Seed site reports
  const reports = [
    [1, '2025-06-25', 'sunny', 145, 62, 'Completed roofing on Block C. Started plastering Block A.', 'Cement (200 bags), Steel bars (5 tons)', 'Minor delay in steel delivery.', 2],
    [1, '2025-06-24', 'cloudy', 138, 61, 'Continued Block B plumbing. Electrical conduit Block A.', 'PVC pipes (500m), Electrical cable (800m)', 'None reported', 2],
    [2, '2025-06-25', 'rainy', 67, 45, 'Foundation excavation Sector 3. Survey marking.', 'Gravel (30 trucks), Hardcore (15 trucks)', 'Heavy rain delayed work by 3 hours.', 7],
    [4, '2025-06-25', 'sunny', 210, 78, 'Glass facade Floor 10. MEP works Floor 7-8.', 'Glass panels (45), Aluminum frames (45)', 'Fire safety inspection pending.', 2],
  ];
  for (const r of reports) {
    db.run('INSERT INTO site_reports (project_id, date, weather, manpower, completion, work_done, materials, issues, reported_by) VALUES (?,?,?,?,?,?,?,?,?)', r);
  }

  // Seed announcements
  const anns = [
    ['Q3 Town Hall Meeting', 'All staff are invited to the Q3 Town Hall meeting on July 15th at 10:00 AM. Agenda includes project updates and financial overview.', 'high', 1],
    ['New Safety Protocols', 'Updated safety protocols are now in effect across all sites. Please review guidelines and ensure compliance.', 'high', 2],
    ['Staff Appreciation Day', 'NHCC Staff Appreciation Day on August 1st. Activities include team building and awards ceremony.', 'normal', 4],
    ['System Maintenance Notice', 'ICT maintenance this Saturday 10 PM to 6 AM. Some services may be temporarily unavailable.', 'low', 5],
  ];
  for (const a of anns) {
    db.run('INSERT INTO announcements (title, content, priority, author_id) VALUES (?,?,?,?)', a);
  }

  // Seed messages
  const msgs = [
    [1, 2, 'Lubowa Progress Update', 'Sarah, please send me the latest progress report for Lubowa by end of week.', 1],
    [2, 1, 'Re: Lubowa Progress Update', 'Sure, I will compile the report by Friday. We are at 62% completion.', 0],
    [3, 1, 'Q2 Budget Review', 'The Q2 review shows we are 8% under budget on Temangalo. See attached report.', 0],
    [4, null, 'Leave Policy Update', 'Updated leave policy effective July 1st. Annual leave must be applied 2 weeks in advance.', 0],
  ];
  for (const m of msgs) {
    db.run('INSERT INTO messages (sender_id, recipient_id, subject, content, is_read) VALUES (?,?,?,?,?)', m);
  }

  // Seed Finara data (user_id=9)
  const incomes = [
    [9, 'Software Engineering Salary', 4500000, 'monthly', 'primary', 1],
    [9, 'Freelance Web Development', 1200000, 'monthly', 'secondary', 1],
    [9, 'Rental Income - Ntinda', 800000, 'monthly', 'passive', 1],
    [9, 'Stock Dividends', 350000, 'quarterly', 'passive', 1],
    [9, 'Side Hustle - Tutoring', 400000, 'monthly', 'secondary', 1],
  ];
  for (const i of incomes) {
    db.run('INSERT INTO income (user_id, source_name, amount, frequency, category, is_active) VALUES (?,?,?,?,?,?)', i);
  }

  const expenses = [
    [9, 'Monthly Rent', 1500000, 'needs', 'rent', '2025-06-01', 1],
    [9, 'Groceries - Week 1', 280000, 'needs', 'groceries', '2025-06-03', 0],
    [9, 'Electricity Bill', 95000, 'needs', 'utilities', '2025-06-05', 1],
    [9, 'Fuel & Transport', 320000, 'needs', 'transportation', '2025-06-10', 1],
    [9, 'Health Insurance', 200000, 'needs', 'healthcare', '2025-06-01', 1],
    [9, 'Dinner at Cafe Javas', 85000, 'wants', 'dining', '2025-06-08', 0],
    [9, 'Netflix Subscription', 36000, 'wants', 'subscriptions', '2025-06-01', 1],
    [9, 'New Shoes', 150000, 'wants', 'shopping', '2025-06-12', 0],
    [9, 'Emergency Fund', 500000, 'savings', 'emergency_fund', '2025-06-01', 1],
    [9, 'SACCO Savings', 300000, 'savings', 'investments', '2025-06-01', 1],
    [9, 'Groceries - Week 2', 310000, 'needs', 'groceries', '2025-06-10', 0],
    [9, 'Internet Bill', 120000, 'needs', 'utilities', '2025-06-15', 1],
  ];
  for (const e of expenses) {
    db.run('INSERT INTO expenses (user_id, description, amount, category, subcategory, date, is_recurring) VALUES (?,?,?,?,?,?,?)', e);
  }

  const goalData = [
    [9, 'Emergency Fund', 10000000, 6500000, '2025-12-31', 'Shield'],
    [9, 'New Car', 35000000, 12000000, '2026-06-30', 'Car'],
    [9, 'Vacation Fund', 5000000, 3200000, '2025-09-30', 'Travel'],
    [9, 'Investment Portfolio', 50000000, 18000000, '2027-12-31', 'Growth'],
  ];
  for (const g of goalData) {
    db.run('INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, icon) VALUES (?,?,?,?,?,?)', g);
  }

  const accountData = [
    [9, 'Main Checking', 'checking', 3450000, 'Stanbic Bank'],
    [9, 'Savings Account', 'savings', 8200000, 'Stanbic Bank'],
    [9, 'Mobile Money', 'mobile_money', 1250000, 'MTN MoMo'],
    [9, 'Fixed Deposit', 'fixed_deposit', 15000000, 'DFCU Bank'],
  ];
  for (const a of accountData) {
    db.run('INSERT INTO accounts (user_id, name, type, balance, institution) VALUES (?,?,?,?,?)', a);
  }

  const investmentData = [
    [9, 'Safaricom Shares', 'stocks', 5000000, 5800000, '2024-03-15'],
    [9, 'Treasury Bond 2027', 'bonds', 10000000, 10450000, '2024-01-10'],
    [9, 'SACCO Shares', 'mutual_fund', 3000000, 3350000, '2023-06-01'],
    [9, 'Bitcoin', 'crypto', 2000000, 2750000, '2024-08-20'],
  ];
  for (const i of investmentData) {
    db.run('INSERT INTO investments (user_id, name, type, amount, current_value, purchase_date) VALUES (?,?,?,?,?,?)', i);
  }

  saveDb();
  console.log('Database seeded successfully!');
}

module.exports = { getDb, initializeDatabase, saveDb };
