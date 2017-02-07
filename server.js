var express = require('express');
var app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {
    // ejs render automatically looks in the views folder
        res.render('index');
    });

//set the chart route
app.get('/charts.html', function(req, res){
        res.render('charts');
    });

//set the tables route
app.get('/tables.html', function(req, res){
		res.render('tables');
});

//set blank page route
app.get('/blank-page.html', function(req, res){
		res.render('blank-page')
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
