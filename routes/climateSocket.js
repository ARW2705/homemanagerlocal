'use strict';

const TSTAT_KEY = process.env.TSTAT_KEY;
let tstatId;
let tstatAuthed = false;

const socketProxy = (io, client) => {

  io.on('connection', socket => {
    console.log('Thermostat connected to local server');
    client.emit('thermostat-connection', {connectedAt: new Date()});

    socket.on('heartbeat', data => {
      console.log('Thermostat heartbeat');
      client.emit('thermostat-connection', {connectedAt: new Date()});
    });

    socket.on('ping-initial-data', data => {
      console.log('Pinging server for initial climate and program data');
      client.emit('ping-initial-data', data);
    });

    // confirm thermostat connection with key
    socket.on('verify-thermostat-client', data => {
      if (data && data.token === TSTAT_KEY) {
        tstatId = socket.id;
        tstatAuthed = true;
        socket.emit('verified', {});
        client.emit('thermostat-verified', {verifiedAt: new Date()});
      }
    });

    // complete climate data posted from thermostat
    socket.on('new-climate-data', data => {
      console.log('new climate data from thermostat', data);
      if (socket.id === tstatId && !tstatAuthed) {
        const err = "Error: Not Authenticated";
        socket.emit('error', {error: err});
      } else {
        // pass data to wss client
        client.emit('response-post-current-climate-data', data);
        socket.emit('post-current-climate-data', {});
      }
    });

    // updated climate data posted from thermostat
    socket.on('patch-current-climate-data', data => {
      console.log('updated climate data from thermostat', data);
      if (socket.id === tstatId && !tstatAuthed) {
        const err = "Error: Not Authenticated";
        socket.emit('error', {error: err});
      } else {
        // pass data to wss client
        client.emit('response-patch-current-climate-data', data);
        socket.emit('patch-current-climate-data', {});
      }
    });

    // TODO separate select program response
    socket.on('response-selected-program', data => {
      console.log('thermostat select program response', data);
      client.emit('response-select-program', data);
    });

    // thermostat disconnected from websocket
    socket.on('disconnect', () => {
      console.log('Thermostat disconnected');
      // pass notification to wss client that thermostat disconnected
      client.emit('thermostat-disconnection', {lastConnectedAt: new Date()});
    });
  });

  /* Pass message from wss client to local ws socket */
  client.emit('local-node-connection', {nodeConnectedAt: new Date()});

  client.on('ping-thermostat', () => {
    console.log('pinging thermostat for client app');
    io.emit('ping-thermostat', {});
  });

  client.on('ping-local-node', _ => {
    client.emit('local-node-connection', {nodeConnectedAt: new Date()});
  });

  client.on('initial-climate-data', climate => {
    console.log('initial climate values received', climate);
    io.emit('initial-climate-data', climate[0]);
  });

  client.on('initial-program-data', program => {
    console.log('initial program values received');
    if (program.none) io.emit('initial-program-data', {none: true});
    else io.emit('initial-program-data', program[0]);
  });

  client.on('local-request-patch-current-climate-data', update => {
    console.log('update received', update);
    io.emit('echo-request-patch-current-climate-data', update);
  });

  client.on('local-select-program', program => {
    console.log('program selected', program);
    io.emit('selected-program', program);
  });

  client.on('echo-delete-climate-program', _ => {
    console.log('program was deleted');
    io.emit('selected-program', {data: null});
  });

};

module.exports = socketProxy;
