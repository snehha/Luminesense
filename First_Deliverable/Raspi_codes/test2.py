import serial

btSerial = serial.Serial("/dev/rfcomm0", baudrate=9600, timeout=0.5)

while True:
    btSerial.write("r>a Send from RaspberryPi to Arduino\n")  ## kindly check this 4th line of code for proper sending to Arduino
    print("r>a Send from RaspberryPi to Arduino\n")

    rcv = btSerial.readline()
    if rcv:  
        print("A>R!!!" + rcv)
