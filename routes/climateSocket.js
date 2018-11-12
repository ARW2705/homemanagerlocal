'use strict';

const TSTAT_KEY = process.env.TSTAT_KEY;
let tstatId;
let tstatAuthed = false;

/**
 * Websocket proxy between secure/external websocket and unsecure/internal websocket
 *
 * params: object, object
 * io - unsecured websocket for use with thermostat/iot
 * cloudClientSocket - secure websocket for use with communication to cloud server
 *
 * return: none
**/
const socketProxy = (io, cloudClientSocket) => {

  io.on('connection', socket => {
    console.log('Thermostat connected to local server');
    // cloudClientSocket.emit('thermostat-connection', {connectedAt: new Date()});
    cloudClientSocket.emit('response-update-thermostat-connection', {connectedAt: new Date()});

    // keep alive message, emit with timestamp for cloud records
    socket.on('heartbeat', data => {
      console.log('Thermostat heartbeat');
      // cloudClientSocket.emit('thermostat-connection', {connectedAt: new Date()});
      cloudClientSocket.emit('response-update-thermostat-connection', {connectedAt: new Date()});
    });

    // thermostat requests initial stored data on cloud
    // socket.on('ping-initial-data', data => {
    socket.on('request-select-initial-climate-data', data => {
      console.log('Pinging server for initial climate and program data');
      // cloudClientSocket.emit('ping-initial-data', data);
      cloudClientSocket.emit('proxy-request-select-initial-climate-data-and-program', data);
    });

    // confirm thermostat connection with key
    // socket.on('verify-thermostat-client', data => {
    socket.on('response-update-thermostat-verified', data => {
      if (data && data.token === TSTAT_KEY) {
        console.log('thermostat verified');
        tstatId = socket.id;
        tstatAuthed = true;
        socket.emit('confirm-reponse-update-thermostat-verified', {});
        // cloudClientSocket.emit('thermostat-verified', {verifiedAt: new Date()});
        cloudClientSocket.emit('proxy-response-update-thermostat-verified', {verifiedAt: new Date()});
      }
    });

    // complete climate data posted from thermostat
    // socket.on('new-climate-data', data => {
    socket.on('response-create-current-climate-data', data => {
      console.log('new climate data from thermostat', data);
      if (socket.id === tstatId && !tstatAuthed) {
        const err = "Error: Not Authenticated";
        socket.emit('error', {error: err});
      } else {
        // pass data to wss client
        // cloudClientSocket.emit('response-post-current-climate-data', data);
        // socket.emit('post-current-climate-data', {});
        cloudClientSocket.emit('proxy-response-create-current-climate-data', data);
        socket.emit('confirm-response-create-current-climate-data', {});
      }
    });

    // updated climate data posted from thermostat
    // socket.on('patch-current-climate-data', data => {
    socket.on('response-update-current-climate-data', data => {
      console.log('updated climate data from thermostat', data);
      if (socket.id === tstatId && !tstatAuthed) {
        const err = "Error: Not Authenticated";
        socket.emit('error', {error: err});
      } else {
        // pass data to wss client
        // cloudClientSocket.emit('response-patch-current-climate-data', data);
        // socket.emit('patch-current-climate-data', {});
        cloudClientSocket.emit('proxy-response-update-current-climate-data', data);
        socket.emit('confirm-response-update-current-climate-data', {});
      }
    });

    // user has requested a change in selected program
    // socket.on('response-selected-program', data => {
    socket.on('response-select-climate-program', data => {
      console.log('thermostat select program response', data);
      // cloudClientSocket.emit('response-select-program', data);
      cloudClientSocket.emit('proxy-response-select-climate-program', data);
    });

    // thermostat disconnected from websocket
    socket.on('disconnect', () => {
      console.log('Thermostat disconnected');
      // pass notification to wss client that thermostat disconnected
      // cloudClientSocket.emit('thermostat-disconnection', {lastConnectedAt: new Date()});
      cloudClientSocket.emit('response-update-thermostat-disconnection', {lastConnectedAt: new Date()});
    });
  });

  // TODO move local node connection message to cloud server
  /* Pass message from wss client to local ws socket */
  cloudClientSocket.emit('local-node-connection', {nodeConnectedAt: new Date()});

  // a client has requested verification that the thermostat is connected
  // cloudClientSocket.on('echo-ping-thermostat', () => {
  cloudClientSocket.on('proxy-request-ping-thermostat', () => {
    console.log('pinging thermostat for client app');
    // io.emit('ping-thermostat', {});
    io.emit('proxy-request-ping-thermostat', {});
  });

  // a client has requested verification that the local server is connected
  cloudClientSocket.on('ping-local-node', _ => {
    cloudClientSocket.emit('local-node-connection', {nodeConnectedAt: new Date()});
  });

  // echo the initial climate data message to the thermostat
  // cloudClientSocket.on('initial-climate-data', climate => {
  cloudClientSocket.on('response-select-initial-climate-data', climate => {
    console.log('initial climate values received', climate);
    // io.emit('initial-climate-data', climate[0]);
    io.emit('proxy-response-select-initial-climate-data', climate[0]);
  });

  // echo the initial program data message to the thermostat
  // cloudClientSocket.on('initial-program-data', program => {
  cloudClientSocket.on('response-select-initial-climate-program-data', program => {
    console.log('initial program values received');
    // if (program.none) io.emit('initial-program-data', {none: true});
    // else io.emit('initial-program-data', program[0]);
    if (program.none) io.emit('proxy-response-select-initial-program-data', {none: true});
    else io.emit('proxy-response-select-initial-program-data', program[0]);
  });

  // pass update request message from cloud to thermostat
  // cloudClientSocket.on('local-request-patch-current-climate-data', update => {
  cloudClientSocket.on('proxy-request-update-current-climate-data', update => {
    console.log('update received', update);
    // io.emit('echo-request-patch-current-climate-data', update);
    io.emit('proxy-request-update-current-climate-data', update);
  });

  // pass select program request from cloud to thermostat
  // cloudClientSocket.on('request-select-program', program => {
  cloudClientSocket.on('proxy-request-select-climate-program', program => {
    console.log('program selected', program);
    // io.emit('selected-program', program);
    io.emit('proxy-request-select-climate-program', program);
  });

  // an active program was deleted, deactivate thermostat pre-program
  // cloudClientSocket.on('echo-delete-climate-program', _ => {
  // cloudClientSocket.on('broadcast-response-delete-climate-program', _ => {
  //   console.log('program was deleted');
  //   io.emit('selected-program', {data: null});
  // });

};

module.exports = socketProxy;
