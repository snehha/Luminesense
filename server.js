var express = require('express');
var pg = require('pg');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
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

var particle = new Particle(); 
var token = '72409242cf2554bebb494f5e0a94775456005de7';	
particle.login({username: 'mcl.testbed@gmail.com', password: 'littlesarmy'}).then(
function(data){
console.log('API call completed on promise resolve: ', data.body.access_token);
},
function(err) {
console.log('API call completed on promise fail: ', err);
});	

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded());

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
	res.render('gestures');
	client.query('DELETE FROM gestures');
	client.query('INSERT INTO gestures (gesture, command) VALUES ($1, $2);', ["on", req.body.on]);
	client.query('INSERT INTO gestures (gesture, command) VALUES ($1, $2);', ["off", req.body.off]);
	client.query('INSERT INTO gestures (gesture, command) VALUES ($1, $2);', ["red", req.body.red]);
	client.query('INSERT INTO gestures (gesture, command) VALUES ($1, $2);', ["blue", req.body.blue]);
	var query = client.query('SELECT gesture,command FROM gestures', [], function(err,result){
		if (err) throw err;
	});
});

app.post('/lightchange', function(req, res){
	if (req.body.lights == "on"){

	}
	else{

	}
});

app.post('/colorchange', function(req,res){
	console.log(req.body.color);
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
