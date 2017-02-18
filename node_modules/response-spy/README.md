     _ __ ___  ___ _ __   ___  _ __  ___  ___        ___ _ __  _   _ 
    | '__/ _ \/ __| '_ \ / _ \| '_ \/ __|/ _ \      / __| '_ \| | | |
    | | |  __/\__ \ |_) | (_) | | | \__ \  __/      \__ \ |_) | |_| |
    |_|  \___||___/ .__/ \___/|_| |_|___/\___|      |___/ .__/ \__, |
                  | |                                   | |     __/ |
                  |_|                                   |_|    |___/ 

Node module for intercepting HTTP responses sent in your apps.

## Example

```js
var http = require('http');
var intercept = require('response-spy');

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
```

## How does it work?

It overrides the `OutgoingMessage` native functions (`write`, `writeHead`, `end`, `setHeader`, `removeHeader`), without affecting your apps (the original functions will be called with the same params, these are just thin wrappers).
With `response-spy` you practically get a `ReadableStream` from your `response` object.

## Use cases

- generating cache
- traffic analysis
- etc

## License MIT
