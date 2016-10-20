'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseMediaFile = require('../src/vast').parseMediaFile
  .bind({
    log: require('./util/mock-logger')
  })

describe('vast.parseMediaFile()', function () {
  it('should throw when the node is empty', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0"/>')
    assert.throws(function () { parseMediaFile(tree) })
  })
  it('should throw when the "delivery" attr is empty', function () {
    var tree = createDOM('<MediaFile type="application/mp4" width="0" height="0">content</MediaFile>')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('delivery', '  ')
    assert.throws(function () { parseMediaFile(tree) })
  })
  it('should throw when the "type" attr is empty', function () {
    var tree = createDOM('<MediaFile delivery="progressive" width="0" height="0">content</MediaFile>')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('type', '  ')
    assert.throws(function () { parseMediaFile(tree) })
  })
  it('should throw when the "width" attr is not a number', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" height="0">content</MediaFile>')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('width', '  ')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('width', 'abc')
    assert.throws(function () { parseMediaFile(tree) })
  })
  it('should throw when the "height" attr is not a number', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0">content</MediaFile>')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('height', '  ')
    assert.throws(function () { parseMediaFile(tree) })
    tree.setAttribute('height', 'abc')
    assert.throws(function () { parseMediaFile(tree) })
  })
  it('should return "codec" as a string or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('codec' in parseMediaFile(tree)))
    tree.setAttribute('codec', 'h264')
    assert.strictEqual(parseMediaFile(tree).codec, 'h264')
  })
  it('should return "id" as a string or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('id' in parseMediaFile(tree)))
    tree.setAttribute('id', 'iron-maiden')
    assert.strictEqual(parseMediaFile(tree).id, 'iron-maiden')
  })
  it('should return "bitrate" as a number or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('bitrate' in parseMediaFile(tree)))
    tree.setAttribute('bitrate', '72')
    assert.strictEqual(parseMediaFile(tree).bitrate, 72)
  })
  it('should return "minBitrate" as a number or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('minBitrate' in parseMediaFile(tree)))
    tree.setAttribute('minBitrate', '56')
    assert.strictEqual(parseMediaFile(tree).minBitrate, 56)
  })
  it('should return "maxBitrate" as a number or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('maxBitrate' in parseMediaFile(tree)))
    tree.setAttribute('maxBitrate', '512')
    assert.strictEqual(parseMediaFile(tree).maxBitrate, 512)
  })
  it('should return "scalable" as a boolean, or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('scalable' in parseMediaFile(tree)))
    tree.setAttribute('scalable', 'false')
    assert.strictEqual(parseMediaFile(tree).scalable, false)
    tree.setAttribute('scalable', 'true')
    assert.strictEqual(parseMediaFile(tree).scalable, true)
  })
  it('should return "maintainAspectRatio" as a boolean or unitialized', function () {
    var tree = createDOM('<MediaFile delivery="progressive" type="application/mp4" width="0" height="0">content</MediaFile>')
    assert(!('maintainAspectRatio' in parseMediaFile(tree)))
    tree.setAttribute('maintainAspectRatio', 'false')
    assert.strictEqual(parseMediaFile(tree).maintainAspectRatio, false)
    tree.setAttribute('maintainAspectRatio', 'true')
    assert.strictEqual(parseMediaFile(tree).maintainAspectRatio, true)
  })
})
