var should = require('should');
var utils = require('../../lib/utils');

describe('utils', function() {
  describe('#setHeaders', function() {
    it('should return early in case the object is missing', function() {
      var fn = function() { throw new Error('fn should not be called'); }

      utils.setHeaders(fn);
    });

    it('should call the setHeader() with the key-value pairs', function() {
      var keys = [];
      var values = [];
      var fn = function(key, val) {
        keys.push(key);
        values.push(val);
      };
      var params = { test: 1, 'test2': 'value', test3: 'val' };

      utils.setHeaders(fn, params);

      keys.length.should.eql(3);
      values.length.should.eql(3);

      for (var i = 0; i < 3; i++) {
        params[keys[i]].should.eql(values[i]);
      }
    });

    it('should not call the setHeaders function for invalid keys', function() {
      var fn = function() { throw new Error('fn should not be called'); }

      utils.setHeaders(fn, { '': 'beep' });
    });
  });

  describe('#wrap', function() {
    it('should call the functions in order', function() {
      var order = [];
      var fn1 = function() { order.push(1); }
      var fn2 = function() { order.push(2); }
      var wrappedFn = utils.wrap(fn2, context, fn1);

      wrappedFn();

      order.should.eql([1, 2]);
    });

    it('should call both functions with same context and args', function() {
      var context1, context2;
      var args1, args2;

      var obj1 = {
        fn1: function() {
          args1 = Array.prototype.slice.call(arguments);
          context1 = this;
        },
        ctx: 1
      };

      var obj2 = {
        fn2: function() {
          args2 = Array.prototype.slice.call(arguments);
          context2 = this;
        },
        ctx: 2
      };

      var context = { ctx: 3 };
      var args = [1, [2, 3], 'test'];
      var wrappedFn = utils.wrap(obj2.fn2, context, obj1.fn1);

      wrappedFn.apply(null, args);

      args1.should.eql(args);
      args2.should.eql(args);
      context1.should.eql(context);
      context2.should.eql(context);
    });
  });
});
