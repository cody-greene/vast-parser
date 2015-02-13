'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseMediaFiles = require('../vast').parseMediaFiles
  .bind({
    log: require('./util/mock-logger'),
    parseMediaFile: function () { return true }
  })

describe('vast.parseMediaFiles()', function () {
  it('should throw when it has no children', function () {
    var tree = createDOM('<MediaFiles/>')
    assert.throws(function () { parseMediaFiles(tree) })
  })
  it('should map each child to a new item', function () {
    var tree = createDOM([
      '<MediaFiles>',
        '<MediaFile/>',
        '<ExtraNode/>',
        '<MediaFile/>',
        '<MediaFile/>',
      '</MediaFiles>'
    ].join(''))
    var actual = parseMediaFiles(tree)
    assert.equal(actual.length, 3)
  })
})
