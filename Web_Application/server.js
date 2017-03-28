import express from 'express';
import bodyParser from 'body-parser';
var express = require('express');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.json());


app.get('/', function(req, res) {
        res.render('gestures');
    });

app.get('/gestures.html', function(req, res){
        res.render('gestures');
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

