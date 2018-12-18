#!/usr/bin/env python3

from socket import socket
import subprocess
import time
import datetime

from socketIO_client_nexus import SocketIO, LoggingNamespace

from UnknownUserException import UnknownUserException

BUFSIZE = 4096

server = socket()
server.bind(('0.0.0.0', 3030))
server.listen(0)

print('\nListening for video stream on port 3030\n')

client = SocketIO('192.168.0.110', 3575, LoggingNamespace)

print('Message socket connected on port 3575\n')

try:
    while True:
        conn, addr = server.accept()
        if addr[0] != '192.168.0.201':
            conn.close()
            raise UnknownUserException({'message': 'Unknown user connected', 'errors': addr[0]})
        print('client connected... ', addr)
        dt = datetime.datetime.now()
        unix = str(int(time.mktime(dt.timetuple())))
        filepath = '../storage/media/seccam/front-door/' + unix + '.h264'
        myfile = open(filepath, 'wb')

        while True:
            data = conn.recv(BUFSIZE)
            if not data:
                break
            myfile.write(data)

        myfile.close()
        print('finished writing to file')
        conn.close()
        print('client disconnected')
        client.emit('response-new-video-available', {'filename': unix})
        print('notifying server')

except (OSError, subprocess.CalledProcessError, IOError, KeyBoardInterrupt) as error:
    print('An error occured: {}'.format(error.message))
    print(error.args)

finally:
    server.close()
