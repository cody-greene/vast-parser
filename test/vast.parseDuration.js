'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var vast = require('../src/vast')
var createDOM = require('./util/mock-dom')

describe('vast.parseDuration()', function () {
  it('should throw when the node does not exist', function () {
    assert.throws(vast.parseDuration)
  })
  it('should throw when the node is empty', function () {
    var tree = createDOM('<Duration/>')
    assert.throws(vast.parseDuration.bind(null, tree))
  })
  it('should throw when the content is an invalid format', function () {
    var tree = createDOM('<Duration>99 problems</Duration>')
    assert.throws(vast.parseDuration.bind(null, tree))
  })
  it('should convert "HH:mm:ss" to milliseconds', function () {
    var tree = createDOM('<Duration>01:15:08</Duration>')
    var actual = vast.parseDuration(tree)
    assert.strictEqual(actual, 4508000)
  })
  it.skip('should convert "HH:mm:ss.SSS" to milliseconds', function () {
    var tree = createDOM('<Duration>01:15:08.025</Duration>')
    var actual = vast.parseDuration(tree)
    assert.strictEqual(actual, 4508025)
  })
})
