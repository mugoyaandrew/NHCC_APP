require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const queries = [
  "ALTER TABLE tasks ADD COLUMN start_date TEXT;",
  "ALTER TABLE tasks ADD COLUMN end_date TEXT;",
  "ALTER TABLE site_reports ADD COLUMN spent REAL DEFAULT 0;",
  "ALTER TABLE announcements ADD COLUMN project_id INTEGER;",
  "ALTER TABLE announcements ADD COLUMN start_date TEXT;",
  "ALTER TABLE announcements ADD COLUMN end_date TEXT;"
];

async function main() {
  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log(`Success: ${q}`);
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log(`Column already exists: ${q}`);
      } else {
        console.error(`Error on query: ${q}`, e.message);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
