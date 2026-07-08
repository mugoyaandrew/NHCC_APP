const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- PROOF OF UPDATED_BY FIELD ---');
  const project = await prisma.project.findFirst({
    where: { updatedBy: { not: null } },
    select: { id: true, name: true, updatedBy: true, updatedAt: true }
  });
  console.log(project ? project : 'No project has been updated yet.');

  console.log('\n--- PROOF OF AUDIT LOG INTERCEPTOR ---');
  const audit = await prisma.auditLog.findFirst({
    orderBy: { id: 'desc' },
  });
  console.log(audit ? audit : 'No audit logs found yet.');
}

main().finally(() => prisma.$disconnect());
