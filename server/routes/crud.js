const express = require('express');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../lib/prisma');
const { broadcastCrudEvent } = require('../lib/socket');

const routeModels = {
  income: 'Income',
  expenses: 'Expense',
  goals: 'Goal',
  accounts: 'Account',
  investments: 'Investment',
  projects: 'Project',
  tasks: 'Task',
  documents: 'Document',
  approvals: 'Approval',
  site_reports: 'SiteReport',
  announcements: 'Announcement',
  messages: 'Message',
  departments: 'Department',
  procurement_records: 'ProcurementRecord',
  contracts: 'Contract',
  invoices: 'Invoice',
  calendar_events: 'CalendarEvent',
  notifications: 'Notification',
};

const modelFields = new Map(
  Prisma.dmmf.datamodel.models.map((model) => [model.name, new Set(model.fields.map((field) => field.name))])
);

function delegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function toCamel(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function toSnake(key) {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function toApiShape(value) {
  if (Array.isArray(value)) return value.map(toApiShape);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  return Object.entries(value).reduce((acc, [key, val]) => {
    acc[toSnake(key)] = toApiShape(val);
    return acc;
  }, {});
}

function toPrismaData(modelName, input) {
  const fields = modelFields.get(modelName) || new Set();
  return Object.entries(input || {}).reduce((acc, [key, value]) => {
    const camelKey = toCamel(key);
    if (!fields.has(camelKey) || camelKey === 'id') return acc;
    if (value === '') {
      acc[camelKey] = null;
    } else {
      acc[camelKey] = value;
    }
    return acc;
  }, {});
}

async function enrichRows(rows, tableName) {
  const output = [];
  for (const row of rows) {
    const item = { ...row };

    if (item.projectId && tableName !== 'projects') {
      const project = await prisma.project.findUnique({ where: { id: Number(item.projectId) }, select: { name: true } });
      item.projectName = project?.name || null;
    }

    const userFields = {
      assigneeId: 'assigneeName',
      uploadedBy: 'uploaderName',
      requestedBy: 'requesterName',
      reviewedBy: 'reviewerName',
      reportedBy: 'reporterName',
      authorId: 'authorName',
      senderId: 'senderName',
      recipientId: 'recipientName',
      managerId: 'managerName',
    };

    for (const [idField, nameField] of Object.entries(userFields)) {
      if (item[idField]) {
        const user = await prisma.user.findUnique({ where: { id: Number(item[idField]) }, select: { fullName: true } });
        item[nameField] = user?.fullName || null;
      }
    }

    output.push(item);
  }
  return output;
}

function createCrudRouter(tableName, options = {}) {
  const router = express.Router();
  const { userScoped = false, allowedFilters = [] } = options;
  const modelName = routeModels[tableName];
  const delegate = prisma[delegateName(modelName)];

  router.get('/', async (req, res) => {
    try {
      const where = {};
      if (userScoped) where.userId = req.user.id;

      for (const filter of allowedFilters) {
        if (req.query[filter] !== undefined && req.query[filter] !== '') {
          const field = toCamel(filter);
          where[field] = ['id', 'projectId', 'assigneeId', 'userId'].includes(field)
            ? Number(req.query[filter])
            : req.query[filter];
        }
      }

      let rows = await delegate.findMany({ where, orderBy: { id: 'desc' } });
      if (!userScoped) rows = await enrichRows(rows, tableName);
      res.json(toApiShape(rows));
    } catch (err) {
      console.error(`GET /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const data = toPrismaData(modelName, req.body);
      const fields = modelFields.get(modelName) || new Set();
      if (userScoped) data.userId = req.user.id;
      if (fields.has('createdBy')) data.createdBy = req.user.id;
      if (fields.has('updatedBy')) data.updatedBy = req.user.id;

      const created = await delegate.create({ data });
      broadcastCrudEvent(tableName, 'created', toApiShape(created), req.user);
      res.status(201).json(toApiShape(created));
    } catch (err) {
      console.error(`POST /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const fields = modelFields.get(modelName) || new Set();
      const data = toPrismaData(modelName, req.body);
      delete data.userId;
      if (fields.has('updatedBy')) data.updatedBy = req.user.id;

      const where = userScoped ? { id, userId: req.user.id } : { id };
      const expectedVersion = req.body.version === undefined ? null : Number(req.body.version);

      let updated;
      if (expectedVersion && fields.has('version')) {
        const result = await delegate.updateMany({
          where: { ...where, version: expectedVersion },
          data: { ...data, version: { increment: 1 } },
        });
        if (result.count !== 1) {
          return res.status(409).json({ error: 'Record was changed by another request. Refresh and try again.' });
        }
        updated = await delegate.findUnique({ where: { id } });
      } else {
        updated = await delegate.update({ where: { id }, data: fields.has('version') ? { ...data, version: { increment: 1 } } : data });
      }

      broadcastCrudEvent(tableName, 'updated', toApiShape(updated), req.user);
      res.json(toApiShape(updated));
    } catch (err) {
      console.error(`PUT /${tableName}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (userScoped) {
        const existing = await delegate.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
      }
      await delegate.delete({ where: { id } });
      broadcastCrudEvent(tableName, 'deleted', { id }, req.user);
      res.json({ success: true });
    } catch (err) {
      console.error(`DELETE /${tableName}/:id error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createCrudRouter, toApiShape, toPrismaData };
