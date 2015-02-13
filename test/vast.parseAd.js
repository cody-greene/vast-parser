'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var mockAsync = require('./util/mock-async')
var parseAd = require('../vast').parseAd
  .bind({
    log: require('./util/mock-logger'),
    parseInLine: mockAsync,
    parseWrapper: mockAsync
  })

describe('vast.parseAd()', function () {
  it('should fail when it has no children', function (next) {
    var tree = createDOM('<Ad/>')
    parseAd(tree, function (err) {
      assert(err)
      next()
    })
  })
  it('should return "id" & "sequence" unitialized', function (next) {
    var tree = createDOM('<Ad><InLine/></Ad>')
    parseAd(tree, function (err, res) {
      assert.ifError(err)
      assert(!('id' in res))
      assert(!('sequence' in res))
      next()
    })
  })
  it('should return "sequence" as a number', function (next) {
    var tree = createDOM('<Ad sequence="3"><InLine/></Ad>')
    parseAd(tree, function (err, res) {
      assert(!err)
      assert.strictEqual(res.sequence, 3)
      next()
    })
  })
  it('should return "id" as a string', function (next) {
    var tree = createDOM('<Ad id="foo"><InLine/></Ad>')
    parseAd(tree, function (err, res) {
      assert(!err)
      assert.strictEqual(res.id, 'foo')
      next()
    })
  })
})
