"use strict";

var intercept = require('../../');
var fs = require('fs');
var express = require('express');
var app = express();
var hash = require('../utils/hash');
var RandStream = require('../utils/random-stream');
var req = require('request');
var noop = function(){};
var should = require('should');
var http = require('http');

var urls = ['/buffer-stream', '/string-stream', '/end', '/writeHead', '/other'];

app.disable('x-powered-by');

var index = 0;

function assertData(expected, actual, url) {
  if (actual.hashes.length) {
    actual.hashes[0].should.eql(actual.hashes[1]);
  }
  expected.headers.should.eql(actual.headers);
  expected.statusCode.should.eql(actual.statusCode);

  index++;
  if (index === urls.length) {
    console.log('functional tests passed');
    server.close();
  }
}

app.get('/buffer-stream', function(req, res, next) {
  var rs = new RandStream(80048);
  var stream = intercept(res);
  var headers = {};
  var statusCode;

  res.setHeader('X-Test', 'ok');

  stream.on('headers', function(hds, code) {
    headers = hds;
    statusCode = code;
  });

  hash.getForStreams(rs, stream, function(err, hashes) {
    assertData({
      statusCode: 200,
      headers: { 'x-test': 'ok' }
    }, {
      hashes: hashes,
      statusCode: statusCode,
      headers: headers
    }, req.url);
  });

  rs.pipe(res);
});

app.get('/string-stream', function(req, res, next) {
  var rs = new RandStream(80048, { encoding: 'base64' });
  var stream = intercept(res);
  var statusCode;

  stream.on('headers', function(hds, code) {
    statusCode = code;
  });

  res.statusCode = 201;

  hash.getForStreams(rs, stream, function(err, hashes) {
    assertData({
      statusCode: 201,
      headers: {}
    }, {
      hashes: hashes,
      statusCode: statusCode,
      headers: {}
    }, req.url);
  });

  rs.pipe(res);
});

app.get('/end', function(req, res, next) {
  var stream = intercept(res);
  var headers;
  var statusCode;
  var msg = '<b>Hello world!\n</b>';

  stream.on('headers', function(hds, code) {
    headers = hds;
    statusCode = code;
  });

  hash.getForStream(stream, function(err, h) {
    assertData({
      statusCode: 200,
      headers: { 'content-type': 'text/html' }
    }, {
      hashes: [h, hash.getForString(msg)],
      statusCode: statusCode,
      headers: headers
    }, req.url);
  });

  res.setHeader('content-type', 'text/html');
  res.end(msg);
});

app.get('/writeHead', function(req, res, next) {
  var stream = intercept(res);
  var headers;
  var statusCode;
  var msg = '<b>Hello world!\n</b>';

  stream.on('headers', function(hds, code) {
    headers = hds;
    statusCode = code;
  });

  hash.getForStream(stream, function(err, h) {
    assertData({
      statusCode: 202,
      headers: {
        'content-type': 'text/html',
        'x-powered-by': 'express'
      }
    }, {
      hashes: [h, hash.getForString(msg)],
      statusCode: statusCode,
      headers: headers
    }, req.url);
  });

  res.setHeader('content-type', 'text/html');
  res.writeHead(202, { 'x-powered-by': 'express' });
  res.write(msg);
  res.end();
});

app.get('*', function(req, res, next) {
  var stream = intercept(res);
  var headers;
  var statusCode;

  stream.on('headers', function(hds, code) {
    headers = hds;
    statusCode = code;
  });

  var originalRes = '';
  var interceptedRes = '';
  stream.on('data', function() {
    interceptedRes = '1';
  });

  stream.on('end', function() {
    assertData({
      statusCode: 404,
      headers: {}
    }, {
      hashes: [originalRes, interceptedRes],
      statusCode: statusCode,
      headers: headers
    }, req.url);
  });

  res.statusCode = 404;
  res.end();
});

var server = http.createServer(app).listen(4444);

urls.forEach(function(url) {
  req('http://localhost:4444' + url, noop);
});
