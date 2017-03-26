var pg = require('pg');
var types = require('pg').types;
var WATTAGE = 12;
var on_off;
var numOn = 0;

var client = new pg.Client({
	user: "jryhvlrzsvchoc",
	password: "0fece6e968bfa67a69e4ed643f60fb9aeb8d7d29d1eada2a493ce5faeef8787b",
	database: "d9obmj9ncrr8al",
	port: 5432,
	host: "ec2-23-21-111-81.compute-1.amazonaws.com",
	ssl: true
});
client.connect();

//calls checkDatabase every hour
setInterval(checkDatabase, 1000 * 60 * 60);

function databasePost(){
    client.query('INSERT INTO time (timing, lightson) VALUES ($1, $2);', [new Date(), numOn]);
}

//check to see if it has been 24 hours since the last update
function checkDatabase(){
	var query = client.query('SELECT day FROM dailystats', [], function(err,result){
      if (err) throw err;
      var currDate = new Date(Date.now());
      //check if there is an entry
      if (result.rows.length){
      	var dataDate = new Date(Date.parse(result.rows[result.rows.length - 1].day));
        var timeDiff = Math.abs(dataDate.getTime() - currDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
        if (diffDays >= 2){
          databaseUpdate();
        }
      }

      //if there is no entry, add one
      else{
      	databaseUpdate();
      }
      
    });
};

//parse values from time database, upload into dailystats database
function databaseUpdate(){
	var kwh = 0;
	var query = client.query('SELECT timing, lightson FROM time', [], function(err,result){
		if (err) throw err;
		var date = new Date(Number(result.rows[0].timing));
		var parseDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		var i = 1;
		for (i = 1; i < result.rows.length; i++){
			var timediff = Math.abs(Number(result.rows[i].timing) - Number(result.rows[i - 1].timing));
			bulbs = result.rows[i - 1].lightson;
			kwh += (WATTAGE * bulbs * (timediff / (1000 * 60 * 60)) / 1000);
		}
		//var last = new Date(Number(result.rows[i - 1].timing));
		//client.query('DELETE FROM time WHERE timing < $1;', [last]);
		client.query('DELETE FROM time');
		client.query('INSERT INTO dailystats (kw, day) VALUES ($1, $2);', [kwh, new Date()]);
	});
}