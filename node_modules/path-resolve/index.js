var tilde     = require('expand-tilde');
var path      = require('path');
var __dirname = __dirname || process.cwd();

module.exports = function(src) {
  src = tilde(src);
  return (src[0] === '/') ? src : path.resolve(src);
};
