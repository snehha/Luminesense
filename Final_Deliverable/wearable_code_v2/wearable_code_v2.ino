//#include "fft_2.h"
#include <CurieIMU.h>
#include <CurieBLE.h>

//Set up all the UUIDs
#define IMU_SERVICE_UUID "0bdb190a-abad-11e6-80f5-76304dec7eb7"
#define LIGHT_ID_UUID "0bdb1c0c-abad-11e6-80f5-76304dec7eb7"
#define IMU_READINGS_UUID "0bdb1d92-abad-11e6-80f5-76304dec7eb7"
#define SESSION_ID_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"
#define SELECTION_UUID "89afbbdc-e26a-4880-b1ea-055cf7aa644d"
#define N 256

BLEPeripheral blePeripheral;
BLEService imuService(IMU_SERVICE_UUID);

// IMU output and light id acts as a characteristic
BLEUnsignedCharCharacteristic dataChar(IMU_READINGS_UUID, BLERead | BLENotify);
BLEIntCharacteristic idNum(LIGHT_ID_UUID, BLERead | BLENotify);
BLEUnsignedCharCharacteristic buttonStatus(SESSION_ID_UUID, BLERead | BLENotify);
BLEUnsignedCharCharacteristic selectStatus(SELECTION_UUID, BLERead | BLENotify);

const int ledPin = 13;  //pin use for LED -- used to test if the bluetooth connection is successful
int lastOrientation = - 1; // previous orientation (for comparison)
int lastbuttonState = -1;

char orientationString = '\0';
int intNumVal = 0;
int dataVal = '\0';
int buttonS = '\0';
int selectS = '\0';

int inPin = 2;         // the number of the input pin
int select_button_pin = 4;         // the number of the input pin
int outPin = 13;       // the number of the output pin
int state = HIGH;      // the current state of the output pin
int reading;           // the current reading from the input pin
int previous = LOW;    // the previous reading from the input pin
int select_button_state = 0;  //initialize state to 0
int frequency_samples[100];
int sample_counter = 0;
int final_frequency = 0;

// the follow variables are long's because the time, measured in miliseconds,
// will quickly become a bigger number than can be stored in an int.
uint32_t time = 0;         // the last time the output pin was toggled
uint32_t debounce = 200;   // the debounce time, increase if the output flickers

// Namespace definitions for mem. allocation
namespace std {
  void __throw_bad_alloc()
  {
    Serial.println("Unable to allocate memory");
  }

  void __throw_length_error( char const*e )
  {
    Serial.print("Length Error :");
    Serial.println(e);
  }
}

int GetMedian(int daArray[], int iSize) {
    // Allocate an array of the same size and sort it.
    int* dpSorted = new int[iSize];
    for (int i = 0; i < iSize; ++i) {
        dpSorted[i] = daArray[i];
    }
    for (int i = iSize - 1; i > 0; --i) {
        for (int j = 0; j < i; ++j) {
            if (dpSorted[j] > dpSorted[j+1]) {
                int dTemp = dpSorted[j];
                dpSorted[j] = dpSorted[j+1];
                dpSorted[j+1] = dTemp;
            }
        }
    }
    // Middle or average of middle values in the sorted array.
    int dMedian = 0;
    if ((iSize % 2) == 0) {
        dMedian = (dpSorted[iSize/2] + dpSorted[(iSize/2) - 1])/2.0;
    } else {
        dMedian = dpSorted[iSize/2];
    }
    delete [] dpSorted;
    return dMedian;
}

void setup() {
  Serial.begin(115200); // initialize Serial communication
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
  blePeripheral.addAttribute(buttonStatus);
  blePeripheral.addAttribute(selectStatus);

  // set the initial value for the characeristic:
  dataChar.setValue(dataVal);
  idNum.setValue(intNumVal);
  buttonStatus.setValue(buttonS);
  selectStatus.setValue(selectS);

  // begin advertising BLE service:
  blePeripheral.begin();
  Serial.println("Bluetooth device active, waiting for connections...");

  // input and output pins
  pinMode(select_button_pin, INPUT);
  pinMode(inPin, INPUT);
  pinMode(outPin, OUTPUT);
}

