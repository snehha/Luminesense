var noble = require('noble');
var Particle = require('particle-api-js');
var pg = require('pg');
var types = require('pg').types;
// Initialize Particle Photon
var particle = new Particle(); 
// Gesture
var gesture;
// Session
var session;
// Lights
var light_id;
var luminaire_device_id;
// Selection
var selection;
// Power/Energy savings
var WATTAGE = 12;
var numOn = 0;
// End Selection
var end_selection;
var active_imu = 0;
// MODIFY THIS WITH THE APPROPRIATE URL
var socket = require('socket.io-client')('128.197.180.199:8080');
var peripheralIdOrAddress = process.argv[2];
peripheralIdOrAddress = peripheralIdOrAddress.toLowerCase();
// Peripheral's service and characteristic UUIDs
var IMU_SERVICE_UUID = "0bdb190aabad11e680f576304dec7eb7";
var LIGHT_ID_UUID = "0bdb1c0cabad11e680f576304dec7eb7";
var IMU_READINGS_UUID = "0bdb1d92abad11e680f576304dec7eb7";
var SESSION_ID_UUID = "19b10001e8f2537e4f6cd104768a1214";
var SELECTION_ID_UUID = "89afbbdce26a4880b1ea055cf7aa644d";
var END_SELECTION_UUID = "fc9221a3de794e668d2fbd1491c93125";
// Luminaire Device ID's
var LUMINAIRE_IDS = ['430035001647353236343033','390040001347353236343033','3f0030000d47343432313031',
'190032001547343339383037', '2e0025000b47353235303037', '300030001147353236343033', '32003a000b47353235303037',
'2f0018000a47353235303037', '320026001147353236343033'];
// Selected ID's
var SELECTED_LUMINAIRES = [];
var occupancy = 0;

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

//calls checkRoom every second
setInterval(checkRoom, 1000);

var token = '72409242cf2554bebb494f5e0a94775456005de7';

function checkRoom(){
	var query = client.query('SELECT detected FROM adaptive', [], function(err, result){
		if (err) throw err;
		//nobody in room, someone detected
		if (occupancy == 0 && result.rows[0].detected == 1){
			occupancy = 1;
			//client.query('DELETE FROM adaptive');
			//client.query('INSERT INTO adaptive (detected) VALUES ($1);', [
			for (var i = 0; i < LUMINAIRE_IDS.length; i++) {
				var device_id = LUMINAIRE_IDS[i];
				var fnPr = particle.callFunction({ 
				deviceId: device_id,
				name: 'toggleLights', 
				argument: 'u', 
				auth: token
				});
				numOn = LUMINAIRE_IDS.length;
				databasePost();
			}
		}
		//someone was in room, now has left
		else if (occupancy == 1 && result.rows[0].detected == 0){
		//else if (occupancy == 1){
			occupancy = 0;
			for (var i = 0; i < LUMINAIRE_IDS.length; i++) {
				var device_id = LUMINAIRE_IDS[i];
				var fnPr = particle.callFunction({ 
				deviceId: device_id,
				name: 'toggleLights', 
				argument: 'd', 
				auth: token
				});
				numOn = LUMINAIRE_IDS.length;
				databasePost();
			}
		}
		else{
			var fnPR = null;
		}
		if (fnPr != null){
			fnPr.then(
				function(data) {
				//console.log('Function called succesfully:', data);
				console.log('Function called succesfully');
				}, function(err) {
				console.log('An error occurred:', err);
					}
			);
		}
	});
	

    active_imu = 0;
}

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
      else if (characteristic.uuid == END_SELECTION_UUID)
      {
	  characteristic.on('data', onEndSelectionCharacteristicRead);
	  characteristic.notify(true, function(error)
				{
				    console.log('sessionidCharacteristic notification on');
				});
      }
    });
 }

function gestureSwitch(name){
    if (name == "on"){
	return 117;
    }
    else if (name == "off"){
	return 100;
    }
    else if (name == "red"){
	return 114;
    }
    else if (name == "blue"){
	return 98;
    }
}

