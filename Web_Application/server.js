var path = require('path'),
	express = require('express'), 
	http = require('http');
	bodyParser = require('body-parser');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/public')));
app.engine('.html', require('ejs').__express);

app.get('/', function(req, res) {
        res.render('gestures')

    });

app.get('/gestures.html', function(req, res){
        res.render('gestures');
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

