'use strict';

var slice = require('sliced');
var utils = {};

utils.setHeaders = function setHeaders(setHeader, obj) {
  if (!obj) { return; }

  var keys = Object.keys(obj);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k) { setHeader(k, obj[k]); }
  }
};

utils.wrap = function wrap(originalFn, context, fn) {
  return function wrapFn() {
    var args = slice(arguments);
    fn.apply(context, args);
    return originalFn.apply(context, args);
  };
};

module.exports = utils;
