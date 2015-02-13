'use strict';

var lodash = require('lodash')

var UNDEF = 'undefined'
var EMPTY_STR = ''
var ONE_SECOND = 1000
var ONE_MINUE = ONE_SECOND * 60
var ONE_HOUR = ONE_MINUE * 60

var extend = lodash.assign
var vast = module.exports

vast.parseDocument = function parseDocument(doc) {
  this.log.trace('PARSE_DOC')
  var root = getChildren(doc, 'vast', 1)

  if (!root)
    return this.stop(new Error('MISSING_VAST_NODE_ERR'))

  var adNodes = getChildren(root, 'ad')
  var version = getAttribute(root, 'version')
  var attributes = {version: version}

  if (!version || version > '3.0')
    return this.stop(new Error('VERSION_NOT_SUPPORTED_ERR'))
  if (!adNodes.length)
    return this.stop(new Error('MISSING_AD_NODE_ERR'))

  this.settle(adNodes, this.parseAd, function handleParsedAds(acc) {
    attributes.ads = acc.map(settleToVal).filter(isTruthy).sort(bySequence)
    if (attributes.ads.length < 1) return this.stop(new Error('NO_VALID_ADS'))
    this.stop(null, attributes)
  })
}

vast.parseAd = function parseAd(root, next) {
  this.log.trace('PARSE_AD')
  var log = this.log
  var wrapperNode = getChildren(root, 'wrapper', 1)
  var inLineNode = getChildren(root, 'inline', 1)
  var attributes = {}

  set(attributes, 'id', getAttribute(root, 'id'))
  set(attributes, 'sequence', getAttributeInteger(root, 'sequence'))

  function mergeAttributes(err, res) {
    if (err) log.error(err, 'INVALID_AD_ERR')
    next(err, res && extend(attributes, res))
  }

  if (inLineNode) this.parseInLine(inLineNode, mergeAttributes)
  else if (wrapperNode) parseWrapper(wrapperNode, mergeAttributes)
  else next(new Error('EMPTY_AD_NODE_ERR'))
}

