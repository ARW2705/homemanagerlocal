'use strict';

const http = require('http');
const https = require('https');
const rp = require('request-promise');
const socketClient = require('socket.io-client');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./local-storage');


exports.getClientToken = () => {
  const postData = {
    "username": `${process.env.SERVER_USERNAME}`,
    "password": `${process.env.SERVER_PASSWORD}`
  };

  const postOptions = {
    uri: `${process.env.HOSTNAME}/${process.env.API_VERSION}/users/login`,
    method: 'POST',
    json: true,
    body: postData,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return rp(postOptions);
};

exports.getSocket = token => {
  return new Promise((resolve, reject) => {
    let socket = socketClient(`${process.env.HOSTNAME}`, {query: {token: token}});
    if (socket) resolve(socket);
    else reject(new Error('Could not connect websocket', socket));
  });
};
