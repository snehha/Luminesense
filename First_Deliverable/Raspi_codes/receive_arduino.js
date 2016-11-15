var noble = require('noble');


var IMU_SERVICE_UUID = '19B10000-E8F2-537E-4F6C-D104768A1214';

noble.on('stateChange', function(state) {
   if(state === 'poweredOn') {
     console.log('Start BLE scan...')
     noble.startScanning([IMU_SERVICE_UUID], false);
   }
   else {
     console.log('Cannot scan... state is not poweredOn')
     noble.stopScanning();
   }
});

// Discover the peripheral's IMU service and corresponding characteristics
// Then, emit each data point on the socket stream
noble.on('discover', function(peripheral) {
   console.log('peripheral discovered (' + peripheral.id +
              ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
              ' connectable ' + peripheral.connectable + ',' +
              ' RSSI ' + peripheral.rssi + ':');
    console.log('\thello my local name is:');
   peripheral.connect(function(error) {
     console.log('Connected to peripheral: ' + peripheral.uuid);
     peripheral.discoverServices([IMU_SERVICE_UUID], function(error, services) {
       var imuService = services[0];
       console.log('Discovered IMU service');

       imuService.discoverCharacteristics([], function(error, characteristics) {
         characteristics.forEach(function(characteristic) {
           emitSensorData(characteristic);
         });
       });
     });
   });
});


