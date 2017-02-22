var should = require('should');
var response = require('../../lib/response-wrappers');
var noop = function() {};

describe('response-wrappers', function() {
  describe('#setHeader', function() {
    it('should not do anything for improper arguments', function() {
      var ctx = {};
      var setHeader = response.setHeader(noop, ctx);

      setHeader();
      (ctx.__headers2 || {}).should.be.empty;
    });

    it('should not do anything if headers sent', function() {
      var ctx = { headersSent: true };
      var setHeader = response.setHeader(noop, ctx);

      setHeader('X-Powered-By', 'val');
      (ctx.__headers2 || {}).should.be.empty;
    });

    it('should set lowercase header and value', function() {
      var ctx = {};
      var setHeader = response.setHeader(noop, ctx);

      setHeader('X-Powered-By', 'val');
      ctx.__headers2['x-powered-by'].should.eql('val');
    });
  });

  describe('#removeHeader', function() {
    it('should not do anything for improper arguments', function() {
      var ctx = { __headers2: { 'x-powered-by': 'val' } };
      var removeHeader = response.removeHeader(noop, ctx);

      removeHeader();
      ctx.__headers2['x-powered-by'].should.eql('val');
    });

    it('should not do anything if headers sent', function() {
      var ctx = { __headers2: { 'x-powered-by': 'val' }, headersSent: true };
      var removeHeader = response.removeHeader(noop, ctx);

      removeHeader('x-powered-by');
      ctx.__headers2['x-powered-by'].should.eql('val');
    });

    it('should remove lowercase header', function() {
      var ctx = { __headers2: { 'x-powered-by': 'val' } };
      var removeHeader = response.removeHeader(noop, ctx);

      removeHeader('x-pOwErEd-bY');
      ctx.__headers2.should.be.empty;
    });
  });

  describe('#writeHead', function() {
    it('should set headers', function() {
      var headers = {
        'content-type': 'application/json',
        'x-powered-by': 'val'
      };
      var ctx = {
        setHeader: function(name, val) {
          this.__headers2[name] = val;
        }
      };
      var stream = {
        emit: function(evt, h, code) {
        }
      };
      var writeHead = response.writeHead(noop, ctx, stream);
      writeHead(200, headers);

      ctx.__headers2.should.eql(headers);
    });

    it('should emit headers and statusCode', function(done) {
      var headers = {
        'content-type': 'application/json',
        'x-powered-by': 'val'
      };
      var ctx = {
        setHeader: function(name, val) {
          this.__headers2[name] = val;
        }
      };
      var stream = {
        emit: function(evt, h, code) {
          h.should.eql(headers);
          code.should.eql(404);
          done();
        }
      };
      var writeHead = response.writeHead(noop, ctx, stream);
      writeHead(404, headers);
    });
  });

  describe('#write', function() {
    it('should call writeHead (once) if headers are not sent', function() {
      var stream = [];
      stream.ended = false;
      var code;
      var ctx = {
        writeHead: function(c) {
          if (code) {
            throw new Error('called writeHead multiple times');
          }
          code = c;
        },
        statusCode: 200
      };
      var write = response.write(noop, ctx, stream);
      write('data');
      ctx.headersSent = true;
      write('data2');
      code.should.eql(200);
    });

    it('should push data to stream', function() {
      var stream = [];
      stream.ended = false;
      var code;
      var ctx = {
        headersSent: true
      };
      var write = response.write(noop, ctx, stream);
      write('data');
      write('data2');
      delete stream.ended;
      stream.should.eql(['data', 'data2']);
    });
  });

  describe('#end', function() {
    it('should call writeHead if headers are not sent', function() {
      var stream = [];
      stream.ended = false;
      var code;
      var ctx = {
        writeHead: function(c) {
          if (code) {
            throw new Error('called writeHead multiple times');
          }
          code = c;
        },
        statusCode: 200
      };
      var end = response.end(noop, ctx, stream);
      end('data');
      ctx.headersSent = true;
      code.should.eql(200);
    });

    it('should push null to stream if no arguments', function() {
      var stream = [];
      stream.ended = false;
      var ctx = { headersSent: true };
      var end = response.end(noop, ctx, stream);
      end();
      delete stream.ended;
      stream.should.eql([null]);
    });

    it('should push data argument and null to stream', function() {
      var stream = [];
      stream.ended = false;
      var ctx = { headersSent: true };
      var end = response.end(noop, ctx, stream);
      end('data');
      delete stream.ended;
      stream.should.eql(['data', null]);
    });
  });
});
