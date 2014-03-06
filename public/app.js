(function(window, document) {
    
    var gameWrapper = document.createElement("div");
    gameWrapper.id = "game";
    gameWrapper.style.position = "relative";
    document.body.appendChild( gameWrapper );
    
    var Thread = function() {
        
    };
    Thread.prototype.const = function(updateInterval) {
        this.updateInterval = updateInterval;
        return this;
    };
    Thread.prototype.run = function(onTick) {
        setInterval( onTick, this.updateInterval );
    };
    
    var Entity = function() {
        this.id = new Date().getTime();
    };
    Entity.prototype.super = function(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x || 0;
        this.y = y || 0;
        return this;
    };
    Entity.prototype.preventUpdate = false;
    Entity.prototype.onUpdate = undefined;
    Entity.prototype.super.onUpdate = Entity.prototype.onUpdate || function() {};
    Entity.prototype.update = function(context) {
        if( this.preventUpdate ) return;
        this.onUpdate && this.onUpdate( context );
    };
    Entity.prototype.super.update = Entity.prototype.update;
    Entity.prototype.remove = function() {
        this.parentView.remove( this );
        delete this;
    };
    
    
    var View = function() {
    };
    View.prototype = new Entity;
    View.prototype.const = function(width, height) {
        this.super(width, height);
        
        var canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = height;
        canvas.style.position = "absolute";
        canvas.style.x = 0;
        canvas.style.y = 0;
        gameWrapper.appendChild( canvas );
        this.canvas = canvas;
        this.context = canvas.getContext( "2d" );
        this.entities = [];
        
        return this;
    };
    View.prototype.add = function(entity) {
        entity.parentView = this;
        this.entities.push( entity );
    };
    View.prototype.remove = function(entity) {
        for(var i=0, l=this.entities.length; i<l; ++i) {
            if( this.entities[i].id == entity.id ) this.entities.pop(i);
        }
    };
    View.prototype.removeAll = function() {
        for(var i=0, l=this.entities.length; i<l; ++i) {
            this.entities.pop(i);
        }
    };
    View.prototype.update = function() {
        this.super.update( this.context );
        this.context.clearRect( 0, 0, this.width, this.height );
        for(var i=0, l=this.entities.length; i<l; ++i) {
            this.entities[i].update( this.context );
        }
    };
    
    var Map = function() {
        
    };
    Map.prototype = new View;
    Map.prototype.build = function(grid, mappings, shadows) {
        mappings = mappings || {};
        shadows = shadows || {};
        
        this.shadowLayer = new View().const( this.width, this.height );
        this.gridH = Math.ceil( this.height / grid.length );
        this.gridW = Math.ceil( this.width / grid[0].length );
        
        for(var j=0, jl=grid.length; j<jl; ++j) {
            var igrid = grid[j];
            for(var i=0, l=igrid.length; i<l; ++i) {
                var ijgrid = igrid[i];
                
                var field = mappings[ijgrid];
                if( field != undefined ) {
                    var blockX = this.gridW*i;
                    var blockY = this.gridH*j;
                    var element = field( this, blockX, blockY );
                    if( element != undefined ) this.add( element.const(this.gridW, this.gridH, blockX, blockY) );
                }
                var shadow = shadows[ijgrid];
                if( shadow != undefined ) {
                    var blockX = this.gridW*i;
                    var blockY = this.gridH*j;
                    var element = shadow( this, blockX, blockY );
                    if( element != undefined ) this.shadowLayer.add( element.const(this.gridW, this.gridH, blockX, blockY) );
                }
            }
        }
        
        this.shadowLayer.update();
        this.update();
    };
    
    var Colladable = function() {
    };
    Colladable.prototype = new Entity;
    Colladable.prototype.const = function(width, height, x, y) {
        this.super(width, height, x, y);
        this.halfW = width / 2;
        this.halfH = height / 2;
        this.vx = 0;
        this.vy = 0;
        return this;
    };
    Colladable.prototype.checkPixelCollision = function() {
        var futureX = this.x + this.vx;
        var futureY = this.y + this.vy;
        function collides(pixelData) {
            var data = pixelData.data;
            for(var i=3, l=data.length; i<l; i+=4) {
                if(data[i] != 0) return true;
            }
            return false;
        }
        if(this.parentView) {
            var collisionLayer = this.parentView.mapLayer;
            if(collisionLayer) {
                var paddingX = this.halfW * (this.vx > 0 ? 1 : -1);
                var paddingY = this.halfH * (this.vy > 0 ? 1 : -1);
                if(collides(collisionLayer.context.getImageData(this.x, this.y, this.vx + paddingX, 1))) this.vx *= -1;
                else if(collides(collisionLayer.context.getImageData(this.x, this.y, 1, this.vy + paddingY))) this.vy *= -1;
            }
        }
    };
    Colladable.prototype.ColladableSuperOnUpdate = function(c) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy *= 0.95;
        this.vx *= 0.95;
        
        var futureX = this.x + this.vx;
        var futureY = this.y + this.vy;
        
        if(futureX + this.halfW > c.canvas.width || futureX - this.halfW < 0) this.vx *= -1;             
        if(futureY + this.halfH > c.canvas.height || futureY - this.halfH < 0) this.vy *= -1;
        this.checkPixelCollision();
        
        if( Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5 ) {
            this.vx = 0;
            this.vy = 0;
        }
    };
    
    var Ball = function(color) {
        this.color = color || "black";
    };
    Ball.prototype = new Colladable;
    Ball.prototype.onUpdate = function(c) {
        this.super.onUpdate(c);
        this.ColladableSuperOnUpdate(c);
        
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.halfH, 0, 360);
        c.fill();
        c.closePath();
    };
    
    var Stick = function() {
        
    };
    Stick.prototype = new Entity;
    Stick.prototype.const = function(width, height) {
        this.super( width, height );
        return this;
    };
    
    var Wall = function(color) {
        this.color = color;
    };
    Wall.prototype = new Colladable;
    Wall.prototype.update = function(c) {
        c.fillStyle = this.color;
        c.fillRect( this.x, this.y, this.width, this.height );
    };
    
    window["g"] = {
        Thread: Thread,
        View: View,
        Map: Map,
        Colladable: Colladable,
        Ball: Ball,
        Stick: Stick,
        Wall: Wall
    };
    
})(window, document);

