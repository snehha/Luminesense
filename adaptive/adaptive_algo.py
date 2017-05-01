import sys
import math
import threading
from multiprocessing import Pool
from multiprocessing import Process
from multiprocessing import Pipe 

#GRANULARITY = 10
ID = 10

def myFunc(id_num, conn):

        i=0
        j=0
        state = 0

        count = 0

        accum = 0
        recentAccum = 0
        secondRecent = 0
       
        f = open('MH_data.txt','r') #data stream file

        for counter in range(0,int(sys.argv[1])-50):
        
	
                line = []
                line = f.readline()
                s = str(line)
                r = s.split(',')

                if r[4] == str(id_num):
		
                        j = j+1

                        if i%10 == 0 and j>1:

                                if accum < recentAccum:
					
                                        if recentAccum/accum > 1.039 or secondRecent/accum > 1.039: #Change 1.039 to adjust sensitivity
                                                state = state + 1 #multiple consecutive increases == new entrant

                                        if state > 1:
                                            
                                                conn.send(1) 
                                                conn.close() 
                                                
                                                return 1
                                                state = 0
                        
                                secondRecent = recentAccum
                                recentAccum = accum
                                accum=0
                                j=0


                        else:

                                accum+= int(r[3][3:8])
                                i = i + 1
        conn.send(0)
        conn.close()
        return 0


if __name__ == '__main__':
    

        parent_conn, child1 = Pipe()
        parent_conn3, child3 = Pipe()
        parent_conn5, child5 = Pipe()
        parent_conn6, child6 = Pipe()
        parent_conn7, child7 = Pipe()
        parent_conn8, child8 = Pipe()
        parent_conn9, child9 = Pipe()
        parent_conn10, child10 = Pipe()

        #args  correspond to sensor indices

        p = Process(target=myFunc, args=[1, child1])
        p3 = Process(target = myFunc, args=[3, child3])
        p5 = Process(target = myFunc, args=[5, child5])
        p6 = Process(target = myFunc, args=[6, child6])
        p7 = Process(target = myFunc, args=[7, child7])
        p8 = Process(target = myFunc, args=[8, child8])

        p9 = Process(target = myFunc, args=[9, child9])

        p10 = Process(target = myFunc, args=[10, child10])


        p.start()
        p3.start()
        p5.start()
        p6.start()
        p7.start()
        p8.start()
        p9.start()
        p10.start()


        detections = parent_conn.recv() + parent_conn3.recv() + parent_conn5.recv() + parent_conn6.recv() +parent_conn7.recv() + parent_conn8.recv() +  parent_conn9.recv() + parent_conn10.recv()                                

        
        p.join()
        p3.join()
        p5.join()
        p6.join()      
        p7.join()      
        p8.join()
        p9.join() 
        p10.join()

        print(str(detections))

        exit(0)







 
