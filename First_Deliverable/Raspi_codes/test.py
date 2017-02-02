from bluetooth import *

bd_addr = "98:4F:EE:0F:7E:58" #the address from the Arduino sensor
port = 1
sock = BluetoothSocket (L2CAP)
#sock.connect((bd_addr,port))
sock.bind(("",0x1001))
sock.listen(1)

while True:
	print("Waiting for connection")
	client_sock,address = sock.accept()
	print("Accepted connection from %s" % str(address))

	print("Waiting for data")
	total = 0
	while True:
		try:
			data = client_sock.recv(1024)
		except bluetooth.BluetoothError as e:
			break
		if len(data) == 0: break
		total += len(data)
		print("total byte read: %d" % total)

	client_sock.close() 

	print("closed")

sock.close()
