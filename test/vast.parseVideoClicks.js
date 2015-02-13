'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseVideoClicks = require('../vast').parseVideoClicks
  .bind({
    log: require('./util/mock-logger')
  })

describe('vast.parseVideoClicks()', function () {
  it('should collect all non-empty ClickTracking nodes', function () {
    var tree = createDOM([
      '<VideoClicks>',
        '<ClickTracking/>',
        '<ClickTracking>  </ClickTracking>',
        '<ClickTracking>first</ClickTracking>',
        '<ClickTracking>second</ClickTracking>',
      '</VideoClicks>'
    ].join(''))
    var actual = parseVideoClicks(tree)
    assert.deepEqual(actual, {click: ['first', 'second']})
  })
  it('should get the first ClickThrough node', function () {
    var tree = createDOM([
      '<VideoClicks>',
        '<ClickThrough>first</ClickThrough>',
        '<ClickThrough>second</ClickThrough>',
      '</VideoClicks>'
    ].join(''))
    var actual = parseVideoClicks(tree)
    assert.strictEqual(actual.clickThrough, 'first')
  })
})
