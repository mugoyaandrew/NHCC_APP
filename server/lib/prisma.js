const { PrismaClient } = require('@prisma/client');
const { getRequestContext } = require('./async-context');

const prismaBase = new PrismaClient();

const AUDITED_OPERATIONS = new Set(['create', 'update', 'delete']);
const SKIP_MODELS = new Set(['AuditLog', 'IdempotencyKey']);

function safeJson(value) {
  if (value === undefined) return null;
  return JSON.stringify(value, (_, current) => {
    if (current instanceof Date) return current.toISOString();
    return current;
  });
}

function changedFields(previous, next) {
  if (!previous || !next) return Object.keys(next || previous || {});
  return Object.keys(next).filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]));
}

const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!AUDITED_OPERATIONS.has(operation) || SKIP_MODELS.has(model)) {
          return query(args);
        }

        const ctx = getRequestContext();
        const delegate = prismaBase[model.charAt(0).toLowerCase() + model.slice(1)];
        let previous = null;

        if ((operation === 'update' || operation === 'delete') && args?.where?.id && delegate?.findUnique) {
          previous = await delegate.findUnique({ where: { id: args.where.id } }).catch(() => null);
        }

        const result = await query(args);
        const next = operation === 'delete' ? null : result;

        await prismaBase.auditLog.create({
          data: {
            userId: ctx.user?.id || null,
            operation: operation.toUpperCase(),
            model,
            recordId: String(result?.id || args?.where?.id || ''),
            changedFields: safeJson(changedFields(previous, next)),
            previousValues: safeJson(previous),
            newValues: safeJson(next),
            ipAddress: ctx.ipAddress || null,
            userAgent: ctx.userAgent || null,
          },
        }).catch((err) => {
          console.error('Audit log write failed:', err.message);
        });

        return result;
      },
    },
  },
});

module.exports = { prisma };
