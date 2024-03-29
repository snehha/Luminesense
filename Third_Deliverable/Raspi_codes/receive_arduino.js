var noble = require('noble');
var Particle = require('particle-api-js');
var pg = require('pg');
var WATTAGE = 12;
var particle = new Particle();  //Particle part 
var on_off;
var numOn = 0;
// MODIFY THIS WITH THE APPROPRIATE URL
var socket = require('socket.io-client')('WEB-SERVER-DOMAIN-HERE:8080');
var peripheralIdOrAddress = process.argv[2].toLowerCase();
// These should correspond to the peripheral's service and characteristic UUIDs
var IMU_SERVICE_UUID = "0bdb190aabad11e680f576304dec7eb7";

var LIGHT_ID_UUID = "0bdb1c0cabad11e680f576304dec7eb7";
var IMU_READINGS_UUID = "0bdb1d92abad11e680f576304dec7eb7"
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
    //console.log('peripheral with ID ' + peripheral.id + ' found');

    peripheral.once('disconnect', function() {
      //console.log('disconnected');
      process.exit(0);
    });

    peripheral.connect(function(error) {
      //console.log('connected');
      peripheral.discoverServices([], onServicesDiscovered);
    });
  }
});

function onServicesDiscovered(error, services) {
  //console.log('services discovered');

  services.forEach(function(service) {
    console.log(service.uuid);
    if (service.uuid == IMU_SERVICE_UUID) {
      console.log('going to on characteristic discovered');
      console.log(service.uuid);
      service.discoverCharacteristics([], onCharacteristicDiscovered);
    }
  });
}


function onCharacteristicDiscovered(error, characteristics) {
  console.log('characteristics discovered');

  characteristics.forEach(function(characteristic) {
    if (characteristic.uuid == IMU_READINGS_UUID) {
      characteristic.on('read', onIMUCharacteristicsRead);
      characteristic.notify(true, function(error) {
        console.log('imuCharacteristic notification on');
      });
    } else if (characteristic.uuid == LIGHT_ID_UUID) {
      characteristic.on('read', onLightCharacteristicRead);

      characteristic.notify(true, function(error) {
        console.log('idCharacteristic notification on');
      });
    }
  });
}

function onIMUCharacteristicsRead(data, isNotification) {
  console.log('imuCharacteristic read response value: ', data.readInt8(0));
  console.log('IMU data received');
  on_off = data.readInt8(0);
  functionPost();
}



function onLightCharacteristicRead(data, isNotification) {
  if (isNotification) {
    console.log('idCharacteristic notification value: ', data.readInt8(0));
    var light_id = data.readInt8(0);
    functionPost();
  } else {
    console.log('idCharacteristic read response value: ', data.readInt8(0));
    var light_id = data.readInt8(0);
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
    console.log("on");
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
    console.log("off");
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
    console.log("red");
  }
  else if(on_off == 114){ //'b'
    var fnPr = particle.callFunction({ 
      deviceId: '21002b001247353236343033',
      name: 'toggleLights', 
      argument: '1,r', 
      auth: token
    });
    console.log("blue");
  }
  fnPr.then(
  function(data) {
    console.log('Function called succesfully:', data);
  }, function(err) {
    console.log('An error occurred:', err);
  });
}

function databasePost(){
  pg.defaults.ssl = true;
    var connection = "postgres://jryhvlrzsvchoc:0fece6e968bfa67a69e4ed643f60fb9aeb8d7d29d1eada2a493ce5faeef8787b@ec2-23-21-111-81.compute-1.amazonaws.com:5432:/d9obmj9ncrr8al"
    pg.connect(process.env.DATABASE_URL, function(err, client){
      if (err) throw err;
      console.log('Connected to postgres! Getting schemas...');
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
