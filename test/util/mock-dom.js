'use strict';
var ParserDOM = require('xmldom').DOMParser
module.exports = function createDOM(xml) {
  return new ParserDOM().parseFromString(xml, 'text/xml').documentElement
}