void updateReadings() {
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

  if ((absZ > absX) && (absZ > absY)) {
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
  lastOrientation = orientation;
  }
}

void light_id_reading() {
    idNum.setValue(1);
  /*
  Serial.println("Getting light frequency.");
  // Initialize and call FFT methods
  bool result;
  double *inputreal = (double*) malloc(N * sizeof(double));
  double *inputimag = (double*) malloc(N * sizeof(double));
  while(sample_counter < 100)
  {
    // Gather the analog samples
    int i = 0;
    for(i = 0; i < N; i++)
    {
      inputreal[i] = analogRead(A0);
      inputimag[i] = 0;
    }
    result = transform_radix2(inputreal,inputimag, 256);
    int max_val = 0;
    int max_bin = 0;
    int j = 0;
    for(j = 0; j < N/2; j++)
    {
      if(inputreal[j] > max_val && j != 0)
      {
        max_val = inputreal[j];
        max_bin = j;
      }
    }
    // Calculate frequency
    int freq = (32000000/(27.343*256*32))*max_bin;
    int rounded = 0;
    if(freq < 9999)
    {
      int len = log10(freq);
      float div = pow(10, len);
      rounded = floor(freq / div) * div;
    }
    else if(freq > 9999)
    {
      int len = log10(1000);
      float div = pow(10, len);
      rounded = floor(freq / div) * div;
    }
    int k = 0;
    for(k = 0; k < N; k++)
    {
      inputreal[k] = 0;
      inputimag[k] = 0;
    }
    // Collect large 100 results of FFT
    frequency_samples[sample_counter] = (int)rounded;
    sample_counter++;
  }
  // Find median of samples and send via BLE
  final_frequency = GetMedian(frequency_samples, 100);
  idNum.setValue(final_frequency);
  // Reset variables
  int l;
  for (l = 0; l < 100; l++)
  {
    frequency_samples[l] = 0;
  }
  sample_counter = 0;
  free(inputreal);
  free(inputimag);
  Serial.print(final_frequency);
  Serial.println("  Hz");
  */
}

void select_light_reading() // Selects the desired luminaire
{
  select_button_state = digitalRead(select_button_pin);
  // check if the pushbutton is pressed.
  // if it is, the buttonState is HIGH:
  if (select_button_state == HIGH) {
    // turn LED on:
    // select the luminaire i.e. add it to luminaire array on Ras Pi
    Serial.println("Selecting light");
    selectStatus.setValue('S');
    digitalWrite(outPin, HIGH);
  } else {
    // turn LED off:
    digitalWrite(outPin, LOW);
  }
}

void loop() {
  reading = digitalRead(inPin);
  if (reading == HIGH && previous == LOW && millis() - time > debounce) {
    if (state == HIGH) {
      state = LOW;
      buttonS = 'I';
      Serial.println("Session begin");
    }
    else {
      state = HIGH;
      buttonS = 'O';
      Serial.println("Session end");
    }
    time = millis();
   }
   ble_send_data(state);
   digitalWrite(outPin, state);
   previous = reading;
}

// Controls which data gets sent over BLE i.e controls the session
void ble_send_data(int status)
{
  Serial.println("BLE handler started.");
  if(status == LOW)  // 1st button push ~-> change state: Send Session data & Send the IMU, FFT data
  {
    BLECentral central = blePeripheral.central();
    if (central) {
      if(lastbuttonState != buttonS)
      {
        buttonStatus.setValue(buttonS);
      }
      lastbuttonState = buttonS;
      light_id_reading();         // Get the desired lights 
      //select_light_reading();                                // Select the desired lights  
      updateReadings();                                      // Gesture to the lights
    }
   }
   else                // 2nd button push ~-> default state: Send Session data & Don't send the IMU, FFT data
   {
    if(lastbuttonState != buttonS)
    {
      BLECentral central = blePeripheral.central();
      if (central) {
        buttonStatus.setValue(buttonS);
        lastbuttonState = buttonS;
      }
    }
   }
}
