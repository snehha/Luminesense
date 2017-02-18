"use strict";

var crypto = require('crypto');
var once = require('once');
var fs = require('fs');
var slice = [].slice;
var waits = require('waits');
var fills = require('fills');

var hash = {};

hash.getForString = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
};

hash.getForStream = function(stream, cb) {
  var shasum = crypto.createHash('sha1');

  stream.on('data', function(d) {
    shasum.update(d);
  });

  stream.once('error', cb);

  var getHash = once(function() {
    cb(null, shasum.digest('hex'));
  });

  stream.once('end', getHash);
  stream.once('finish', getHash);
  stream.once('close', getHash);
};

hash.getForStreams = function() {
  var args = slice.call(arguments);
  var cb = args.pop();
  var results = [];

  var next = waits(cb.bind(null, null, results));

  args.forEach(function(stream, i) {
    hash.getForStream(stream, next(fills(results)));
  });
};

module.exports = hash;
