'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var util = require('../src/util')
var createDOM = require('./util/mock-dom')

describe('util.getChildren()', function () {
  it('should return an empty array when no children are found', function () {
    var single = createDOM('<Parent/>')
    var actual = util.getChildren(single, 'child')
    assert.deepEqual(actual, [])
  })
  it('should return NULL when firstOnly:true and no children are found', function () {
    var single = createDOM('<Parent/>')
    var actual = util.getChildren(single, 'child', true)
    assert.strictEqual(actual, null)
  })
  it('should ignore text nodes', function () {
    var treeWithWhitespace = createDOM('<Parent> <Child/> </Parent>')
    var actual = util.getChildren(treeWithWhitespace, 'child')
    assert.equal(actual.length, 1)
  })
  it('should return all matching children', function () {
    var tree = createDOM('<Parent><Child/><OtherChild/><Child/><Child/></Parent>')
    var actual = util.getChildren(tree, 'child')
    assert.equal(actual.length, 3)
  })
  it('should preserve order', function () {
    var tree = createDOM('<Parent><Child id="0"/><Child id="2"/><Child id="1"/></Parent>')
    var actual = util.getChildren(tree, 'child')
      .map(function (node) { return node.getAttribute('id') })
      .join(' ')
    assert.strictEqual(actual, '0 2 1')
  })
})
