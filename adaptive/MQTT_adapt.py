#!/usr/bin/python

import paho.mqtt.client as mqtt
import argparse
import subprocess
import os
import sys
import psycopg2

from SensorReader import SensorReader

import time


SAMPLE_PERIOD = 600 #5 seconds

COUNTER = 0 #changes every sample period based on detection  
STATE = 0 #indicates lights ON/OFF, ON = 1 OFF = 0 

def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

def arg_sensor_gain(string):
    value = int(string)
    if value in [1, 4, 16, 60]:
        return value
    else:
        msg = "%r is not a value in range [1, 4]" % string
        raise argparse.ArgumentTypeError(msg)

def arg_sensor_time(string):
    value = float(string)
    if (value < 2.4 or value > 612):
        msg = "%r is not a value in range [2.4, 612] ms" % string
        raise argparse.ArgumentTypeError(msg)
    return value

#ESTABLISH DATABASE CONNECTION AND PROTOCOL


conn = psycopg2.connect(database='d9obmj9ncrr8al', user='jryhvlrzsvchoc', password='0fece6e968bfa67a69e4ed643f60fb9aeb8d7d29d1eada2a493ce5faeef8787b', host='ec2-23-21-111-81.compute-1.amazonaws.com', port='5432', sslmode='require')
cursor = conn.cursor()

def update_db(person):
    if person:
        cursor.execute('DELETE FROM adaptive')
        cursor.execute('INSERT INTO adaptive (detected) VALUES (true)')
        conn.commit()
    else:
        cursor.execute('DELETE FROM adaptive')
        cursor.execute('INSERT INTO adaptive (detected) VALUES (false)')
        conn.commit()


#cursor.execute('INSERT INTO adaptive (detected) VALUES (false)')

update_db(0)



def main():

    
    COUNTER = 0
    STATE = 0
    parser = argparse.ArgumentParser(description='Send senor data over MQTT.')
    parser.add_argument('--host', action="store", dest="mqtt_host", default="localhost", help='Location of the MQTT broker. Defaults to localhost.')
    parser.add_argument('--port', action="store", dest="mqtt_port", default=1883, type=int, help='MQTT port for the broker. Defaults to 1883.')
    #parser.add_argument('--user', action="store", dest="mqtt_user", help="Username used to login to the broker.")
    #parser.add_argument('--pass', action="store", dest="mqtt_pass", help="Password used to login to the broker.")
    parser.add_argument('--topic', action="store", dest="mqtt_prefix", default="", help="Base topic to broadcast on. Defaults to none.")
    parser.add_argument('--time', action="store", dest="sensor_time", default=0xD5, type=arg_sensor_time, help="Integration time for the sensors, in milliseconds. Must be in range: [2.4, 612]. Defaults to 100.8ms")
    parser.add_argument('--gain', action="store", dest="sensor_gain", default=1, type=arg_sensor_gain, help="Gain for sensors. Must be one of: [1, 4, 16, 60] Defaults to 1.")
    parser.add_argument('--group', action="store", dest="group_id", default="0", help='Group id on MQTT.')
    args = parser.parse_args()

    # create mqtt client
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(args.mqtt_host, args.mqtt_port, 60)


    MH_counter = 0
    myBool = 1
    # Start a background thread to handle the client
    client.loop_start()

    # process sensor data
    try:
        print ("Initializing sensors")
        # create and init sensor reader
        sensor_reader = SensorReader(args.sensor_time, args.sensor_gain)
        sensor_reader.initialize()
        print ("Initialization complete")

        print ("Streaming data")
        file = open("MH_data.txt","w")
        sensorIDs = [0,1,2,3,5,6,7]
        sensorIDs2 = [8,9,10] 

        while myBool>0:
            startTime = time.time()
            #read sensor data
            data = sensor_reader.ReadSensors();
            # publish
            
            for sensorIndex in sensorIDs:
            	file.write(str(data[0][sensorIndex][0])+","+str(data[0][sensorIndex][1])+","+str(data[0][sensorIndex][2])+ ","+ 
            	str(data[0][sensorIndex][3])+","+str(sensorIndex)+","+str(data[0][sensorIndex][4])+ ","+str(data[0][sensorIndex][5])+"\n")
 
            for sensIndex in sensorIDs2:
            	file.write(str(data[1][sensIndex-8][0])+","+str(data[1][sensIndex-8][1])+","+str(data[1][sensIndex-8][2])+ ","+ 
            	str(data[1][sensIndex-8][3])+","+str(sensIndex)+","+str(data[1][sensIndex-8][4])+ ","+str(data[1][sensIndex-8][5])+"\n")
            MH_counter = MH_counter + 11
            if MH_counter > SAMPLE_PERIOD:
                print("END OF SAMPLING INTERVAL!")
                file.close()
                #exec(open("MH_10_seconds.py").read())
                #x = os.system("python3 MH_10_seconds.py " + str(SAMPLE_PERIOD)) 
                #x = os.system("python3 MH_april24.py " + str(SAMPLE_PERIOD))
                
                resulter = subprocess.check_output(["python3","adaptive_algo.py",str(SAMPLE_PERIOD)])
                
                #resulter = subprocess.check_output(["python","MH_april24.py","200"])
                print("RESULT: " + str(resulter) + "\n")
                
                if int(resulter) == 0:
                    COUNTER = COUNTER + 1
                    if COUNTER > 1 and STATE == 1:
                        STATE = 0 
                        update_db(0)
                else:
                    COUNTER  = 0
                    if STATE == 0:
                        STATE = 1 
                        update_db(1) 
                
                print("STATE: " + str(STATE) + "\n")
                print("COUNTER: " + str(COUNTER) + "\n")
                
                try:
                    print(cursor.execute("SELECT detected FROM adaptive"))
                except psycopg2.Error, e:
                    pass                
                for record in cursor:
                    print(record) 
                
                file = open("MH_data.txt","w")
                MH_counter = 0 

		file.close()
                
                file = open("MH_data.txt","w")

            for muxId in range(0, len(data)): 
                muxData = data[muxId]
                # non existant muxes will produce an empty list
                for sensorId in range(0, len(muxData)):
                    sensorData = muxData[sensorId]
                    # check there is sensor data
                    # non existant sensors will produce an empty list
                    if len(sensorData) == 6:
                        # topic for data: <prefix>/group/<group-id>/sensor/<sensor-id>
                        topic = args.mqtt_prefix + "/group/" + str(args.group_id) + "/sensor/" + str(muxId * 8 + sensorId)
                        # payload is "R,G,B,W,t1,t2"
                        payload = str(sensorData[0]) + ", " + str(sensorData[1]) + ", " + str(sensorData[2])
                        payload += ", " + str(sensorData[3]) + ", " + str(sensorData[4]) + ", " + str(sensorData[5])
                        client.publish(topic, payload)
            # calculate the time we need to sleep to prevent over-polling the sensors
            endTime = time.time()
            duration = endTime - startTime
            timeLeft = (args.sensor_time / 1000.0) - duration
            if timeLeft > 0:
                time.sleep(timeLeft)
            else:
                # Stop if we can't poll fast enough, no point in continuing
                print("")               
                # break

    except KeyboardInterrupt:
        file.close() 
        print ('Stopping...')

    print ('Closing the MQTT client...')
    # Stop the client
    client.loop_stop()

    print ('Done')

if __name__=="__main__":
        main()

conn.close()



