/**
* Extracted from http://codewinds.com/blog/2013-08-04-nodejs-readable-streams.html
*/
var crypto = require('crypto');
var stream = require('stream');
var util = require('util');

var Readable = stream.Readable;

function RandomStream(length, options) {
  // allow calling with or without new
  if (!(this instanceof RandomStream)) {
    return new RandomStream(length, options);
  }

  // init Readable
  Readable.call(this, options);

  // save the length to generate
  this.lenToGenerate = length;
  this.encoding = (options && options.encoding) || 'binary';
}
util.inherits(RandomStream, Readable);

RandomStream.prototype._read = function (size) {
  process.nextTick(function() {
    if (!size) size = 1024; // default size
    var ready = true;
    while (ready) { // only cont while push returns true
      if (size > this.lenToGenerate) { // only this left
        size = this.lenToGenerate;
      }
      if (size) {
        if (this.encoding !== 'binary') {
          ready = this.push(crypto.randomBytes(size).toString(this.encoding));
        } else {
          ready = this.push(crypto.randomBytes(size));
        }
        this.lenToGenerate -= size;
      }

      // when done, push null and exit loop
      if (!this.lenToGenerate) {
        this.push(null);
        ready = false;
      }
    }
  }.bind(this));
};

module.exports = RandomStream;
