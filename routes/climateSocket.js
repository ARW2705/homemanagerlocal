'use strict';

const socketProxy = (io, client) => {

  io.on('connection', socket => {
    console.log('Thermostat connected to local server');
    // pass notification to wss client that thermostat connected
    client.emit('thermostat-connected', {connectedAt: new Date()});

    // climate data posted from thermostat
    socket.on('post-current-climate-data', data => {
      // pass data to wss client
      client.emit('post-current-climate-data', data);
    });

    // thermostat disconnected from websocket
    socket.on('disconnect', () => {
      console.log('Thermostat disconnected');
      // pass notification to wss client that thermostat disconnected
      client.emit('thermostat-disconnected', {lastConnectedAt: new Date()});
    });

    /* Pass message from wss client to local ws socket */

    client.on('ping-thermostat', () => {
      socket.emit('ping-thermostat', {});
    });

    client.on('patch-current-climate-data', update => {
      socket.emit('updated-climate-data', {data: updated});
    });

    client.on('post-new-program', program => {
      if (program.isActive) socket.emit('selected-program', {data: newProgram});
    });

    client.on('select-program', program => {
      socket.emit('selected-program', {data: program});
    });

    client.on('update-selected-program', program => {
      socket.emit('selected-program', {data: program});
    });

    client.on('delete-specified-program', _ => {
      socket.emit('selected-program', {data: null});
    });
  })
};

module.exports = socketProxy;
