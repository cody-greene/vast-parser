'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var createDOM = require('./util/mock-dom')
var parserCallback = null
var parseDocument = require('../vast').parseDocument
  .bind({
    log: require('./util/mock-logger'),
    parseAd: require('./util/mock-async'),
    stop: function (err, res) { parserCallback(err, res) }
  })

describe('vast.parseDocument()', function () {
  it('should fail when it has no VAST node', function (next) {
    var tree = createDOM('<Document/>')
    parserCallback = function (err) {
      assert(err)
      next()
    }
    parseDocument(tree)
  })
  it('should fail when version > "3.0"', function (next) {
    var tree = createDOM([
      '<Document>',
        '<VAST version="4.0">',
          '<Ad/>',
        '</VAST>',
      '</Document>'
    ].join(''))
    parserCallback = function (err) {
      assert(err)
      next()
    }
    parseDocument(tree)
  })
  it('should fail when it has no Ad nodes', function (next) {
    var tree = createDOM([
      '<Document>',
        '<VAST version="3.0"/>',
      '</Document>'
    ].join(''))
    parserCallback = function (err) {
      assert(err)
      next()
    }
    parseDocument(tree)
  })
})
