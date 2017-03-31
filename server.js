var express = require('express');
var pg = require('pg');
var app = express();
var fs = require("fs");
var WATTAGE = 12;

var client = new pg.Client({
	user: "jryhvlrzsvchoc",
	password: "0fece6e968bfa67a69e4ed643f60fb9aeb8d7d29d1eada2a493ce5faeef8787b",
	database: "d9obmj9ncrr8al",
	port: 5432,
	host: "ec2-23-21-111-81.compute-1.amazonaws.com",
	ssl: true
});
client.connect();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

var query = client.query('SELECT kw, day FROM dailystats', [], function(err,result){
	if (err) throw err;
	if (result.rows.length > 1){
		var graphdata = [];
		for (i = 0; i < result.rows.length; i++){
			var date = new Date(result.rows[i].day);
			var editdate = String(date.getFullYear());
			editdate = editdate.concat("-", "0", String(date.getMonth() + 1), "-", String(date.getDate()));
			var jString = '{ "period": "' + editdate + '", "kw": "' + result.rows[i].kw + '" }';
			graphdata.push(JSON.parse(jString));
		}
		global.linedata = JSON.stringify(graphdata, null, 4);
	}
});

// set the home page route
app.get('/', function(req, res) {
        res.render('index');
});

app.get('/index.html', function(req, res){
	res.render('index');
});

//set the chart route
app.get('/charts.html', function(req, res){
        res.render('charts', {linedata : global.linedata});
});

//set the gestures route
app.get('/gestures.html', function(req, res){
		res.render('gestures');
});

app.post('/gestures.html', function(req, res){
	console.log(req.body);
	res.render('gestres');
})

//set blank page route
app.get('/blank-page.html', function(req, res){
		res.render('blank-page')
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});