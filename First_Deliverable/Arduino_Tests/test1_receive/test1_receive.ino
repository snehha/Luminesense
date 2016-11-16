#include <CurieIMU.h>
#include <CurieBLE.h>

#define IMU_SERVICE_UUID "0bdb190a-abad-11e6-80f5-76304dec7eb7"
#define LIGHT_ID_UUID "0bdb1c0c-abad-11e6-80f5-76304dec7eb7"
#define IMU_READINGS_UUID "0bdb1d92-abad-11e6-80f5-76304dec7eb7"

BLEPeripheral blePeripheral;  
BLEService imuService(IMU_SERVICE_UUID); 

// IMU output and light id acts as a characteristic
BLEUnsignedCharCharacteristic dataChar(IMU_READINGS_UUID, BLERead | BLENotify);
BLEIntCharacteristic idNum(LIGHT_ID_UUID, BLERead | BLENotify);
const int ledPin = 13;  //pin use for LED -- used to test if the bluetooth connection is successful
int lastOrientation = - 1; // previous orientation (for comparison)
int orientation = -1;
char orientationString = '\0';
int intNumVal = 0;
int dataVal = '\0';


void setup() {
  Serial.begin(9600); // initialize Serial communication
  pinMode(ledPin, OUTPUT);
  Serial.println("Initializing IMU device...");
  CurieIMU.begin();
  CurieIMU.autoCalibrateGyroOffset();
  CurieIMU.autoCalibrateAccelerometerOffset(X_AXIS, 0);
  CurieIMU.autoCalibrateAccelerometerOffset(Y_AXIS, 0);
  CurieIMU.autoCalibrateAccelerometerOffset(Z_AXIS, 1);
  
  //Bluetooth
  blePeripheral.setLocalName("TeamUno");
  blePeripheral.setAdvertisedServiceUuid(imuService.uuid());
  blePeripheral.addAttribute(imuService);
  blePeripheral.addAttribute(dataChar);
  blePeripheral.addAttribute(idNum);
  
  // set the initial value for the characeristic:
  dataChar.setValue(dataVal);
  idNum.setValue(intNumVal);
  
  // begin advertising BLE service:
  blePeripheral.begin();
  Serial.println("Bluetooth device active, waiting for connections...");
}

void updateReadings(){
  int orientation = -1; //  the board's orientation
  char orientationString; // string for printing description of orientation
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
      orientationString = 'u';
      orientation = 0;
    } else {
      orientationString = 'd';
      orientation = 1;
    }
  } else if ( (absY > absX) && (absY > absZ)) {
    // base orientation on Y
    if (y > 0) {
      orientationString = 'u';
      orientation = 2;
    } else {
      orientationString = 'd';
      orientation = 3;
    }
  } else {
    // base orientation on X
    if (x < 0) {
      //orientationString = "connector up";
      orientationString = 'u';
      orientation = 4;
    } else {
      orientationString = 'd';
      orientation = 5;
    }
  }
  if (orientation != lastOrientation) {
    Serial.println(orientationString);
    dataChar.setValue(orientationString);
    lastOrientation = orientation;
  }
  // if the orientation has changed, print out a description:
 
}

void send_data(){
  int photoDiode = analogRead(A0);
  //const unsigned char dataCharArray[2] = {char(id)}
  int photoReading = map(photoDiode, 0, 1023, 0, 100);
  Serial.print("PhotoDiode Reading: "); // print it
  Serial.println(photoReading);
  const unsigned char dataCharArray[2] = { 0, (char)photoReading};
  idNum.setValue(photoReading);
  delay(1000);
}
void loop() {
  
  
  Serial.println("Inside loop: ");
  BLECentral central = blePeripheral.central();
  updateReadings();
  /*if (central) {
    Serial.print("Connected to central: ");
    // print the central's MAC address:
    Serial.println(central.address());
    digitalWrite(ledPin, HIGH);
    // while the central is still connected to peripheral:
    while (central.connected()) {
      // if the remote device wrote to the characteristic,
      // use the value to control the LED:
      Serial.println("Central is connected");
      updateReadings();
      //send_data(); 
    }
    // when the central disconnects, print it out:
    digitalWrite(ledPin, LOW);
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
  */
  delay(1000);
}

