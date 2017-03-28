import express from 'express';
import bodyParser from 'body-parser';
var express = require('express');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080 || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.json());


app.get('/', function(req, res) {
        res.render('gestures');
    });

app.get('/gestures.html', function(req, res){
        res.render('gestures');
});



io.sockets.on('connection', (socket) => {
  socket.on('sendchat', (data) => {
    io.sockets.emit('updatechat', socket.username, data);
  });

  socket.on('adduser', (username) => {
    socket.username = username;

    usernames[username] = username;

    socket.emit(
      'servernotification', {
        connected: true,
        toSelf: true,
        username: username
      });

    socket.broadcast.emit('servernotification', { connected: true, username: username });

    io.sockets.emit('updateusers', usernames);
  });

  socket.on('disconnect', () => {
    delete usernames[socket.username];

    io.sockets.emit('updateusers', usernames);

    socket.broadcast.emit('servernotification', { username: socket.username });
  });
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

server.listen(port);
