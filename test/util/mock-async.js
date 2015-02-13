'use strict';

// Simulate a successful, asynchronous, err-first callback
module.exports = function mockAsync(_, callback) {
  setTimeout(function () {
    callback(null, {})
  }, 1)
}
