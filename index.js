
var express = require("express");
var app = express();
var server = require("http").createServer(app)
var io = require("socket.io").listen(server)

io.configure(function () {
//	io.set('transports', ['xhr-polling', 'jsonp-polling']);
});

server.listen(80);

app.use(express.static(__dirname + "/public"));

var rooms = {
    LOBBY: "lobby"
};

io.sockets.on("connection", function(socket) {
    
    var notifyRoomChange = function() {
        var clients = io.sockets.clients(socket.room);
        var users = (function() {
            var obj = {};
            for(var i=0, l=clients.length; i<l; ++i) {
                obj[i] = {id: clients[i].id};
            }
            return obj;
        })();
        var data = {
            room: socket.room,
            userCount: clients.length,
            users: users
        };
        socket.emit("room-change", data);
    };
    var switchRoom = function(room) {
        if(socket.room) socket.leave( socket.room );
        socket.room = room;
        socket.join( socket.room );
        notifyRoomChange();
    };
    
    /* init user */
    socket.emit("login", {
        id: socket.id,
        rooms: rooms
    });
    switchRoom(rooms.LOBBY);
    
	socket.on("msg", function(message) {
        var data = {
            id: socket.id,
            message: message
        };
        io.sockets.in(socket.room).emit("msg", data);
        socket.broadcast.to('room').emit("msg", data);
	});
    
    socket.on("room-change", function(room) {
        switchRoom(room);
        io.sockets.in(socket.room).emit("new-player", {id: socket.id});
    });
    
    socket.on("new-player", function(data) {
        io.sockets.in(socket.room).emit("new-player", data);
    });
    
    socket.on("disconnect", function() {
        io.sockets.in(socket.room).emit("leave-player", {id: socket.id});
    });
    
    socket.on("update-player", function(user) {
        io.sockets.in(socket.room).emit("update-player", user);
    });

});
