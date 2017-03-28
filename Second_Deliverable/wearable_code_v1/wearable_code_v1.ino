#include <CurieIMU.h>
#include <CurieBLE.h>
//Set up all the UUIDs
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

char orientationString = '\0';
int intNumVal = 0;
int dataVal = '\0';

int photoDiodeReading = A0;
const int buttonPin = 2;
int buttonState = 0;
int lastButtonState = 0;
int buttonPushCounter = 0;


void setup() {
  Serial.begin(9600); // initialize Serial communication
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT);
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
      orientationString = "board up";
      orientation = 0;
    } else {
      orientationString = "board down";
      orientation = 1;
    }
  } else if ( (absY > absX) && (absY > absZ)) {
    // base orientation on Y
    if (y > 0) {
      orientationString = "analog pins up";
      orientation = 2;
    } else {
      orientationString = "digital pins up";
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

/*  created char variable to denote board positions:
    'u' for connector up
    'd' for connector down
    'g' for digital pin up
    'a' for analog pin up
    'b' for board up
    'w' for board down
*/
    if(orientationString == "connector up"){
      dataVal = 'u';
    }
    else if(orientationString == "connector down"){
      dataVal = 'd';
    }
    else if(orientationString == "digital pins up"){
      dataVal = 'r';    // Change color to red, therefore 'r'
    }
    else if(orientationString == "analog pins up"){
      dataVal = 'b';    // Change color to blue, therefore 'b' 
    }
    
    dataChar.setValue(dataVal);
    send_data();
    lastOrientation = orientation;
  }
 
}

void send_data(){
  // Read in analog light values (0-1023)
  int val = analogRead(photoDiodeReading);
  // Convert to PWM (0-255)
  int light_id = val / 4;
  light_id = 1;
  idNum.setValue(light_id);
  delay(1000);
}
void loop() {
//  buttonState = digitalRead(buttonPin);
//  if (buttonState != lastButtonState) {
//    if (buttonState == HIGH) {
//      buttonPushCounter++;
//    } else {
//    }
//    // Delay a little bit to avoid bouncing
//    delay(50);
//  }
  // save the current state as the last state,
  //for next time through the loop
  //lastButtonState = buttonState;
//  if (buttonPushCounter % 2 == 0) {
//    Serial.println("STOP");
//  } else {
//    Serial.println("START");
    BLECentral central = blePeripheral.central();
    if (central) {
      digitalWrite(ledPin, HIGH);
      updateReadings();
      //send_data(); 
      digitalWrite(ledPin, LOW);
    //}  
  }
}
