'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseCreatives = require('../vast').parseCreatives
  .bind({
    log: require('./util/mock-logger'),
    parseCreative: function () { return true }
  })

describe('vast.parseCreatives()', function () {
  it('should throw when it has no children', function () {
    var tree = createDOM('<Creatives/>')
    assert.throws(function () { parseCreatives(tree) })
  })
  it('should map each child to a new item', function () {
    var tree = createDOM('<Creatives><Creative/><ExtraNode/><Creative/><Creative/></Creatives>')
    var actual = parseCreatives(tree)
    assert.equal(actual.length, 3)
  })
})
