const { runWithRequestContext } = require('../lib/async-context');

function requestContextMiddleware(req, res, next) {
  runWithRequestContext(req, next);
}

module.exports = { requestContextMiddleware };
