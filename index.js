
var express = require("express");
var app = express();
var server = require("http").createServer(app)
var io = require("socket.io").listen(server)

io.configure(function () {
//	io.set('transports', ['xhr-polling', 'jsonp-polling']);
});

server.listen(80);

app.use(express.static(__dirname + "/public"));

var id = 0;

io.sockets.on("connection", function(socket) {
    socket.emit("connect", {
        id: id
    });
    id++;

	socket.on("c", function(data) {
		socket.broadcast.emit("c", data);
	});

	socket.on("msg", function(data) {
		socket.emit("msg", data);
		socket.broadcast.emit("msg", data);
	});

});
