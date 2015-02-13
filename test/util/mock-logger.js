'use strict';
// Simulates the result of bunyan.createLogger()
function noop() {}
module.exports = {
  trace: noop,
  debug: noop,
  info: noop,
  error: noop,
  fatal: noop
}