var view;
var players = [];
var activePlayerNum = -1;
var activePlayer = undefined;
var activePlayerDone = false;

/**
 * Distance between two objects, having fields x and y
 * @param obj1
 * @param obj2
 * @return distance between these two objects
 */
var distance = function(obj1, obj2) {
    if( !(obj1.x && obj1.y && obj2.x && obj2.y) ) return 0;
    return Math.sqrt( Math.pow(obj2.x - obj1.x, 2) + Math.pow(obj2.y - obj1.y, 2) );
};

var bgView = new g.View().const( 600, 400 );
bgView.fill = function(c) {
    c.fillStyle = "#01A611";
    c.fillRect( 0, 0, this.width, this.height );
}
bgView.fill( bgView.context );

var map = new g.Map().const( 600, 400 );
var grid = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , ,1,1,1,1,1,1, , , , , , ,1],
    [1, , , , ,1, , , , , , , , , , , ,1],
    [1, , , , ,1, ,9, , , , , ,8, , , ,1],
    [1, , , , ,1, , , , , , , , , , , ,1],
    [1, , , , ,1,1,1,1,1,1, , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1, , , , , , , , , , , , , , , , ,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    
];

map.build(
    grid, 
    {
        0: null,
        1: function() {
            return new g.Wall("#c7a474");
        },
        8: function(context, x, y) {
            context.startPoint = { x: x, y: y };
        }
    },
    {
        9: function(context, x, y) {
            context.endPoint = { x: x, y: y };
        }
    }
);

var hole = new g.Ball("black").const( 16, 16, map.endPoint.x + 8, map.endPoint.y + 8 );
map.shadowLayer.add( hole );
map.shadowLayer.update();


