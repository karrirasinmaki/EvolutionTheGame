(function(window, document) {
    
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
    };
    Entity.prototype.super = function(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x || 0;
        this.y = y || 0;
        return this;
    };
    Entity.prototype.onUpdate = undefined;
    Entity.prototype.super.onUpdate = Entity.prototype.onUpdate || function() {};
    Entity.prototype.update = function(context) {
        this.onUpdate && this.onUpdate( context );
    };
    Entity.prototype.super.update = Entity.prototype.update;
    
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
        document.body.appendChild( canvas );
        this.canvas = canvas;
        this.context = canvas.getContext( "2d" );
        this.entities = [];
        
        return this;
    };
    View.prototype.add = function(entity) {
        entity.parentView = this;
        this.entities.push( entity );
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
    Map.prototype.build = function(grid) {
        var gridBlockH = this.height / grid.length;
        var gridBlockW = this.width / grid[0].length;
        for(var j=0, jl=grid.length; j<jl; ++j) {
            var igrid = grid[j];
            for(var i=0, l=igrid.length; i<l; ++i) {
                var ijgrid = igrid[i];
                if(ijgrid == 1) {
                    this.add( new g.Wall("black").const(gridBlockW, gridBlockH, gridBlockW*i, gridBlockH*j) );
                }
                else if(ijgrid == 8) {
                    this.startPoint = { x: gridBlockW*i, y: gridBlockH*j };
                }
                else if(ijgrid == 9) {
                    this.endPoint = { x: gridBlockW*i, y: gridBlockH*j };
                }
            }
        }
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

var map = new g.Map().const( 600, 400 );
var grid = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,8,0,0,1,9,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    
];
map.build(grid);
map.update();


var mouse = {
    x: 0,
    y: 0
};
addEventListener("mousemove", function(e) {
    mouse.x = e.pageX,
    mouse.y = e.pageY
}, false);
addEventListener("click", function(e) {
    var deltaX = mouse.y - activePlayer.y;
    var deltaY = mouse.x - activePlayer.x;
    var rad = Math.atan2( deltaX, deltaY );
    var force = Math.min( (Math.sqrt(deltaX*deltaX + deltaY*deltaY)/(map.width/2)) * 50, 30 );
    activePlayer.vx =  Math.cos( rad ) * force;
    activePlayer.vy = Math.sin( rad ) * force;
    nextPlayer();
    
    console.log("force: " + force);
}, false);

var nextPlayer = function() {
    activePlayerNum++;
    if(activePlayerNum >= players.length) activePlayerNum = 0;
    activePlayer = players[activePlayerNum];
}

var view = new g.View().const( 600, 400 );
view.mapLayer = map;
var players = [];
var activePlayerNum = -1;
var activePlayer = undefined;

var stick = new g.Stick().const( 100, 10 );
stick.onUpdate = function(c) {
    this.x = activePlayer.x;
    this.y = activePlayer.y;
    
    c.strokeStyle = "black";
    c.beginPath();
    c.moveTo( this.x, this.y );
    c.lineTo( mouse.x, mouse.y );
    c.stroke();
    c.closePath();
};
    
var ball = new g.Ball("red").const( 16, 16 );
ball.x = map.startPoint.x;
ball.y = map.startPoint.y;

var ball2 = new g.Ball("green").const( 16, 16 );
ball2.x = map.startPoint.x;
ball2.y = map.startPoint.y;
    
players.push( ball );
players.push( ball2 );

view.add( ball );
view.add( ball2 );
view.add( stick );

nextPlayer();

var thread = new g.Thread().const(30);
thread.run(function() {
    view.update();
});
