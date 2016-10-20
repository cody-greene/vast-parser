'use strict';
var UNDEF = 'undefined'
var EMPTY_STR = ''
var ONE_SECOND = 1000
var ONE_MINUE = ONE_SECOND * 60
var ONE_HOUR = ONE_MINUE * 60
var extend = require('lodash/object/assign')
var util = require('./util')
var vast = module.exports

vast.parseDocument = function parseDocument(doc) {
  this.log.trace('PARSE_DOC')
  var base = util.getChildren(doc, 'vast', 1)
  if (!base)
    return this.stop(new Error('MISSING_VAST_NODE_ERR'))
  var adNodes = util.getChildren(base, 'ad')
  var version = getAttribute(base, 'version')
  var attributes = {version: version}
  if (!version || version > '3.0')
    return this.stop(new Error('VERSION_NOT_SUPPORTED_ERR'))
  if (!adNodes.length)
    return this.stop(new Error('MISSING_AD_NODE_ERR'))
  util.mapAsync(adNodes, this.parseAd, function handleParsedAds(acc) {
    var ads = acc.map(settleToVal).filter(isTruthy)
    attributes.sorted = ads.filter(hasSequence).sort(bySequence)
    attributes.unsorted = ads.filter(noSequence)
    if (!attributes.unsorted.length && !attributes.sorted.length)
      return this.stop(new Error('NO_VALID_ADS'))
    this.stop(null, attributes)
  }, this)
}

vast.parseAd = function parseAd(base, next) {
  this.log.trace('PARSE_AD')
  var log = this.log
  var wrapperNode = util.getChildren(base, 'wrapper', 1)
  var inLineNode = util.getChildren(base, 'inline', 1)
  var attributes = {}
  set(attributes, 'id', getAttribute(base, 'id'))
  set(attributes, 'sequence', getAttributeInteger(base, 'sequence'))
  if (inLineNode) this.parseInLine(inLineNode, mergeAttributes)
  else if (wrapperNode) this.parseWrapper(wrapperNode, mergeAttributes)
  else next(new Error('EMPTY_AD_NODE_ERR'))
  function mergeAttributes(err, res) {
    if (err) log.error(err, 'INVALID_AD_ERR')
    next(err, res && extend(attributes, res))
  }
}

vast.parseWrapper = function parseWrapper(base, next) {
  this.log.trace('PARSE_WRAPPER')
  next(new Error('NOT_IMPLEMENTED'))
}

vast.parseInLine = function parseInLine(base, next) {
  this.log.trace('PARSE_INLINE')
  var descriptionNode = util.getChildren(base, 'description', 1)
  var advertiserNode = util.getChildren(base, 'advertiser', 1)
  var creativesNode = util.getChildren(base, 'creatives', 1)
  var adSystemNode = util.getChildren(base, 'adsystem', 1)
  var adTitleNode = util.getChildren(base, 'adtitle', 1)
  var pricingNode = util.getChildren(base, 'pricing', 1)
  var impressionNodes = util.getChildren(base, 'impression')
  var surveyNodes = util.getChildren(base, 'survey')
  var errorNodes = util.getChildren(base, 'error')
  if (!creativesNode) return next(new Error('NO_CREATIVES_ERR'))
  var attributes = {
    impressions: impressionNodes.map(getContent).filter(isTruthy),
    surveys: surveyNodes.map(getContent).filter(isTruthy),
    errors: errorNodes.map(getContent).filter(isTruthy)
  }
  set(attributes, 'description', getContent(descriptionNode))
  set(attributes, 'advertiser', getContent(advertiserNode))
  set(attributes, 'system', getContent(adSystemNode))
  set(attributes, 'title', getContent(adTitleNode))
  set(attributes, 'pricing', getContent(pricingNode))
  if (!attributes.system) return next(new Error('NO_AD_SYSTEM_ERR'))
  if (!attributes.title) return next(new Error('NO_AD_TITLE_ERR'))
  try {
    // Anything below the 'InLine' node can be parsed in sync
    // so let's just throw errors at this point instead of passing callbacks
    attributes.creatives = this.parseCreatives(creativesNode)
  } catch (err) {
    this.log.error(err, 'VAST_PARSE_ERR')
    return next(err)
  }
  next(null, attributes)
}

vast.parseCreatives = function parseCreatives(base) {
  var creativeNodes = util.getChildren(base, 'creative')
  if (!creativeNodes.length)
    throw new Error('NO_CREATIVE_ERR')
  return creativeNodes.map(this.parseCreative, this)
}

vast.parseCreative = function parseCreative(base) {
  this.log.trace('PARSE_CREATIVE')
  var companionAdsNode = util.getChildren(base, 'companionads', 1)
  var nonlinearNode = util.getChildren(base, 'nonlinear', 1)
  var linearNode = util.getChildren(base, 'linear', 1)
  var attributes = {}
  set(attributes, 'id', getAttribute(base, 'id'))
  set(attributes, 'sequence', getAttributeInteger(base, 'sequence'))
  if (linearNode) attributes.linear = this.parseLinear(linearNode)
  else if (companionAdsNode) attributes.companion = this.parseCompanionAds(companionAdsNode)
  else if (nonlinearNode) attributes.nonlinear = this.parseNonlinear(nonlinearNode)
  else throw new Error('EMPTY_CREATIVE_ERR')
  return attributes
}

