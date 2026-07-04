const { prisma } = require('../lib/prisma');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function idempotencyMiddleware(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  const key = req.get('Idempotency-Key');
  if (!key) return next();

  const userId = req.user?.id || null;
  const lookup = { key_userId_method_path: { key, userId, method: req.method, path: req.path } };

  const existing = await prisma.idempotencyKey.findUnique({ where: lookup }).catch(() => null);
  if (existing?.completedAt && existing.response) {
    res.status(existing.statusCode || 200);
    return res.json(JSON.parse(existing.response));
  }

  if (existing && !existing.completedAt) {
    return res.status(409).json({ error: 'Request with this Idempotency-Key is already in progress' });
  }

  await prisma.idempotencyKey.create({
    data: { key, userId, method: req.method, path: req.path },
  });

  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    await prisma.idempotencyKey.update({
      where: lookup,
      data: {
        statusCode: res.statusCode,
        response: JSON.stringify(body),
        completedAt: new Date(),
      },
    }).catch((err) => console.error('Idempotency persistence failed:', err.message));
    return originalJson(body);
  };

  return next();
}

module.exports = { idempotencyMiddleware };
