#include <CurieIMU.h>
#include <CurieBLE.h>

BLEPeripheral blePeripheral;  // BLE Peripheral Device (the board you're programming)
BLEService imuService("19B10000-E8F2-537E-4F6C-D104768A1214"); // BLE IMU Service

// BLE IMU Characteristic - custom 128-bit UUID, read and writable by central
BLEUnsignedCharCharacteristic dataChar("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite);

const int ledPin = 13;  //pin use for LED -- used to test if the bluetooth connection is successful
int lastOrientation = - 1; // previous orientation (for comparison)

void setup() {
  Serial.begin(9600); // initialize Serial communication
  pinMode(ledPin, OUTPUT);

  //Bluetooth
  blePeripheral.setLocalName("TeamUno");
  blePeripheral.setAdvertisedServiceUuid(imuService.uuid());
  //blePeripheral.addAttribute(heartRateChar); // add the Heart Rate Measurement characteristic
  // add service and characteristic:
  blePeripheral.addAttribute(imuService);
  blePeripheral.addAttribute(dataChar);
  
  // set the initial value for the characeristic:
  dataChar.setValue(0);
  
  // begin advertising BLE service:
  blePeripheral.begin();
  Serial.println("Bluetooth device active, waiting for connections...");
  
  //IMU Setup
  while (!Serial);    // wait for the serial port to open
  // initialize device
  Serial.println("Initializing IMU device...");
  CurieIMU.begin();
  // Set the accelerometer range to 2G
  CurieIMU.setAccelerometerRange(2);
  
}

void getIMUReadings(){
  int orientation = -1; //  the board's orientation
   String orientationString; // string for printing description of orientation
  // read accelerometer:
  int x = CurieIMU.readAccelerometer(X_AXIS);
  int y = CurieIMU.readAccelerometer(Y_AXIS);
  int z = CurieIMU.readAccelerometer(Z_AXIS);

  // calculate the absolute values, to determine the largest
  int absX = abs(x);
  int absY = abs(y);
  int absZ = abs(z);

  if ( (absZ > absX) && (absZ > absY)) {
    // base orientation on Z
    if (z > 0) {
      orientationString = "up";
      orientation = 0;
    } else {
      orientationString = "down";
      orientation = 1;
    }
  } else if ( (absY > absX) && (absY > absZ)) {
    // base orientation on Y
    if (y > 0) {
      orientationString = "digital pins up";
      orientation = 2;
    } else {
      orientationString = "analog pins up";
      orientation = 3;
    }
  } else {
    // base orientation on X
    if (x < 0) {
      orientationString = "connector up";
      orientation = 4;
    } else {
      orientationString = "connector down";
      orientation = 5;
    }
  }

  // if the orientation has changed, print out a description:
  if (orientation != lastOrientation) {
    Serial.println(orientationString);
    lastOrientation = orientation;
  }
}

void send_data(){
  int photoDiode = analogRead(A0);
  //const unsigned char dataCharArray[2] = {char(id)}
  int photoReading = map(photoDiode, 0, 1023, 0, 100);
  Serial.print("PhotoDiode Reading: "); // print it
  Serial.println(photoReading);
  const unsigned char dataCharArray[2] = { 0, (char)photoReading};
  dataChar.setValue(photoReading);
  delay(1000);
}
void loop() {
  //int orientation = - 1;   // the board's orientation
  //getIMUReadings();
  Serial.println("Inside loop: ");
  BLECentral central = blePeripheral.central();
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's MAC address:
    Serial.println(central.address());
    digitalWrite(ledPin, HIGH);
    // while the central is still connected to peripheral:
    while (central.connected()) {
      // if the remote device wrote to the characteristic,
      // use the value to control the LED:
      Serial.println("Central is connected");
      send_data(); 
    }
    // when the central disconnects, print it out:
    digitalWrite(ledPin, LOW);
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
  delay(1000);
}

