var express = require('express');
var pg = require('pg');
var app = express();
var WATTAGE = 12;

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

pg.defaults.ssl = true;
var connection = "postgres://jryhvlrzsvchoc:0fece6e968bfa67a69e4ed643f60fb9aeb8d7d29d1eada2a493ce5faeef8787b@ec2-23-21-111-81.compute-1.amazonaws.com:5432:/d9obmj9ncrr8al"
pg.connect(process.env.DATABASE_URL, function(err, client){
	if (err) throw err;
	console.log('Connected to postgres! Getting schemas...');

	//client
	//.query('SELECT table_scheme, table_name FROM information_schema.tables;')
	/*client.query('SELECT $1::timestamp AS my_query', ['values'])
	client.on('row', function(row) {
		console.log(JSON.stringify(row));*/
	//client.query('INSERT INTO time (timing, lightson) VALUES ($1, $2);', [new Date(), 1]);
	var query = client.query('SELECT timing FROM time', [], function(err,result){
		if (err) throw err;
		var kwArray = [];
		var timestamps = [];
		//comment
		//var date = new Date(Number(result.rows[0].timing));
		//timestamps.push(date.toDateString());
		var date;
		for (var i = 1; i < result.rows.length; i++){
			date = new Date(Number(result.rows[i].timing));
			//timestamps.push(date.toDateString());
			var editdate = String(date.getFullYear());
			editdate = editdate.concat("-", "0", String(date.getMonth()), "-", "0", String(date.getDay() + i));
			timestamps.push(editdate);
			console.log("%s", timestamps[i - 1]);
			var timediff = Math.abs(Number(result.rows[i].timing) - Number(result.rows[i - 1].timing));
			//var kwh = WATTAGE * Number(result.rows[i].lightson) * (timediff / 1000 / 60 / 60) / 1000;
			var kwh =  WATTAGE * i * (timediff / 1000 / 60);
			console.log("%d", kwh);
			kwArray.push(kwh);
		}
		//global.result = Number(result.rows[0].timing);
		global.kwh = kwArray;
		global.times = timestamps;
		console.log("%d, %s", global.kwh[0], global.times[0]);
		//console.log("%d", result.rows.length);
		//console.log("%d", result.rows[0].timing);
		//exports.data = result;
		//console.log(JSON.stringify(result.rows.timing));
	});
	//colums: timing and on_off
	//schema is public
	//});
});

// set the home page route
app.get('/', function(req, res) {
    // ejs render automatically looks in the views folder
    	//console.log("%d", global.result.rows[0].timing);
    	//var data = req.app.locals.data.rows[0].timing;
        //var data = global.result.rows[0].timing;
        res.render('index');
    });

app.get('/index.html', function(req, res){
	res.render('index');
	//res.render('index', {"timestamp": time, "boolean:" on_off});
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

