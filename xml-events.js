'use strict';

// These events are attached to a Readable stream from a file or from a network request
// All events have `this` bound to a Parser instance
var xmlEvents = module.exports

xmlEvents.response = function xmlResponse(res) {
  this.log.debug({uri: this.opt.uri, status: res.statusCode}, 'NET_RESPONSE')
}

xmlEvents.error = function xmlError(err) {
  this.log.error(err, 'XML_STREAM_ERR')
  this.stop(err)
}

xmlEvents.data = function xmlData(chunk) {
  this.log.trace('XML_CHUNK')
  if (!this.buffer) this.buffer = []
  this.buffer.push(chunk)
}

xmlEvents.end = function xmlEnd() {
  this.log.trace('XML_END')
  var xmlString = Buffer.concat(this.buffer).toString()
  var doc = this.dom.parseFromString(xmlString, 'text/xml')

  this.parseDocument(doc)
}
