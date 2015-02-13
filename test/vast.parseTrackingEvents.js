'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseTrackingEvents = require('../vast').parseTrackingEvents
  .bind({
    log: require('./util/mock-logger')
  })

describe('vast.parseTrackingEvents()', function () {
  it('should throw when it has no children', function () {
    var tree = createDOM('<TrackingEvents/>')
    assert.throws(function () { parseTrackingEvents(tree) })
  })
  it('should collect non-empty children into arrays keyed by the "event" attribute', function () {
    var tree = createDOM([
      '<TrackingEvents>',
        '<Tracking/>',
        '<Tracking event="foo"/>',
        '<Tracking>  </Tracking>',
        '<Tracking event="foo">first</Tracking>',
        '<Tracking event="fizz">third</Tracking>',
        '<Tracking event="fizz">second</Tracking>',
      '</TrackingEvents>'
    ].join(''))
    var actual = parseTrackingEvents(tree)
    assert.deepEqual(actual, {foo: ['first'], fizz: ['second', 'third']})
  })
})