vast.parseInLine = function parseInLine(root, next) {
  this.log.trace('PARSE_INLINE')
  var descriptionNode = getChildren(root, 'description', 1)
  var advertiserNode = getChildren(root, 'advertiser', 1)
  var creativesNode = getChildren(root, 'creatives', 1)
  var adSystemNode = getChildren(root, 'adsystem', 1)
  var adTitleNode = getChildren(root, 'adtitle', 1)
  var pricingNode = getChildren(root, 'pricing', 1)
  var impressionNodes = getChildren(root, 'impression')
  var surveyNodes = getChildren(root, 'survey')
  var errorNodes = getChildren(root, 'error')

  if (!creativesNode)
    return next(new Error('NO_CREATIVES_ERR'))

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

  if (!attributes.system)
    return next(new Error('NO_AD_SYSTEM_ERR'))
  if (!attributes.title)
    return next(new Error('NO_AD_TITLE_ERR'))

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

vast.parseCreatives = function parseCreatives(root) {
  var creativeNodes = getChildren(root, 'creative')
  if (!creativeNodes.length)
    throw new Error('NO_CREATIVE_ERR')
  return creativeNodes.map(this.parseCreative, this)
}

vast.parseCreative = function parseCreative(root) {
  this.log.trace('PARSE_CREATIVE')
  var companionAdsNode = getChildren(root, 'companionads', 1)
  var nonlinearNode = getChildren(root, 'nonlinear', 1)
  var linearNode = getChildren(root, 'linear', 1)
  var attributes = {}

  set(attributes, 'id', getAttribute(root, 'id'))
  set(attributes, 'sequence', getAttributeInteger(root, 'sequence'))

  if (linearNode) attributes.linear = this.parseLinear(linearNode)
  else if (companionAdsNode) attributes.companion = parseCompanionAds(companionAdsNode)
  else if (nonlinearNode) attributes.nonlinear = parseNonlinear(nonlinearNode)
  else throw new Error('EMPTY_CREATIVE_ERR')

  return attributes
}

vast.parseLinear = function parseLinear(root) {
  this.log.trace('PARSE_LINEAR')
  var trackingEventsNode = getChildren(root, 'trackingevents', 1)
  var adParametersNode = getChildren(root, 'adparameters', 1)
  var videoClicksNode = getChildren(root, 'videoclicks', 1)
  var mediaFilesNode = getChildren(root, 'mediafiles', 1)
  var durationNode = getChildren(root, 'duration', 1)

  if (!mediaFilesNode)
    throw new Error('NO_MEDIA_FILES_ERR')

  var attributes = {
    files: this.parseMediaFiles(mediaFilesNode),
    duration: this.parseDuration(durationNode),
    tracking: extend(
      trackingEventsNode && this.parseTrackingEvents(trackingEventsNode) || {},
      this.parseVideoClicks(videoClicksNode))
  }

  set(attributes, 'parameters', getContent(adParametersNode))

  return attributes
}

vast.parseMediaFiles = function parseMediaFiles(root) {
  var mediaFileNodes = getChildren(root, 'mediafile')
  if (!mediaFileNodes.length)
    throw new Error('NO_MEDIA_FILE_ERR')
  return mediaFileNodes.map(this.parseMediaFile, this)
}

vast.parseMediaFile = function parseMediaFile(root) {
  this.log.trace('PARSE_MEDIA_FILE')
  var attributes = {
    delivery: getAttribute(root, 'delivery'),
    type: getAttribute(root, 'type'),
    width: getAttributeInteger(root, 'width'),
    height: getAttributeInteger(root, 'height'),
    uri: root.textContent.trim()
  }

  set(attributes, 'scalable', getAttributeBoolean(root, 'scalable'))
  set(attributes, 'maintainAspectRatio', getAttributeBoolean(root, 'maintainAspectRatio'))
  set(attributes, 'codec', getAttribute(root, 'codec'))
  set(attributes, 'id', getAttribute(root, 'id'))
  set(attributes, 'bitrate', getAttributeInteger(root, 'bitrate'))
  set(attributes, 'minBitrate', getAttributeInteger(root, 'minBitrate'))
  set(attributes, 'maxBitrate', getAttributeInteger(root, 'maxBitrate'))

  if (!attributes.uri) throw new Error('NO_URI_ERR')
  if (!attributes.delivery) throw new Error('NO_DELIVERY_ERR')
  if (!attributes.type) throw new Error('NO_TYPE_ERR')
  if (attributes.width === null) throw new Error('NO_WIDTH_ERR')
  if (attributes.height === null) throw new Error('NO_HEIGHT_ERR')

  return attributes
}

vast.parseVideoClicks = function parseVideoClicks(root) {
  this.log.trace('PARSE_VIDEO_CLICKS')
  var clickThroughNode = getChildren(root, 'clickthrough', 1)
  var clickTrackingNodes = getChildren(root, 'clicktracking')
  var attributes = {
    click: clickTrackingNodes.map(getContent).filter(isTruthy)
  }

  set(attributes, 'clickThrough', getContent(clickThroughNode))

  return attributes
}

vast.parseTrackingEvents = function parseTrackingEvents(root) {
  this.log.trace('PARSE_TRACKING_EVENTS')
  var result = {}
  var trackingNodes = getChildren(root, 'tracking')
  var index = trackingNodes.length
  var node, type, uri

  if (!index)
    throw new Error('NO_TRACKING_ERR')

  while (index--) {
    node = trackingNodes[index]
    type = getAttribute(node, 'event')
    uri = node.textContent.trim()

    if (uri && type) {
      if (!result[type])
        result[type] = []

      result[type].push(uri)
    }
  }

  return result
}

vast.parseDuration = function parseDuration(root) {
  if (!root) throw new Error('NO_DURATION_ERR')
  var matches = (getContent(root) || '').match(/^(\d{2}):(\d{2}):(\d{2}(?:\.\d{3})?)/)
  if (!matches) throw new Error('DURATION_FORMAT_ERR')
  return ONE_HOUR*matches[1] + ONE_MINUE*matches[2] + ONE_SECOND*matches[3]
}


/**
 * Select the direct children of a node with a particular name
 * @arg {DOMElement} parent
 * @arg {string} name LOWERCASE tag-name
 * @arg {boolean} firstOnly Just return the first match
 * @return {array|DOMElement}
 */
function getChildren(parent, name, firstOnly) {
  var all = parent.childNodes
  var length = all.length
  var selected = []
  var index, el

  // Preserve order
  for (index = 0; index < length; ++index) {
    el = all[index]
    if (el.constructor.name === 'Element' && el.tagName.toLowerCase() === name) {
      if (firstOnly) return el
      else selected.push(el)
    }
  }

  return firstOnly ? null : selected
}

function set(obj, key, val) {
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


function bySequence(left, right) {
  return left.sequence < right.sequence ? -1 :
    left.sequence > right.sequence ? 1 : 0
}

function settleToVal(res) { return !res.err && res.val }

function isTruthy(val) { return !!val }

// Expose pure functions for testing
vast.getChildren = getChildren
