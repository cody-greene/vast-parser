'use strict';

var fs = require('fs')
var lodash = require('lodash')
var ParserDOM = require('xmldom').DOMParser
var stdlog = require('bunyan').createLogger({name: 'VAST'})
var xmlEvents = require('./xml-events')
var getXML = require('./get')
var vast = require('./vast')

var defaults = lodash.defaults
var generateID = lodash.uniqueId
var noop = lodash.noop
var omit = lodash.omit
var Parser = module.exports = Object.create(vast)

/**
 * Initialization
 * @arg {object} opt TO DO -- explain options
 * @return {Parser} For easy chaining
 */
Parser.init = function init(opt) {
  this.opt = defaults(opt, {
    // depth: 0,
    // parentID: null,
    headers: {},
    maxRedirects: 10,
    logger: stdlog,
    done: noop,
    autorun: true
  })

  this.log = this.opt.logger.child({
    // depth: this.opt.depth,
    // parentID: this.opt.parentID,
    id: generateID()
  })

  this.log.debug({opt: omit(this.opt, 'logger')}, 'PARSER_INIT')

  this.dom = new ParserDOM({errorHandler: this.domErrorHandler.bind(this)})

  if (this.opt.autorun) this.run()

  return this
}

// Construction & initialization shorthand
Parser.create = function create(opt) {
  return Object.create(this).init(opt)
}

Parser.spawn = function spawn(callback) {
  return Object.create(Parser).init(defaults({
    // TO DO -- set depth, parentID, etc
    autorun: true,
    done: callback
  }, this.opt))
}

/**
 * Abort any ongoing actions and invoke the `done` callback
 * @param {Error} err Set to null if we've completed successfully
 * @param {object} res Transformed XML data
 * @return {Parser} For easy chaining
 */
Parser.stop = function stop(err, res) {
  // Make sure this only runs once
  if (this._stopped) return this
  this._stopped = true

  this.log.debug('PARSER_STOP')

  if (this.xml) this.xml.removeAllListeners()

  try { this.opt.done(err, res) }
  catch (callbackErr) { this.log.error(callbackErr, 'PARSER_CALLBACK_ERR') }
  return this
}

/**
 * Begin parsing
 * @return {Parser} For easy chaining
 */
Parser.run = function run() {
  var opt = this.opt
  var xmlStream

  this.log.trace('PARSER_RUN')

  if (opt.path) xmlStream = this.xml = fs.createReadStream(opt.path)
  else if (opt.uri) xmlStream = this.xml = getXML({
    maxRedirects: opt.maxRedirects,
    uri: opt.uri,
    headers: opt.headers,
    ca: opt.ca
  })

  if (!xmlStream)
    return this.stop(new Error('NO_XML_STREAM_ERR'))

  xmlStream = this.registerAll(xmlEvents, xmlStream)

  return this
}

Parser.domErrorHandler = function DOMErrorHandler(type, msg) {
  var err = msg instanceof Error ? msg : new Error(msg)
  this.log.debug(err, 'DOM_PARSE_ERR')
  if (type === 'fatalError') this.stop(err)
}

/**
 * Register a collection of listeners with an event emitter
 * @arg {object} events One listener for each event name
 * @arg {EventEmitter} emitter
 * @arg {object} [context] Bound as 'this' for each listener
 * @return {EventEmitter}
 */
Parser.registerAll = function registerAll(events, emitter) {
  // jshint -W089
  for (var key in events)
    emitter.on(key, this.safeBind(events[key]))
  return emitter
}

// Capture all exceptions and log them appropriately
Parser.safeBind = function safeBind(fn) {
  var self = this
  return function eventWrapper() {
    try { fn.apply(self, arguments) }
    catch (err) {
      self.log.error(err, 'XML_EVENT_ERR')
      self.stop(err)
    }
  }
}

Parser.settle = function settle(arr, iterator, callback) {
  var acc = []
  var expected = arr.length
  var count = 0
  var self = this

  function encloseNext(targetIndex) {
    return function next(err, val) {
      acc[targetIndex] = {err: err, val: val}
      if (++count >= expected) callback.call(self, acc)
    }
  }

  for (var index = 0; index < expected; ++index)
    iterator.call(this, arr[index], encloseNext(index))
}
