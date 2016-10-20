'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseInLine = require('../src/vast').parseInLine
  .bind({
    log: require('./util/mock-logger'),
    parseCreatives: function () { return [] }
  })

describe('vast.parseInLine()', function () {
  it('should fail when it has no Creatives node', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err) {
      assert(err)
      next()
    })
  })
  it('should fail when the "AdSystem" node is empty', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>  </AdSystem>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err) {
      assert(err)
      next()
    })
  })
  it('should fail when the "AdTitle" node is empty', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>  </AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err) {
      assert(err)
      next()
    })
  })
  it('should return "system" & "title" as strings', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert.strictEqual(res.system, 'My Ad System')
      assert.strictEqual(res.title, 'My Ad Title')
      next()
    })
  })
  it('should collect non-empty Impression nodes', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
        '<Impression/>',
        '<Impression>first</Impression>',
        '<Impression>  </Impression>',
        '<Impression>second</Impression>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert.deepEqual(res.impressions, ['first', 'second'])
      next()
    })
  })
  it('should collect non-empty Survey nodes', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
        '<Survey/>',
        '<Survey>first</Survey>',
        '<Survey>  </Survey>',
        '<Survey>second</Survey>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert.deepEqual(res.surveys, ['first', 'second'])
      next()
    })
  })
  it('should collect non-empty Error nodes', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
        '<Error/>',
        '<Error>first</Error>',
        '<Error>  </Error>',
        '<Error>second</Error>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert.deepEqual(res.errors, ['first', 'second'])
      next()
    })
  })
  it('should return "description" "advertiser" & "pricing" as unitialized when the nodes are missing', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert(!('description' in res))
      assert(!('advertiser' in res))
      assert(!('pricing' in res))
      next()
    })
  })
  it('should return "description" "advertiser" & "pricing" as a string (first node)', function (next) {
    var tree = createDOM([
      '<InLine>',
        '<Creatives/>',
        '<AdTitle>My Ad Title</AdTitle>',
        '<AdSystem>My Ad System</AdSystem>',
        '<Description>first desc</Description>',
        '<Description/>',
        '<Advertiser>first advertiser</Advertiser>',
        '<Advertiser/>',
        '<Pricing>first pricing</Pricing>',
        '<Pricing/>',
      '</InLine>'
    ].join(''))
    parseInLine(tree, function (err, res) {
      assert.ifError(err)
      assert.strictEqual(res.description, 'first desc')
      assert.strictEqual(res.advertiser, 'first advertiser')
      assert.strictEqual(res.pricing, 'first pricing')
      next()
    })
  })
})