var mouse = {
    x: 0,
    y: 0
};
addEventListener("mousemove", function(e) {
    mouse.x = e.layerX,
    mouse.y = e.layerY
}, false);
addEventListener("click", function(e) {
    var deltaX = mouse.y - activePlayer.y;
    var deltaY = mouse.x - activePlayer.x;
    var rad = Math.atan2( deltaX, deltaY );
    var force = Math.min( (Math.sqrt(deltaX*deltaX + deltaY*deltaY)/(map.width/2)) * 50, 30 );
    activePlayer.vx =  Math.cos( rad ) * force;
    activePlayer.vy = Math.sin( rad ) * force;
    
    activePlayer.hits++;
    activePlayerDone = true;
    
    console.log("force: " + force);
    for(var i=0, l=players.length; i<l; ++i) {
        console.log("player "+i+": " + players[i].hits);
    }
}, false);

var nextPlayer = function() {
    activePlayerNum++;
    if(activePlayerNum >= players.length) activePlayerNum = 0;
    activePlayer = players[activePlayerNum];
    activePlayerDone = false;
}

var stick = new g.Stick().const( 100, 10 );
stick.onUpdate = function(c) {
    if( this.preventUpdate ) return;
    this.x = activePlayer.x;
    this.y = activePlayer.y;
    
    c.strokeStyle = "black";
    c.beginPath();
    c.moveTo( this.x, this.y );
    c.lineTo( mouse.x, mouse.y );
    c.stroke();
    c.closePath();
};

g.Ball.prototype.hits = 0;

var thread = new g.Thread().const(30);
var onStep = function() {
    view.update();
    var bound = Math.max( Math.abs(activePlayer.vx), Math.abs(activePlayer.vy) );
    if(
        (
         Math.abs(distance( activePlayer, hole )) < hole.halfW - bound ||
         Math.abs(distance( activePlayer, {x: hole.x+hole.halfW, y: hole.y+hole.halfH} )) < hole.halfW - bound
        )
    ) {
        activePlayer.preventUpdate = true;
        nextPlayer();
    }
    
    if( activePlayerDone ) {
        stick.preventUpdate = true;
        if( activePlayer.vx + activePlayer.vy == 0 ) nextPlayer();
    }
    else {
        stick.preventUpdate = false;
    }
};
    
var startGame = function() {
    var ball = new g.Ball("white").const( 16, 16 );
    ball.x = map.startPoint.x;
    ball.y = map.startPoint.y;
    
    var ball2 = new g.Ball("black").const( 16, 16 );
    ball2.x = map.startPoint.x;
    ball2.y = map.startPoint.y;
    
    if(view == undefined) {
        view = new g.View().const( 600, 400 );
    }
    view.removeAll();
    view.mapLayer = map;
    
    players = [];
    activePlayerNum = -1;
    activePlayer = undefined;
    activePlayerDone = false;
        
    players.push( ball );
    players.push( ball2 );
    
    view.add( ball );
    view.add( ball2 );
    view.add( stick );
    
    nextPlayer();
    
    thread.run(function() {
        onStep();
    });
};

var user = {};

var socket = io.connect('http://localhost/');
socket.on('connect', function (userData) {
    user = userData;
                                      
    socket.on('msg', function (data) {console.log(data);
        MessageBoard.addMessage( data );
    });
});

var MessageBoard = new (function() {
    
    var wrapper = document.createElement("div");
    wrapper.id = "message-board";
    document.body.appendChild( wrapper );
    
    var messages = document.createElement("div");
    messages.id = "messages";
    wrapper.appendChild( messages );
    
    var form = document.createElement("form");
    var input = document.createElement("input");
    form.onsubmit = function(e) {
        e.preventDefault();
        socket.emit("msg", {
            id: user.id,
            message: input.value
        });
        input.value = "";
    };
    form.appendChild( input );
    wrapper.appendChild( form );
    
    this.wrapper = wrapper;
    this.messages = messages;
    this.input = input;
    
    this.addMessage = function(data) {
        var el = document.createElement("div");
        el.innerHTML = '<b>'+data.id+': </b>' + data.message;
        this.messages.appendChild( el );
    };
    
})();
