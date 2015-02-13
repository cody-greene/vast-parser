'use strict';

var http = require('http')
var STATUS_CODES = http.STATUS_CODES
var https = require('https')
var parseUrl = require('url').parse
var resolveUrl = require('url').resolve
var zlib = require('zlib')
var lodash = require('lodash')
var ProxyStream = require('stream').PassThrough

var defaults = lodash.defaults
var cloneDeep = lodash.cloneDeep


/**
 * Create a readable stream for an XML document over http(s)
 * Follows redirects before emitting data
 * Supports gzip
 * See http://nodejs.org/api/http.html#http_http_request_options_callback for additional options
 * @param {string} opt.url
 * @param {number} [opt.maxRedirects] Abort the request after so many redirects
 * @param {number} [opt.timeout] Abort the request after `timeout` milliseconds have passed
 * @return {ReadStream}
 */
module.exports = function getXML(opt) {
  if (!opt) throw new TypeError('Missing options object')

  var proxy = new ProxyStream()
  var redirectCount = 0

  opt = defaults(cloneDeep(opt), {
    maxRedirects: 10,
    timeout: 0,
    headers: {}
  })

  defaults(opt.headers, {
    'accept-encoding': 'gzip,deflate'
  })

  // Forward errors to the proxy stream
  function proxyErr(err) { proxy.emit('error', err) }
  function emptyErr() { proxy.emit('error', new Error('RES_EMPTY_ERR')) }
  function clearEmptyErr() { this.removeListener('end', emptyErr) } // jshint ignore:line

  function _get(uri) {
    var parsedUrl = parseUrl(prependHTTP(uri))
    var protocol = parsedUrl.protocol === 'https:' ? https : http

    var req = protocol.request(defaults(parsedUrl, opt), function handleResponse(res) {
      var statusCode = res.statusCode

      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        res.resume() // Discard the response body

        if (++redirectCount > opt.maxRedirects)
          return proxyErr(new Error('MAX_REDIRECT_ERR'))

        return _get(resolveUrl(uri, res.headers.location))
      }

      if (statusCode !== 200) {
        res.resume() // Discard the response body
        return proxyErr(httpError(statusCode))
      }

      if (['gzip', 'deflate'].indexOf(res.headers['content-encoding']) !== -1)
        res = res.pipe(zlib.createUnzip())

      res.once('data', clearEmptyErr).on('end', emptyErr).pipe(proxy)
    })

    if (opt.timeout)
      timeout(req, opt.timeout)

    req.on('error', proxyErr).end()
  }

  _get(opt.uri || opt.url)

  return proxy
}

// Prepend 'http://'' to humanized URLs like todomvc.com and localhost
function prependHTTP(uri) {
  return uri.replace(/^(?!(?:\w+:)?\/\/)/, 'http://');
}

function httpError(code) {
  var msg = [code, STATUS_CODES[code] || 'undefined']
    .join(' ')
    .toUpperCase()
    .replace(/ /g, '_')
  return new Error(msg)
}

/**
 * Abort a request if it takes too long
 * @param  {http.ClientRequest} req
 * @param  {number} time In milliseconds
 * @return {http.ClientRequest} For easy chaining
 */
function timeout(req, time) {
  if (req.timeoutID) return req

  req.timeoutID = setTimeout(function timeoutHandler() {
    req.abort()
  }, time)

  return req.on('response', clearRequestTimeout).on('error', clearRequestTimeout)
}

function clearRequestTimeout() {
  // jshint -W040
  if (this.timeoutID) {
    clearTimeout(this.timeoutID)
    this.timeoutID = null
  }
}