function onIMUCharacteristicsRead(data, isNotification) {
  console.log('imuCharacteristic read response value: ', data.readInt8(0));
    on_off = data.readInt8(0);
	if (on_off == 117){
    var query = client.query('SELECT gesture FROM gestures WHERE command=\'up\'', [], function(err,result){
      if (err) throw err;
      gesture = gestureSwitch(result.rows[0].gesture);
      console.log(result);
      console.log("parsing:");
      console.log(gesture);
    });
  }
  else if (on_off == 100){
    var query = client.query('SELECT gesture FROM gestures WHERE command=\'down\'', [], function(err,result){
      if (err) throw err;
      gesture = gestureSwitch(result.rows[0].gesture);
      console.log(result);
      console.log("parsing:");
      console.log(gesture);
    });
  }
  else if (on_off == 98){
    var query = client.query('SELECT gesture FROM gestures WHERE command=\'left\'', [], function(err,result){
      if (err) throw err;
      gesture = gestureSwitch(result.rows[0].gesture);
      console.log(result);
      console.log("parsing:");
      console.log(gesture);
    });
  }
  else if (on_off == 114){
    var query = client.query('SELECT gesture FROM gestures WHERE command=\'right\'', [], function(err,result){
      if (err) throw err;
      gesture = gestureSwitch(result.rows[0].gesture);
      console.log(result);
      console.log("parsing:");
      console.log(gesture);
    });
  }
  gesture_update();
}

// Function reads incoming light_ID data
function onLightCharacteristicRead(data, isNotification) {
  if (isNotification) {
   console.log('idCharacteristic notification value: ', data.readInt8(0));
    light_id = data.readInt8(0);
    light_update();
  } else {
    //console.log('idCharacteristic read response value: ', data.readInt8(0));
    light_id = data.readInt8(0);
  }
}

// Function reads incoming session data
function onSessionCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('sessionidCharacteristic notification value: ', data.readInt8(0));
    session_id = data.readInt8(0);
    session_update();
  } else {
    console.log('sessionidCharacteristic read response value: ', data.readInt8(0));
    session_id = data.readInt8(0);
  }
}

// Function reads incoming selection_data
function onSelectionCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('onSelectionCharacteristic notification value: ', data.readInt8(0));
    selection = data.readInt8(0);
    luminaire_selection();
  } else {
    //console.log('onSelectionCharacteristic read response value: ', data.readInt8(0));
    selection = data.readInt8(0);
  }
}

// Function reads incoming end_selection data
function onEndSelectionCharacteristicRead(data, isNotification) {
    if (isNotification) {
	console.log('onSelectionCharacteristic notification value: ', data.readInt8(0));
	end_selection = data.readInt8(0);
	end_luminaire_selection();
    } else {
	//console.log('onSelectionCharacteristic read response value: ', data.readInt8(0));
	end_selection = data.readInt8(0);
    }
}

particle.login({username: 'mcl.testbed@gmail.com', password: 'littlesarmy'}).then(
  function(data){
    console.log('API call completed on promise resolve: ', data.body.access_token);
  },
  function(err) {
    console.log('API call completed on promise fail: ', err);
  }
);

// Function controls the status of the session (for user/system interactions)
function session_update() {
	// Loop through all device ID's
	for (var i = 0; i < LUMINAIRE_IDS.length; i++) {
	var device_id = LUMINAIRE_IDS[i];
	if(session_id == 73){
	// Call Particle to end session
    var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'session_str',
      argument: '1',  
      auth: token
    });
  }
	    else if(session_id == 79) {
		// Reset all variables
		SELECTED_LUMINAIRES = [];
		light_id = '0';
		luminaire_device_id = '0';
		active_imu = 0;
		end_selection = 0;
		selection = 0;
	  // Call Particle to end session
	  var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'session_end',
      argument: '1',
      auth: token
    });
  }
  	else{
		var fnPR = null;
	} 		

	if (fnPr != null){
		fnPr.then(
			function(data) {
			//console.log('Function called succesfully:', data);
			console.log('Function called succesfully');
				}, function(err) {
				console.log('An error occurred:', err);
					}
			);
		}
	}
}

