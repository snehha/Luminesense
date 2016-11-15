var noble = require('noble');
noble.startScanning();

noble.startScanning([], true); // any service UUID, allow duplicates

var serviceUUIDs = ["<service UUID 1>", ...]; // default: [] => all
var allowDuplicates = <false|true>; // default: false

noble.startScanning(serviceUUIDs, allowDuplicates[, callback(error)]); // particular UUID's

noble.on(‘discover’, function(peripheral) { 

  var macAddress = peripheral.uuid;
  var rss = peripheral.rssi;
  var localName = advertisement.localName; 
  console.log('found device: ', macAdress, ' ', localName, ' ', rss);   
}