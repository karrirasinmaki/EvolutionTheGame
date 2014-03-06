var app = require("express") ()
	, server = require("http").createServer(app)
	, io = require("socket.io").listen(server)
	, express = require("express");

io.configure(function () {
//	io.set('transports', ['xhr-polling', 'jsonp-polling']);
});

server.listen(80);

//Load files
app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});
app.use("/", express.static(__dirname + "/public"));

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
