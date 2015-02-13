'use strict';
/* global describe, it, before, after, beforeEach, afterEach *//*jshint ignore:line*/

var assert = require('assert')
var zlib = require('zlib')
var fs = require('fs')
var server = require('./util/server')
var getXML = require('../get')
var easyStream = require('./util/easy-stream')

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

describe('getXML()', function () {
  before(server.start)
  before(server.ssl.start)
  before(function () {
    server.$.on('request', router)
    server.ssl.$.on('request', router)
  })

  it('should support HTTP', function (next) {
    var docname = '/00.xml'
    easyStream(
      getXML({url: server.url + docname}),
      readFile(docname),
      next
    )
  })

  it('should support HTTPS', function (next) {
    var docname = '/00.xml'
    easyStream(
      getXML({
        url: server.ssl.url + docname,
        ca: server.ssl._.ca,
        headers: {host: 'tmp.test'}
      }),
      readFile(docname),
      next
    )
  })

  it('should support protocol-less URLs', function (next) {
    var docname = '/00.xml'
    easyStream(getXML({
      url: server.url.replace('http://', '') + docname
    }), readFile(docname), next)
  })

  it('should fail on an empty response', function (next) {
    getXML({url: server.url + '/empty'})
      .on('error', function (err) {
        assert(err)
        next()
      })
  })

  it('should fail on a bad status code', function (next) {
    getXML({url: server.url + '/does-not-exist.xml'})
      .on('error', function (err) {
        assert(err)
        next()
      })
  })

  it('should support the "timeout" option', function (next) {
    getXML({url: server.url + '/long', timeout: 25})
      .on('error', function (err) {
        assert(err)
        next()
      })
  })

  it('should follow a redirect', function (next) {
    easyStream(getXML({url: server.url + '/redirect'}), readFile('/00.xml'), next)
  })

  it('should follow a relative redirect', function (next) {
    easyStream(getXML({url: server.url + '/redirect-relative'}), readFile('/00.xml'), next)
  })

  it('should support the "maxRedirects" option', function (next) {
    getXML({url: server.url + '/redirect-many', maxRedirects: 1})
      .on('error', function (err) {
        assert(err)
        next()
      })
  })

  it('should decompress gzip content-encoding', function (next) {
    easyStream(getXML({url: server.url + '/gzip'}), readFile('/00.xml'), next)
  })

  it('should only accept "text/xml" or "application/xml" MIME types')

  after(server.stop)
  after(server.ssl.stop)
})
