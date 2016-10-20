'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var fs = require('fs')
var assert = require('assert')
var server = require('./util/server')
var Parser = require('../src/parser')
var tlog = require('bunyan').createLogger({
  name: 'VAST',
  streams: [{path: __dirname + '/tmp' + __filename.slice(__dirname.length, -3) + '.log', level: 'trace'}]
})

function getFilePath(name) { return __dirname + '/example' + name }
function getExpected(name) { return require(getFilePath(name + '.json')) }

function router(req, res) {
  switch (req.url) {
  default:
    fs.createReadStream(getFilePath(req.url))
      .on('error', function () {
        res.statusCode = 404
        res.end('not found')
      })
      .pipe(res)
  }
}

describe('Parser.create()', function () {
  before(server.start)
  before(server.ssl.start)
  before(function () {
    server.$.on('request', router)
    server.ssl.$.on('request', router)
  })

  it('should work on a local file', function (next) {
    var docname = '/01.xml'
    Parser.create({
      logger: tlog,
      path: getFilePath(docname),
      done: function (err, res) {
        assert.ifError(err)
        assert.deepEqual(res, getExpected(docname), 'should match expected JSON')
        next()
      }
    })
  })

  it('should support HTTP', function (next) {
    var docname = '/01.xml'
    Parser.create({
      logger: tlog,
      uri: server.url + docname,
      done: function (err, res) {
        assert.ifError(err)
        assert.deepEqual(res, getExpected(docname), 'should match expected JSON')
        next()
      }
    })
  })

  it('should support HTTPS', function (next) {
    var docname = '/01.xml'
    Parser.create({
      logger: tlog,
      uri: server.ssl.url + docname,
      ca: server.ssl._.ca,
      headers: {host: 'tmp.test'},
      done: function (err, res) {
        assert.ifError(err)
        assert.deepEqual(res, getExpected(docname), 'should match expected JSON')
        next()
      }
    })
  })

  it('should fail gracefully when a local file does not exist', function (next) {
    var docname = '/does-not-exist.xml'
    Parser.create({
      logger: tlog,
      path: getFilePath(docname),
      done: function (err) {
        assert(err)
        next()
      }
    })
  })

  it('should fail gracefully when a http response is bad', function (next) {
    var docname = '/does-not-exist.xml'
    Parser.create({
      logger: tlog,
      uri: server.url + docname,
      done: function (err) {
        assert(err)
        next()
      }
    })
  })

  it('should fail gracefully when no path or uri is provided', function (next) {
    Parser.create({
      logger: tlog,
      done: function (err) {
        assert(err)
        next()
      }
    })
  })

  it('should fail when no ads are defined')

  it('should recover from an ad-level error')

  after(server.stop)
  after(server.ssl.stop)
  after(function (done) {
    // Finish writing the logfile before exiting or data may be lost
    tlog.streams[0].stream.end(done)
  })
})
