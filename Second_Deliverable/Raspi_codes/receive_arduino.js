var noble = require('noble');
var Particle = require('particle-api-js');
var pg = require('pg');
var types = require('pg').types;
var particle = new Particle();  //Particle part 
var on_off;
var WATTAGE = 12;
var numOn = 0;
// MODIFY THIS WITH THE APPROPRIATE URL
var socket = require('socket.io-client')('WEB-SERVER-DOMAIN-HERE:8080');
var peripheralIdOrAddress = process.argv[2].toLowerCase();
// These should correspond to the peripheral's service and characteristic UUIDs
var IMU_SERVICE_UUID = "0bdb190aabad11e680f576304dec7eb7";
var LIGHT_ID_UUID = "0bdb1c0cabad11e680f576304dec7eb7";
var IMU_READINGS_UUID = "0bdb1d92abad11e680f576304dec7eb7";
var SESSION_ID_UUID = "19b10001e8f2537e4f6cd104768a1214";
var SELECTION_ID_UUID = "89afbbdce26a4880b1ea055cf7aa644d";

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

socket.on('connect', function() {
  console.log('Connected to server');
  socket.emit('hello');
});

noble.on('stateChange', function(state) {
  if(state === 'poweredOn') {
    console.log('Start BLE scan...')
    noble.startScanning();
    console.log('Started Scanning');  
}
  else {
    console.log('Cannot scan... state is not poweredOn')
    noble.stopScanning();
  }
});


noble.on('discover', function(peripheral) {
  if (peripheral.id === peripheralIdOrAddress || peripheral.address === peripheralIdOrAddress) {
    noble.stopScanning();
    console.log('peripheral with ID ' + peripheral.id + ' found');

    peripheral.once('disconnect', function() {
      console.log('disconnected');
      process.exit(0);
    });

    peripheral.connect(function(error) {
      console.log('connected');
      peripheral.discoverServices([], onServicesDiscovered);
    });
  }
});

function onServicesDiscovered(error, services) {
  console.log('services discovered');
  services.forEach(function(service) {
    console.log(service.uuid);
    if (service.uuid == IMU_SERVICE_UUID) {
      console.log('going to on characteristic discovered');
      console.log(service.uuid);
      service.discoverCharacteristics([], onCharacteristicDiscovered);
    }
  });
}

function onCharacteristicDiscovered(error, characteristics) 
{
  console.log('characteristics discovered');
  characteristics.forEach(function(characteristic) 
  {
    if (characteristic.uuid == IMU_READINGS_UUID) 
    {
      characteristic.on('data', onIMUCharacteristicsRead);
      characteristic.notify(true, function(error) 
      {
        console.log('imuCharacteristic notification on');
      });
    } 
    else if (characteristic.uuid == LIGHT_ID_UUID) 
    {
      characteristic.on('data', onLightCharacteristicRead);

      characteristic.notify(true, function(error) 
      {
        console.log('idCharacteristic notification on');
      });
    } 
    else if (characteristic.uuid == SESSION_ID_UUID) 
    {
      characteristic.on('data', onSessionCharacteristicRead);
      characteristic.notify(true, function(error) 
      {
        console.log('sessionidCharacteristic notification on');
        });
      }
    else if (characteristic.uuid == SELECTION_ID_UUID) 
    {
      characteristic.on('data', onSelectionCharacteristicRead);
      characteristic.notify(true, function(error) 
      {
        console.log('selectionidCharacteristic notification on');
        });
      }
    });
 }

function onIMUCharacteristicsRead(data, isNotification) {
  console.log('imuCharacteristic read response value: ', data.readInt8(0));
  //on_off = data.readInt8(0);
  //functionPost();
}

function onLightCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('idCharacteristic notification value: ', data.readInt8(0));
    var light_id = data.readInt8(0);
    // functionPost();
  } else {
    console.log('idCharacteristic read response value: ', data.readInt8(0));
    //var light_id = data.readInt8(0);
  }
}

function onSessionCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('sessionidCharacteristic notification value: ', data.readInt8(0));
    //var light_id = data.readInt8(0);
    // functionPost();
  } else {
    console.log('sessionidCharacteristic read response value: ', data.readInt8(0));
    //var light_id = data.readInt8(0);
  }
}

function onSelectionCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('onSelectionCharacteristic notification value: ', data.readInt8(0));
    //var light_id = data.readInt8(0);
    // functionPost();
  } else {
    console.log('onSelectionCharacteristic read response value: ', data.readInt8(0));
    //var light_id = data.readInt8(0);
  }
}

particle.login({username: 'luminesense16@gmail.com', password: 'teamuno1'}).then(
  function(data){
    console.log('API call completed on promise resolve: ', data.body.access_token);
  },
  function(err) {
    console.log('API call completed on promise fail: ', err);
  }
);

var token = '7147d52549a2ef1d0920763e843ff897435c5643';
function functionPost() {
  if(on_off == 117){
    var fnPr = particle.callFunction({ 
      deviceId: '21002b001247353236343033',
      name: 'toggleLights', 
      argument: '1,u', 
      auth: token
    });
    numOn = numOn + 1;
    databasePost();
  }
  else if(on_off == 100){
    var fnPr = particle.callFunction({ 
      deviceId: '21002b001247353236343033',
      name: 'toggleLights', 
      argument: '1,d', 
      auth: token
    });
    numOn = numOn - 1;
    databasePost();
  } 
  else if(on_off == 98){ // 'r'
    var fnPr = particle.callFunction({ 
      deviceId: '21002b001247353236343033',
      name: 'toggleLights', 
      argument: '1,b', 
      auth: token
    });
  }
  else if(on_off == 114){ //'b'
    var fnPr = particle.callFunction({ 
      deviceId: '21002b001247353236343033',
      name: 'toggleLights', 
      argument: '1,r', 
      auth: token
    });
  }
  fnPr.then(
  function(data) {
    console.log('Function called succesfully:', data);
  }, function(err) {
    console.log('An error occurred:', err);
  });
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

//Socket stuff-- used later 
/*

function getSocketLabel(uuid) {
  var label = null;

  if(uuid == LIGHT_ID_UUID) {
    label = 'light_code:raspi';
  }
  else if(uuid == IMU_SERVICE_UUID) {
     label = 'ay:raspi';
  }
  // }

  return label;
}

function emitSensorData(characteristic) {
  var socketLabel = getSocketLabel(characteristic.uuid);
  console.log(socketLabel);

  characteristic.on('read', function(data) {
    socket.emit(socketLabel, data.readInt32LE(0));
  });

  characteristic.notify('true', function(error) { if (error) throw error; });
}
*/
