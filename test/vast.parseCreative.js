'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseCreative = require('../vast').parseCreative
  .bind({
    log: require('./util/mock-logger'),
    parseLinear: function () { return {} },
    parseCompanionAds: function() { return {} },
    parseNonlinear: function() { return {} }
  })

describe('vast.parseCreative()', function () {
  it('throw when it has no children', function () {
    var tree = createDOM('<Creative/>')
    assert.throws(function () { parseCreative(tree) })
  })
  it('should return "id" as a string or unitialized', function () {
    var tree = createDOM('<Creative><Linear/></Creative>')
    assert(!('id' in parseCreative(tree)))
    tree.setAttribute('id', '  ')
    assert(!('id' in parseCreative(tree)))
    tree.setAttribute('id', 'abc')
    assert.strictEqual(parseCreative(tree).id, 'abc')
  })
  it('should return "sequence as a number or unitialized', function () {
    var tree = createDOM('<Creative><Linear/></Creative>')
    assert(!('sequence' in parseCreative(tree)))
    tree.setAttribute('sequence', '  ')
    assert(!('sequence' in parseCreative(tree)))
    tree.setAttribute('sequence', '3')
    assert.strictEqual(parseCreative(tree).sequence, 3)
  })
  it('should return ONE OF: linear, companion, nonlinear', function () {
    var tree = createDOM('<Creative><Linear/><CompanionAds/><Nonlinear/></Creative>')
    var actual = parseCreative(tree)
    assert(!('companion' in actual))
    assert(!('nonlinear' in actual))
    assert('linear' in actual)
  })
})
