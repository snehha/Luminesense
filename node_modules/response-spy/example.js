/*eslint-disable no-console, func-names*/
'use strict';

var http = require('http');
var intercept = require('./');

http.createServer(function(req, res) {
  // returns a readable stream with the response output as the data
  var stream = intercept(res);

  // You can also see the headers sent, uncomment below
  /*
  stream.on('headers', function(headers, statusCode) {
    // headers === Array || null (implicit headers)
    console.log('url: %s, headers: ', req.url, headers);
  });
  */

  stream.pipe(process.stdout);

  if (req.url === '/') {
    res.setHeader('X-Powered-By', 'alessioalex');
    res.writeHead(200, { 'Content-Type': 'text/html', 'X-Pid': 1239 });
    res.end('Hello world\n');
  } else if (req.url === '/pipe') {
    require('fs').createReadStream(__filename).pipe(res);
  } else if (req.url === '/implicit-headers') {
    res.end('go\n');
  } else {
    res.writeHead(404, { 'Connection': 'closed', 'Content-Type': 'text/html' });
    res.end('Page Not Found\n');
  }
}).listen(5000);
console.log('Ok good, now visit http://localhost:5000/ && http://localhost:5000/pipe');
console.log('.. and then check your terminal');
