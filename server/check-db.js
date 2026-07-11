require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const info = await prisma.$queryRawUnsafe('PRAGMA table_info(tasks)');
  console.log("Tasks columns:", info.map(c => c.name));
}

check().finally(() => prisma.$disconnect());
