'use strict';

var assert = require('assert')

/**
 * Buffer an entire stream and compare the result to an expected string
 * @param {stream.Readable} src
 * @param {string} expected
 * @param {function} done Callback, error-first
 */
module.exports = function easyStream(src, expected, done) {
  var buf = []
  src
    .on('error', done)
    .on('data', function (chunk) {
      buf.push(chunk)
    })
    .on('end', function () {
      var actual = Buffer.concat(buf).toString()
      assert.equal(actual, expected, 'Stream output should match')
      done()
    })
}
