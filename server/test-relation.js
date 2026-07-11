const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.project.findMany({ where: { tasks: { some: { assigneeId: 1 } } } })
  .then(() => console.log('OK'))
  .catch(console.error)
  .finally(() => p.$disconnect());
