'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var zlib = require('zlib')
var fs = require('fs')
var server = require('./util/server')
var request = require('../src/request')

function getFilePath(name) { return __dirname + '/example' + name }
function readFile(name) { return fs.readFileSync(getFilePath(name), 'utf8') }

function router(req, res) {
  switch (req.url) {
  case '/empty':
    res.statusCode = 200
    res.end()
    break
  case '/long':
    setTimeout(function () { res.end('too late') }, 50)
    break
  case '/redirect':
    res.writeHead(302, {Location: server.url + '/00.xml'})
    res.end()
    break
  case '/redirect-relative':
    res.writeHead(302, {Location: '/00.xml'})
    res.end()
    break
  case '/redirect-many':
    res.writeHead(302, {Location: server.url + '/redirect'})
    res.end()
    break
  case '/gzip':
    res.writeHead(200, {'content-encoding': 'gzip'})
    fs.createReadStream(getFilePath('/00.xml')).pipe(zlib.createGzip()).pipe(res)
    break
  default:
    fs.createReadStream(getFilePath(req.url))
    .on('error', function () {
      res.statusCode = 500
      res.end()
    })
    .pipe(res)
  }
}

describe('request()', function () {
  before(server.start)
  before(server.ssl.start)
  before(function () {
    server.$.on('request', router)
    server.ssl.$.on('request', router)
  })

  it('should support HTTP', function (next) {
    var docname = '/00.xml'
    request({url: server.url + docname}, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile(docname), 'XML response should match')
      next()
    })
  })

  it('should support HTTPS', function (next) {
    var docname = '/00.xml'
    request({
      url: server.ssl.url + docname,
      ca: server.ssl._.ca,
      headers: {host: 'tmp.test'}
    }, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile(docname), 'XML response should match')
      next()
    })
  })

  it('should support protocol-less URLs', function (next) {
    var docname = '/00.xml'
    request({
      url: server.url.replace('http://', '') + docname
    }, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile(docname), 'XML response should match')
      next()
    })
  })

  it('should fail on an empty response', function (next) {
    request({url: server.url + '/empty'}, function (err) {
      assert(err)
      next()
    })
  })

  it('should fail on a bad status code', function (next) {
    request({url: server.url + '/does-not-exist.xml'}, function (err) {
      assert(err)
      next()
    })
  })

  it('should support the "timeout" option', function (next) {
    request({url: server.url + '/long', timeout: 25}, function (err) {
      assert(err)
      next()
    })
  })

  it('should follow a redirect', function (next) {
    request({url: server.url + '/redirect'}, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile('/00.xml'), 'XML response should match')
      next()
    })
  })

  it('should follow a relative redirect', function (next) {
    request({url: server.url + '/redirect-relative'}, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile('/00.xml'), 'XML response should match')
      next()
    })
  })

  it('should support the "maxRedirects" option', function (next) {
    request({
      url: server.url + '/redirect-many',
      maxRedirects: 1
    }, function (err) {
      assert(err)
      next()
    })
  })

  it('should decompress gzip content-encoding', function (next) {
    request({url: server.url + '/gzip'}, function (err, actual) {
      assert.ifError(err)
      assert.equal(actual, readFile('/00.xml'), 'XML response should match')
      next()
    })
  })

  it('should only accept "text/xml" or "application/xml" MIME types')

  after(server.stop)
  after(server.ssl.stop)
})
