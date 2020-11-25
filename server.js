//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// express routing
app.use(express.static('public'));

// signaling
io.on('connection', function(socket) { // Socket is on fire in server
  console.log('A user connected.');
  console.log('');
  console.log('----Existing rooms:-----');
  console.log(JSON.stringify(io.sockets.adapter.rooms));
  console.log('-----------------------');
  console.log('');

  socket.on('pingx', function(dt) {
    console.log("Request to ping broadcast.")
    socket.broadcast.emit('pingoutx', 'Test');
  });


  socket.on('create or join', function(room) {
    console.log('create or join to room ', room);

    var myRoom = io.sockets.adapter.rooms[room] || {
      length: 0
    };
    var numClients = myRoom.length;

    console.log(room, ' has ', numClients, ' clients');

    if (numClients == 0) {
      socket.join(room);
      socket.emit('created', room); //success
    } else if (numClients == 1) {
      socket.join(room);
      socket.emit('joined', room); //success
    } else {
      socket.emit('full', room);
    }
  }); //Now webSocket After take decision just informing user created or joined in a room

  socket.on('ready', function(room) {
    socket.broadcast.to(room).emit('ready');
  });

  socket.on('candidate', function(event) {
    socket.broadcast.to(event.room).emit('candidate', event);
  });

  socket.on('offer', function(event) {
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  });

  socket.on('answer', function(event) {
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  });
});

// listener
http.listen(3000, function() {
  console.log('listening on *:3000');
});