// Function determines the Device ID of the luminaire being observed
function light_update() {
	switch(light_id)
	{
		case 1: luminaire_device_id = "430035001647353236343033";
		break;
		case 2: luminaire_device_id = "3f0030000d47343432313031";
		break;
		case 3: luminaire_device_id = "2f0018000a47353235303037";
		break;
		case 4: luminaire_device_id = "190032001547343339383037";
		break;
		case 5: luminaire_device_id = "300030001147353236343033";
		break;
		case 6: luminaire_device_id = "390040001347353236343033";
		break;
		case 7: luminaire_device_id = "32003a000b47353235303037";
		break;
		case 8: luminaire_device_id = "320026001147353236343033";
		break;
		case 9: luminaire_device_id = "2e0025000b47353235303037";
		break;
		default: luminaire_device_id = "0";
		break;
	}
	//console.log('Current device ID');
	//console.log(luminaire_device_id);
}

// Function selects the luminaires
function luminaire_selection() {
	// Check if luminaire is being selected, has a valid ID, and has not already been selected
    if ((LUMINAIRE_IDS.indexOf(luminaire_device_id) > -1) && (SELECTED_LUMINAIRES.indexOf(luminaire_device_id) == -1) && (active_imu == 0))
	{
		//console.log('Successfully added luminaire');
		SELECTED_LUMINAIRES.push(luminaire_device_id);
	}
	// Display selected luminaires
	console.log('Selected luminaires');
	if(SELECTED_LUMINAIRES.length > 0)
	{
	for (var i = 0; i < SELECTED_LUMINAIRES.length; i++)
	{
		var device_name;
		var device_id = SELECTED_LUMINAIRES[i];
		var device_index = LUMINAIRE_IDS.indexOf(device_id);
		switch(device_index)
		{
			case 0: device_name = 'a1';
			break;
			case 1: device_name = 'a2';
			break;
			case 2: device_name = 'a3';
			break;
			case 3: device_name = 'b1';
			break;
			case 4: device_name = 'b2';
			break;
			case 5: device_name = 'b3';
			break;
			case 6: device_name = 'c1';
			break;
			case 7: device_name = 'c2';
			break;
			case 8: device_name = 'c3';
			break;
			default: device_name = 'none';
		}
		console.log(device_name);
	}
}
}

function end_luminaire_selection() {
    if(end_selection == 69)
    {
	active_imu = 1;
    }
}

function gesture_update() {
    // Loop through all device ID's
    for (var i = 0; i < SELECTED_LUMINAIRES.length; i++) {
	var device_id = SELECTED_LUMINAIRES[i];
    if(gesture == 117){ //on
    var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'toggleLights', 
      argument: 'u', 
      auth: token
    });
    numOn = numOn + 1;
    databasePost();
  }
  else if(gesture == 100){ // off
    var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'toggleLights', 
      argument: 'd', 
      auth: token
    });
    numOn = numOn - 1;
    databasePost();
  } 
  else if(gesture == 98){ // blue
    var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'toggleLights', 
      argument: 'b', 
      auth: token
    });
  }
  else if(gesture == 114){ // red
    var fnPr = particle.callFunction({ 
      deviceId: device_id,
      name: 'toggleLights', 
      argument: 'r', 
      auth: token
    });
  }
  			
	else{
		var fnPR = null;
		} 		

	if (fnPr != null){
		fnPr.then(
			function(data) {
			//console.log('Function called succesfully:', data);
			console.log('Function called succesfully');
				}, function(err) {
				console.log('An error occurred:', err);
					}
			);
		}
    }
    active_imu = 0;
}

// Check to see if it has been 24 hours since the last update
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

// Parse values from time database, upload into dailystats database
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

// Socket stuff-- used later 
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
