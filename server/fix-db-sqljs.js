const fs = require('fs');
const initSqlJs = require('sql.js');

async function fix() {
  try {
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync('db/app.db');
    const db = new SQL.Database(filebuffer);

    db.run("ALTER TABLE tasks ADD COLUMN start_date TEXT;");
    db.run("ALTER TABLE tasks ADD COLUMN end_date TEXT;");
    db.run("ALTER TABLE site_reports ADD COLUMN spent REAL DEFAULT 0;");
    db.run("ALTER TABLE announcements ADD COLUMN project_id INTEGER;");
    db.run("ALTER TABLE announcements ADD COLUMN start_date TEXT;");
    db.run("ALTER TABLE announcements ADD COLUMN end_date TEXT;");

    const data = db.export();
    fs.writeFileSync('db/app.db', Buffer.from(data));
    console.log("Database successfully modified via sql.js!");
  } catch (e) {
    console.error(e);
  }
}

fix();
