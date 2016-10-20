'use strict';

/**
 * Iterate over a collection asynchronously and invoke a callback when it's all done
 * @param {array} collection
 * @param {function} iterator (item, next)
 * @param {function} done (err, resultsArray)
 * @param {object} context This-arg for iterator/done
 */
function mapAsync(collection, iterator, done, context) {
  var acc = []
  var expected = collection.length
  var count = 0
  collection.forEach(function (item, index) {
    iterator.call(context, item, function next(err, val) {
      acc[index] = {err: err, val: val}
      if (++count >= expected) done.call(context, acc)
    })
  })
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
  // Preserve order!
  for (index = 0; index < length; ++index) {
    el = all[index]
    if (el.constructor.name === 'Element' && el.tagName.toLowerCase() === name) {
      if (firstOnly) return el
      else selected.push(el)
    }
  }
  return firstOnly ? null : selected
}

module.exports = {mapAsync, getChildren}
