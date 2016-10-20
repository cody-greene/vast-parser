'use strict';
var fs = require('fs')
var xmldom = require('xmldom')
var stdlog = require('bunyan').createLogger({name: 'vast-parser'})
var request = require('./request')
var vast = require('./vast')
var defaults = require('lodash/object/defaults')
var generateID = require('lodash/utility/uniqueId')
var omit = require('lodash/object/omit')
var noop = function () {}
var Parser = module.exports = Object.create(vast)

/**
 * Initialization
 * @arg {object} opt TO DO -- explain options
 * @return {Parser} For easy chaining
 */
Parser.init = function init(opt) {
  opt = this.opt = defaults(opt, {
    // depth: 0,
    // parentID: null,
    headers: {},
    maxRedirects: 10,
    logger: stdlog,
    done: noop,
    autorun: true
  })
  this.log = opt.logger.child({
    // depth: this.opt.depth,
    // parentID: this.opt.parentID,
    id: generateID()
  })
  this.log.debug({opt: omit(opt, ['logger', 'ca'])}, 'PARSER_INIT')
  this.dom = new xmldom.DOMParser({errorHandler: this.domErrorHandler.bind(this)})
  if (opt.autorun) this.run()
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
  try{ this.opt.done(err, res) }
  catch(callbackErr){ this.log.error(callbackErr, 'PARSER_CALLBACK_ERR') }
  return this
}

/**
 * Begin parsing
 * @return {Parser} For easy chaining
 */
Parser.run = function run() {
  var opt = this.opt
  var self = this
  this.log.trace('PARSER_RUN')
  if (opt.path) fs.readFile(opt.path, 'utf8', proceed)
  else if (opt.uri) request({
    maxRedirects: opt.maxRedirects,
    uri: opt.uri,
    headers: opt.headers,
    ca: opt.ca
  }, proceed)
  else self.stop(new Error('NO_DOCUMENT_LOCATION'))
  function proceed(err, xml) {
    if (err) self.stop(err)
    else self.parseDocument(self.dom.parseFromString(xml, 'text/xml'))
  }
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
Parser.registerAll = function registerAll(emitter, events) {
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
