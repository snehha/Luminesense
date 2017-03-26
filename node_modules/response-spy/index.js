'use strict';

var ResponseStream = require('./lib/response-stream');
var response = require('./lib/response-wrappers');

function intercept(res) {
  var stream = new ResponseStream();

  res.setHeader = response.setHeader(res.setHeader, res);
  res.removeHeader = response.removeHeader(res.removeHeader, res);
  res.writeHead = response.writeHead(res.writeHead, res, stream);
  res.write = response.write(res.write, res, stream);
  res.end = response.end(res.end, res, stream);

  return stream;
}

module.exports = intercept;
