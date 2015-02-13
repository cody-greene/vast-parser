'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var Parser = require('../parser')

describe('Parser.settle()', function () {
  it('should add values to the response object', function () {
    Parser.settle(['myval'], function iterator(item, nextItem) {
      nextItem(null, item)
    }, function done(acc) {
      assert.deepEqual(acc, [{err: null, val: 'myval'}])
    })
  })

  it('should add errors to the response object', function () {
    Parser.settle(['myval'], function iterator(item, nextItem) {
      nextItem('FAKE_ERR', null)
    }, function done(acc) {
      assert.deepEqual(acc, [{err: 'FAKE_ERR', val: null}])
    })
  })

  it('should return the async-task results in order', function (next) {
    Parser.settle([
      {delay: 40, val: 1},
      {delay: 20, val: 2},
      {delay: 10, val: 3},
      {delay: 30, val: 4}
    ], function iterator(item, nextItem) {
     setTimeout(function () {
       nextItem(null, item.val)
     }, item.delay)
    }, function done(acc) {
      assert.deepEqual(acc, [
        {err: null, val: 1},
        {err: null, val: 2},
        {err: null, val: 3},
        {err: null, val: 4}
      ])
      next()
    })
  })

  it('should invoke the iterator with context', function () {
    Parser.settle([], function iterator(item, nextItem) {
      assert.strictEqual(this, Parser)
      nextItem()
    }, function noop() {})
  })

  it('should invoke the callback with context', function () {
    Parser.settle([], function (item, nextItem) {
      nextItem()
    }, function done() {
      assert.strictEqual(this, Parser)
    })
  })
})