vast.parseLinear = function parseLinear(base) {
  this.log.trace('PARSE_LINEAR')
  var trackingEventsNode = util.getChildren(base, 'trackingevents', 1)
  var adParametersNode = util.getChildren(base, 'adparameters', 1)
  var videoClicksNode = util.getChildren(base, 'videoclicks', 1)
  var mediaFilesNode = util.getChildren(base, 'mediafiles', 1)
  var durationNode = util.getChildren(base, 'duration', 1)
  if (!mediaFilesNode) throw new Error('NO_MEDIA_FILES_ERR')
  var attributes = {
    files: this.parseMediaFiles(mediaFilesNode),
    duration: this.parseDuration(durationNode),
    tracking: extend(
      trackingEventsNode ? this.parseTrackingEvents(trackingEventsNode) : {},
      this.parseVideoClicks(videoClicksNode))
  }
  set(attributes, 'parameters', getContent(adParametersNode))
  return attributes
}

vast.parseMediaFiles = function parseMediaFiles(base) {
  var mediaFileNodes = util.getChildren(base, 'mediafile')
  if (!mediaFileNodes.length)
    throw new Error('NO_MEDIA_FILE_ERR')
  return mediaFileNodes.map(this.parseMediaFile, this)
}

vast.parseMediaFile = function parseMediaFile(base) {
  this.log.trace('PARSE_MEDIA_FILE')
  var attributes = {
    delivery: getAttribute(base, 'delivery'),
    type: getAttribute(base, 'type'),
    width: getAttributeInteger(base, 'width'),
    height: getAttributeInteger(base, 'height'),
    uri: base.textContent.trim()
  }
  set(attributes, 'scalable', getAttributeBoolean(base, 'scalable'))
  set(attributes, 'maintainAspectRatio', getAttributeBoolean(base, 'maintainAspectRatio'))
  set(attributes, 'codec', getAttribute(base, 'codec'))
  set(attributes, 'id', getAttribute(base, 'id'))
  set(attributes, 'bitrate', getAttributeInteger(base, 'bitrate'))
  set(attributes, 'minBitrate', getAttributeInteger(base, 'minBitrate'))
  set(attributes, 'maxBitrate', getAttributeInteger(base, 'maxBitrate'))
  if (!attributes.uri) throw new Error('NO_URI_ERR')
  if (!attributes.delivery) throw new Error('NO_DELIVERY_ERR')
  if (!attributes.type) throw new Error('NO_TYPE_ERR')
  if (attributes.width === null) throw new Error('NO_WIDTH_ERR')
  if (attributes.height === null) throw new Error('NO_HEIGHT_ERR')
  return attributes
}

vast.parseVideoClicks = function parseVideoClicks(base) {
  this.log.trace('PARSE_VIDEO_CLICKS')
  var clickThroughNode = util.getChildren(base, 'clickthrough', 1)
  var clickTrackingNodes = util.getChildren(base, 'clicktracking')
  var attributes = {
    click: clickTrackingNodes.map(getContent).filter(isTruthy)
  }
  set(attributes, 'clickThrough', getContent(clickThroughNode))
  return attributes
}

vast.parseTrackingEvents = function parseTrackingEvents(base) {
  this.log.trace('PARSE_TRACKING_EVENTS')
  var result = {}
  var trackingNodes = util.getChildren(base, 'tracking')
  var index = trackingNodes.length
  var node, type, uri
  if (!index)
    throw new Error('NO_TRACKING_ERR')
  while (index--) {
    node = trackingNodes[index]
    type = getAttribute(node, 'event')
    uri = node.textContent.trim()
    if (uri && type) {
      if (!result[type]) result[type] = []
      result[type].push(uri)
    }
  }
  return result
}

vast.parseDuration = function parseDuration(base) {
  if (!base) throw new Error('NO_DURATION_ERR')
  var matches = (getContent(base) || '').match(/^(\d{2}):(\d{2}):(\d{2}(?:\.\d{3})?)/)
  if (!matches) throw new Error('DURATION_FORMAT_ERR')
  return ONE_HOUR*matches[1] + ONE_MINUE*matches[2] + ONE_SECOND*matches[3]
}

vast.parseCompanionAds = function parseCompanionAds(base) {
  this.log.trace('PARSE_COMPANION_ADS')
  throw new Error('NOT_IMPLEMENTED')
}

vast.parseNonlinear = function parseNonlinear(base) {
  this.log.trace('PARSE_NONLINEAR')
  throw new Error('NOT_IMPLEMENTED')
}

// This makes sure we end up with a 'clean' object, without useless props
// Allow: false, 0
function set(obj, key, val) {
  // TO DO -- omit ALL falsy values
  if (val !== null && typeof val !== UNDEF && val !== EMPTY_STR)
    obj[key] = val
}

function getAttribute(element, attrName) {
  return element.getAttribute(attrName).trim()
}

function getAttributeInteger(element, attrName) {
  var num = parseInt(getAttribute(element, attrName), 10)
  // NaN is annoying to test for so use null instead
  return isNaN(num) ? null : num
}

function getAttributeBoolean(element, attrName) {
  var val = getAttribute(element, attrName)
  return val === '' ? null : val.toLowerCase() === 'true'
}

function getContent(element) {
  return element && element.textContent.trim()
}

function hasSequence(item) {
  return !isNaN(item.sequence)
}

function noSequence(item) {
  return !hasSequence(item)
}

function bySequence(left, right) {
  return left.sequence < right.sequence ? -1 :
    left.sequence > right.sequence ? 1 : 0
}

function settleToVal(res) { return !res.err && res.val }

function isTruthy(val) { return !!val }
