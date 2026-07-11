const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { role: true }, distinct: ['role'] })
  .then(console.log)
  .finally(() => p.$disconnect());
