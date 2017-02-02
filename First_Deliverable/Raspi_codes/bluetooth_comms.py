from bluetooth import *
import serial 
from time import sleep 

bts = serial.Serial("/dev/rfcomm1", baudrate = 9600)
print("raspb")
last = 1
while last == 0:
    #print bts.read(int(last))
    print ("button pressed")

print bts.read(int(last))
#print bts.readline()

#bd_addr = "98:4F:EE:0F:7E:58" #the address from the Arduino sensor
#port = 1
#sock = BluetoothSocket (L2CAP)
#sock.connect(("bd_addr",port))

#while 1:
#       tosend = raw_input()
#      if tosend != 'q':
#             sock.send(tosend)
#    else:
#           break
