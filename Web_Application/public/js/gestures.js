var exppress = require('express')
var router = express.Router()
var socket = io.connect('http://192.168.1.117');

router.get('/', function (req, res)){
	res.send('gestures')
}
socket.on('pong', function (data) {
    console.log("pong");
});
$(document).ready(function() {
    $("# hello").click(function(){
        socket.emit('ping', { duration: 2 });
    }); 
});

module.exports = router
