const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

function runWithRequestContext(req, next) {
  requestContext.run({
    user: req.user || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  }, next);
}

function getRequestContext() {
  return requestContext.getStore() || {};
}

module.exports = { runWithRequestContext, getRequestContext };
