'use strict';

const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./local-storage');
const request = require('request');
const fs = require('fs');
const path = require('path');

let newFile = 1;

const socketProxy = (io, cloudClientSocket) => {

  io.on('connection', messageSocket => {
    console.log('Seccam messaging socket connected');

    messageSocket.on('test-stream', data => {
      io.emit('echo-proxy-request-stream', data);
    });

    messageSocket.on('shutdown', data => {
      io.emit('echo-proxy-request-shutdown', data);
    });

    messageSocket.on('response-new-video-available', data => {
      console.log('there is a new video ready for upload');
      newFile = data.filename;
      cloudClientSocket.emit('proxy-response-new-video-available', data);
    });

    messageSocket.on('disconnect', () => {
      console.log('Seccam messaging socket disconnected');
    });
  });

  cloudClientSocket.on('proxy-request-set-camera', data => {
    io.emit('echo-proxy-request-set-camera', data);
  });

  cloudClientSocket.on('proxy-request-stream', data => {
    io.emit('echo-proxy-request-stream', data);
  });

  cloudClientSocket.on('proxy-request-set-motion-detection', data => {
    io.emit('echo-proxy-request-set-motion-detection', data);
  });

  cloudClientSocket.on('proxy-request-shutdown', data => {
    io.emit('echo-proxy-request-shutdown', data);
  });

  cloudClientSocket.on('response-set-video-name', data => {
    console.log('video name is ready, post video to cloud');
    const requestedFile = path.join(__dirname, `../storage/media/seccam/front-door/${data.filename}.h264`);
    fs.createReadStream(requestedFile)
      .pipe(request({
        uri: `${process.env.HOSTNAME}/${process.env.API_VERSION}/security/seccam`,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Transfer-Encoding': 'chunked',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        method: 'POST'
      }, (err, res, body) => {
        if (res.statusCode == 200) {
          cloudClientSocket.emit('request-update-video-list', {});
        }
      }));
  });

};

module.exports = socketProxy;
