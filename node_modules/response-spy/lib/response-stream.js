'use strict';

var stream = require('stream');
var util = require('util');
var Readable = stream.Readable;

function ResponseStream(length, options) {
  // allow calling with or without new
  if (!(this instanceof ResponseStream)) {
    return new ResponseStream(length, options);
  }

  // init Readable
  Readable.call(this, options);
}
util.inherits(ResponseStream, Readable);

ResponseStream.prototype._read = function read() {};

module.exports = ResponseStream;
