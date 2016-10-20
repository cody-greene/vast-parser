'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parseLinear = require('../src/vast').parseLinear
  .bind({
    log: require('./util/mock-logger'),
    parseMediaFiles: function () { return [] },
    parseDuration: function () { return 1 },
    parseTrackingEvents: function () { return {} },
    parseVideoClicks: function () { return {} }
  })

describe('vast.parseLinear()', function () {
  it('should throw when it has no MediaFiles node', function () {
    var tree = createDOM('<Linear/>')
    assert.throws(function () { parseLinear(tree) })
  })
  it('should return "parameters" as a string or unitialized', function () {
    var emptyTree = createDOM('<Linear><MediaFiles/></Linear>')
    var fullTree = createDOM('<Linear><MediaFiles/><AdParameters>first</AdParameters></Linear>')
    assert(!('parameters' in parseLinear(emptyTree)))
    assert.strictEqual(parseLinear(fullTree).parameters, 'first')
  })
})
