'use strict';

var utils = require('./utils');
var res = {};
var isStreamEnded = require('is-stream-ended');

res.setHeader = function resSetHeader(originalFn, context) {
  return utils.wrap(originalFn, context, function setHeadersWrapper(name, value) {
    if (arguments.length > 1 && !this.headersSent) {
      // not using this._headers and this._implicitHeaders()
      // to be future proof
      this.__headers2 = this.__headers2 || {};

      this.__headers2[name.toLowerCase()] = value;
    }
  });
};

res.removeHeader = function resRemoveHeader(originalFn, context) {
  return utils.wrap(originalFn, context, function removeHeaderWrapper(name) {
    if (arguments.length > 0 && !this.headersSent) {
      this.__headers2 = this.__headers2 || {};

      delete this.__headers2[name.toLowerCase()];
    }
  });
};

res.writeHead = function resWriteHead(originalFn, context, stream) {
  return utils.wrap(originalFn, context, function writeHeadWrapper(statusCode, statusMessage, heads) {
    var headers;

    headers = (typeof statusMessage !== 'string') ? statusMessage : heads;

    this.__headers2 = this.__headers2 || {};
    utils.setHeaders(this.setHeader.bind(this), headers);

    stream.emit('headers', this.__headers2, statusCode);
  });
};

res.write = function resWrite(originalFn, context, stream) {
  return utils.wrap(originalFn, context, function writeWrapper(data) {
    if (!this.headersSent) {
      this.writeHead(this.statusCode);
    }

    if (typeof data !== 'undefined' && !isStreamEnded(stream)) {
      stream.push(data);
    }
  });
};

res.end = function resEnd(originalFn, context, stream) {
  return utils.wrap(originalFn, context, function endWrapper(data) {
    if (!this.headersSent) {
      this.writeHead(this.statusCode);
    }

    if (!isStreamEnded(stream)) {
      if (typeof data !== 'undefined') { stream.push(data); }
      stream.push(null);
    }
  });
};

module.exports = res;
