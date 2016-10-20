'use strict';
var http = require('http')
var STATUS_CODES = http.STATUS_CODES
var https = require('https')
var parseUrl = require('url').parse
var resolveUrl = require('url').resolve
var zlib = require('zlib')
var ProxyStream = require('stream').PassThrough
var defaults = require('lodash/object/defaults')
var cloneDeep = require('lodash/lang/cloneDeep')

/**
 * Create a readable stream for an XML document over http(s)
 * Follows redirects before emitting data
 * Supports gzip
 * See http://nodejs.org/api/http.html#http_http_request_options_callback for additional options
 * @param {string} opt.url
 * @param {number} [opt.maxRedirects] Abort the request after so many redirects
 * @param {number} [opt.timeout] Abort the request after `timeout` milliseconds have passed
 * @param {function} callback (err, xml)
 */
module.exports = function request(opt, callback) {
  if (!opt) throw new TypeError('Missing options object')
  var redirectCount = 0
  var xmlBuffer = []
  var proxy = new ProxyStream()
    .on('error', callback)
    .on('data', function (chunk) {
      xmlBuffer.push(chunk)
    })
    .on('end', function () {
      var xmlString = Buffer.concat(xmlBuffer).toString('utf8')
      if (!xmlString) callback(new Error('EMPTY_XML_RES'))
      else callback(null, xmlString)
    })
  opt = defaults(cloneDeep(opt), {
    maxRedirects: 10,
    timeout: 10000,
    headers: {}
  })
  defaults(opt.headers, {
    'Accept': 'application/xml',
    'Accept-Encoding': 'gzip'
  })
  _get(opt.uri || opt.url)

  function proxyErr(err){ proxy.emit('error', err) }
  function emptyErr(){ proxyErr(new Error('RES_EMPTY_ERR')) }
  function clearEmptyErr(){ this.removeListener('end', emptyErr) } // jshint ignore:line
  function _get(uri) {
    var parsedUrl = parseUrl(prependHTTP(uri))
    var protocol = parsedUrl.protocol === 'https:' ? https : http
    var req = protocol.request(defaults(parsedUrl, opt), function handleResponse(res) {
      var statusCode = res.statusCode
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        res.resume() // Discard the response body
        return ++redirectCount > opt.maxRedirects
          ? proxyErr(new Error('MAX_REDIRECT_ERR'))
          : _get(resolveUrl(uri, res.headers.location))
      }
      if (statusCode !== 200) {
        res.resume() // Discard the response body
        return proxyErr(new Error([statusCode, STATUS_CODES[statusCode] || 'undefined']
          .join(' ').toUpperCase().replace(/ /g, '_')))
      }
      if (['gzip', 'deflate'].indexOf(res.headers['content-encoding']) !== -1)
        res = res.pipe(zlib.createUnzip())
      res.pipe(proxy)
    })
    if (opt.timeout) timeout(req, opt.timeout)
    req.on('error', function (err) {
      proxyErr(new Error(err.message))
    }).end()
  }
}

// Prepend 'http://'' to humanized URLs like todomvc.com and localhost
function prependHTTP(uri) {
  return uri.replace(/^(?!(?:\w+:)?\/\/)/, 'http://')
}

/**
 * Abort a request if it takes too long
 * @param  {http.ClientRequest} req
 * @param  {number} time In milliseconds
 * @return {http.ClientRequest} For easy chaining
 */
function timeout(req, time) {
  if (req.timeoutID) return req
  req.timeoutID = setTimeout(function(){ req.abort() }, time)
  return req.on('response', clearRequestTimeout).on('error', clearRequestTimeout)
}

function clearRequestTimeout() {
  // jshint -W040
  if (this.timeoutID) {
    clearTimeout(this.timeoutID)
    this.timeoutID = null
  }
}
