var noble = require('noble');

// MODIFY THIS WITH THE APPROPRIATE URL
var socket = require('socket.io-client')('WEB-SERVER-DOMAIN-HERE:8080');
var peripheralIdOrAddress = process.argv[2].toLowerCase();
// These should correspond to the peripheral's service and characteristic UUIDs
var IMU_SERVICE_UUID = "0bdb190a-abad-11e6-80f5-76304dec7eb7";
var LIGHT_ID_UUID = "0bdb1c0c-abad-11e6-80f5-76304dec7eb7";
var IMU_READINGS_UUID = "0bdb1d92-abad-11e6-80f5-76304dec7eb7"
socket.on('connect', function() {
  console.log('Connected to server');
  socket.emit('hello');
});

noble.on('stateChange', function(state) {
  if(state === 'poweredOn') {
    console.log('Start BLE scan...')
    noble.startScanning();
    console.log('Help');  
}
  else {
    console.log('Cannot scan... state is not poweredOn')
    noble.stopScanning();
  }
});

// Discover the peripheral's IMU service and corresponding characteristics
// Then, emit each data point on the socket stream
// noble.on('discover', function(peripheral) {
// 	console.log('Inside here in line 34.');
//   peripheral.connect(function(error) {
//     console.log('Connected to peripheral: ' + peripheral.uuid);
//     peripheral.discoverServices([IMU_SERVICE_UUID], function(error, services) {
//       var imuService = services[0];
//       console.log('Discovered IMU service');
//       imuService.discoverCharacteristics([], function(error, characteristics) {
//         characteristics.forEach(function(characteristic) {
//         	console.log(characteristic.uuid);
//           //emitSensorData(characteristic);
//         });
//       });
//     });
//   });
// });

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
    } else if (characteristic.uuid == LIGHT_ID_UUID) {
      characteristic.on('read', onLightCharacteristicRead);

      characteristic.notify(true, function(error) {
        console.log('idCharacteristic notification on');
      });
    }
  });
}

function onIMUCharacteristicsRead(data, isNotification) {
  console.log('imuCharacteristic read response value: ', data.readChar8(0));
}



function onLightCharacteristicRead(data, isNotification) {
  if (isNotification) {
    
    console.log('idCharacteristic notification value: ', data.readInt8(0));
  } else {
    
    console.log('idCharacteristic read response value: ', data.readInt8(0));
  }
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