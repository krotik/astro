/*
 Astro Engine

 by Matthias Ladkau (matthias@devt.de)

-------
The MIT License (MIT)

Copyright (c) 2013 Matthias Ladkau

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE
 -------
*/

if (ae === undefined) {
    var ae = {};
}

// Utility functions
// =================
ae.$ = function(id) { "use strict"; return document.getElementById(id); };
ae.create = function(tag) { "use strict"; return document.createElement(tag); };
ae.copyObject = function (o1, o2) { "use strict"; for (var attr in o1) { o2[attr] = o1[attr]; } };
ae.mergeObject = function (o1, o2) { "use strict"; for (var attr in o1) { if(o2[attr] === undefined) { o2[attr] = o1[attr]; } } };
ae.cloneObject = function (o) { "use strict"; var r = {}; ae.copyObject(o, r); return r; };
ae.bind = function () {
    "use strict";
    var f = arguments[0], t = Array.prototype.slice.call(arguments, 1);
    var a = t.splice(1);
    return function() {
        "use strict";
        return f.apply(t[0],
                       a.concat(Array.prototype.slice.call(arguments, 0)));
    }
};

// Class implementation
// ====================
// Class objects with constructor and multi-inheritance support
//
// Based on: Simple JavaScript Inheritance by John Resig
// http://ejohn.org/blog/simple-javascript-inheritance/
//
// Inspired by base2 and Prototype
//
ae.Class = function() {};
(function(){

    // Pattern which checks if a given function uses the function _super - this test
    // returns always true if toString on a function does not return the function code
    var functionUsesSuper = /abc/.test(function () { abc(); }) ? /\b_super\b/ : /.*/;

    // Flag which is used to detect if we are currently initialising
    var initializing = false;

    // Add create function to the new class object
    ae.Class.create = function() {

        // Get the current prototype as the super prototype of the new class
        var _super = this.prototype;

        // Clone the current class object (without running the init constructor function)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Go through all given mixin objects. Each object should be either
        // a normal properties object or a constructor function.
        for (var i = 0; i < arguments.length; i++) {
            var properties = arguments[i];

            // Check if the given mixin is a constructor funtion
            if (typeof properties === "function") {
                // Use the prototype as properties
                properties = properties.prototype;
            }

            // Copy the given properties to the cloned class object
            for (var name in properties) {

                // Check if we're overwriting an existing function and if the new function uses
                // it by calling _super
                if (typeof properties[name] == "function"
                    && typeof _super[name] == "function"
                    && functionUsesSuper.test(properties[name])) {

                // If _super is called we need to wrap the given function
                // in a closure and provide the right environment
                prototype[name] = (
                    function(name, func, _super) {
                        return function() {
                            var t, ret;
                            // Save the current value in _super
                            t = this._super;
                            // Add the function from the current class object as _super function
                            this._super = _super[name];
                            // Run the function which calls _super
                            ret = func.apply(this, arguments);
                            // Restore the old value in _super
                            this._super = t;
                            // Return the result
                            return ret;
                        };
                    }
                )(name, properties[name], _super);

                } else {

                    prototype[name] = properties[name];
                }
            }

            // Once the mixin is added it becomes the new super class
            // so we can have this._super call chains
            _super = properties;
        }

        // Defining a constructor function which is used to call the constructor function init on objects
        var Class = function () {
          if ( !initializing && this.init ) {
            this.init.apply(this, arguments);
          }
        }

        // Put our constructed prototype object in place
        Class.prototype = prototype;

        // Constructor of the new object should be Class
        // (this must be done AFTER the prototype was assigned)
        Class.prototype.constructor = Class;

        // The current function becomes the create function
        // on the new object
        Class.create = arguments.callee;

        return Class;
    };
})();


// Default Objects
// ===============

ae.default_eventHandler = {

    // Handle when the user presses a key
    //
    onkeydown : function(state, e) {
        "use strict";

        e = e || window.event;

        switch (e.keyCode) {

            case 38: state.player.speed +=  1; break; // Move forward
            case 40: state.player.speed += -1; break; // Move backward
            case 39:
                if (e.ctrlKey || e.shiftKey) {
                    state.player.strafe =  1; // Strafe right
                } else {
                    state.player.dir =  1;    // Rotate right
                    if (state.player.rotSpeed < state.player.maxRotSpeed) {
                        state.player.rotSpeed = state.player.deltaRotSpeed(
                                                    state.player.rotSpeed);
                    }
                }
                break;

            case 37:
                if (e.ctrlKey || e.shiftKey) {
                    state.player.strafe = -1; // Strafe left
                } else {
                    state.player.dir = -1;    // Rotate left
                    if (state.player.rotSpeed < state.player.maxRotSpeed) {
                        state.player.rotSpeed = state.player.deltaRotSpeed(
                                                    state.player.rotSpeed);
                    }
                }
                break;
        }

        ae.default_eventHandler.stopBubbleEvent(e);
    },

    // Handle when the user releases a key
    //
    onkeyup : function(state, e) {
        "use strict";

        e = e || window.event;

        switch (e.keyCode) {
            case 37: case 39:

                // Stop rotating and strafing

                state.player.dir = 0;
                state.player.strafe = 0;
                state.player.rotSpeed = state.player.minRotSpeed;
                break;
        }

        ae.default_eventHandler.stopBubbleEvent(e);
    },

    // Stop the bubbling of an event
    //
    stopBubbleEvent : function (e) {
        "use strict";
        e = e ? e:window.event;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.cancelBubble !== null) {
            e.cancelBubble = true;
        }
    }
};

ae.default_options = {

    // Handler functions (registered on MainController construction)
    // =============================================================

    eventHandler : ae.default_eventHandler, // Key event handler

    // The following handler functions get the current game state object and
    // a list of all sprites

    moveHandler  : function (state, sprites) {},      // Handler called after each move
    drawHandler  : function (ctx, state, sprites) {}, // Handler called after each draw
                                                      // (gets also the draw context)

    stopHandler : function () {}, // Handler called once the
                                  // simulation has stopped

    // Rendering options
    // =================

    // Constant rate for moving
    moveRate       : 30,

    // View screen (projection plane) width
    screenWidth   : 640,
    screenHeight  : 480,
};

ae.default_initial_player_state = {
    id : "player",

    x : 20,  // Player x position
    y : 20,  // Player y position

    dim : 20, // Dimensions of the sprite (box)

    displayLoop    : true,  // Player is never taken out of the display loop

    dir : 0,  // Turning direction (-1 for left, 1 for right, 0 no turning)
    rot : 0,  // Angle of rotation
    rotSpeed : Math.PI / 180,  // Current rotation speed for each
                               // step (in radians) - the rotation
                               // increases over time with default event handler
    maxRotSpeed   : 7 * Math.PI / 180,   // Max rotation speed
    minRotSpeed   : 2 * Math.PI / 180,   // Min rotation speed
    deltaRotSpeed : function(rotSpeed) { // Function to increase rotation speed
        return rotSpeed * 3;
    },

    speed     : 0,    // Moving direction (1 forward, -1 backwards, 0 no movement)
    strafe    : 0,    // Strafing direction of player (-1 left, 1 right, 0 no movement)
    moveSpeed : 0.21, // Move speed for each step

    collision : function (entity) { } // Collision handler
};

ae.default_initial_sprite_state = {
    id : "", // A unique ID

    x : 2,   // Sprite x position
    y : 2,   // Sprite y position

    dim : 10, // Dimensions of the sprite (box)

    isMoving       : true,   // Flag if the sprite is moving or static
    displayLoop    : true,   // Flag if the sprite is kept in the display or
                             // if it should be destroyed once it is outside
                             // of the visible area

    dir : 0,  // Turning direction (-1 for left, 1 for right, 0 no turning)
    rot : 0,  // Angle of rotation
    rotSpeed : 6 * Math.PI / 180,  // Rotation speed for each step (in radians)

    speed     : 0,    // Moving direction (1 forward, -1 backwards, 0 no movement)
    strafe    : 0,    // Strafing direction of sprite (-1 left, 1 right, 0 no movement)
    moveSpeed : 0.05, // Move speed for each step

    collision : function (entity) { } // Collision handler - return true if the sprite
                                      // should be removed afterwards
};

// Main Controller
// ===============

ae.MainController = ae.Class.create({

    // Cont. counter from 0 to 1000 which can be used for animations and other steped
    // algorithms

    frame : 0,

    // Object Attributes

    _screen  : undefined,
    _ctx     : undefined,
    _options : undefined,
    _debug   : undefined,

    // Runtime state

    _state   : undefined,
    _sprites : undefined,

    // Volatile state

    _lastMoveLoopTime : 0,

    // Initialise the engine.
    //
    init : function(screen_id, options, debug_output_element) {
        "use strict";

        this.running  = true;

        this._state   = {};
        this._options = {};
        this._sprites = [];

        this._screen = ae.$(screen_id);

        if (this._screen === null) {
            throw Error("No main screen found");
        }
        this._ctx = this._screen.getContext("2d");

        this._debug = ae.$(debug_output_element);

        // Set options

        ae.copyObject(ae.default_options, this._options);
        if (options !== undefined) {
            ae.copyObject(options, this._options);
        }

        // Set dimensions of main screen

        this._screen.width  = this._options.screenWidth;
        this._screen.height = this._options.screenHeight;
        this._screen.style.width  = this._options.screenElementWidth + "px";
        this._screen.style.height = this._options.screenElementHeight + "px";

        this.registerEventHandlers();
    },

    // Register event handlers for the engine.
    //
    registerEventHandlers : function (handlerObject) {
        "use strict";

        document.onkeydown = ae.bind(this._options.eventHandler.onkeydown, this, this._state);
        document.onkeyup = ae.bind(this._options.eventHandler.onkeyup, this, this._state);
    },

    // Deregister event handlers for the engine.
    //
    deRegisterEventHandlers : function (handlerObject) {
        "use strict";

        document.onkeydown = null;
        document.onkeyup = null;
    },

    // Start the engine.
    //
    start : function(initial_player_state) {
        "use strict";

        // Merge given player state with default player state

        this._state.player = {};
        ae.copyObject(ae.default_initial_player_state, this._state.player);
        if (initial_player_state !== undefined) {
            ae.copyObject(initial_player_state, this._state.player);
        }

        this.drawLoop();
        this.moveLoop();
    },

    // Stop the engine.
    //
    stop : function () {
        "use strict";

        this.running = false;
        this.deRegisterEventHandlers();

        if (this._options.stopHandler !== undefined) {
            this._options.stopHandler();
        }
    },

    // Add a sprite to the simulation.
    //
    addSprite : function(initial_sprite_state) {
        "use strict";

        // Merge given initial sprite state with default sprite state

        var sprite_state = {}
        ae.copyObject(ae.default_initial_sprite_state, sprite_state);
        if (initial_sprite_state !== undefined) {
            ae.copyObject(initial_sprite_state, sprite_state);
        }

        // Add sprite to internal sprite map

        this._sprites.push(sprite_state);
    },

    // Remove a sprite to the simulation.
    //
    removeSprite : function(sprite_state) {
        "use strict";

        // Remove sprite from internal sprite map

        this._sprites.splice(this._sprites.indexOf(sprite_state), 1);
    },

    // Print debug information.
    //
    printDebug : function (str) {
        "use strict";

        if (this._debug !== null) {
            this._debug.innerHTML += str+"<br>";
        }
    },

    // Move loop handles player and sprite movement
    //
    moveLoop : function () {
        "use strict";

        var moveLoopTime = new Date().getTime();
        var timeDelta = moveLoopTime - this._lastMoveCycleTime;

        // Do the move and compensation for the time delta

        this.move(timeDelta);

        // Calculate the next move time and adjust it according to the time lag

        var nextMoveLoopTime = 1000 / this._options.moveRate;
        if (timeDelta > nextMoveLoopTime) {
            nextMoveLoopTime = Math.max(1, nextMoveLoopTime
                                        - (timeDelta - nextMoveLoopTime));
        }

        // Call external handler

        this._options.moveHandler(this._state, this._sprites);

        this._lastMoveCycleTime = moveLoopTime;

        if (this.running) {
            setTimeout(ae.bind(this.moveLoop, this), nextMoveLoopTime);
        }
    },

    // Move does one move step
    //
    move : function (timeDelta) {
        "use strict";

        var player = this._state.player;

        // Calculate a correction multiplier for the time lag

        var timeCorrection = timeDelta / this._options.moveRate;
        if (isNaN(timeCorrection)) timeCorrection = 1;

        // Move the player first

        this.moveEntity(timeCorrection, player);

        // Move the sprites

        for(var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i];
            if (sprite.isMoving) {
                if (!this.moveEntity(timeCorrection, sprite)) {

                    // Remove the sprite if moveEntity says so

                    this._sprites.splice(i, 1);
                }
            }
        }

        // Detect collisions

        var playerCollision,
            collision     = [],
            colisionWith = [];

        for(var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i],
                others = this.isColliding(sprite);

            if (others.length > 0) {
                collision.push(sprite);
                colisionWith.push(others);

                for (var j=0; j<others.length; j++) {
                    var other = others[j];

                    if (playerCollision === undefined && other === player) {
                        playerCollision = other;
                    }
                }
            }
        }

        // Execute collisions
        //

        for (var i=0; i<collision.length;i++) {
            for (var j=0; j<colisionWith[i].length; j++) {
                collision[i].collision(collision[i], colisionWith[i][j]);
            }
        }

        if (playerCollision !== undefined) {
            player.collision(player, playerCollision);
        }
    },

    // Check if a given entity is colliding with anything
    //
    isColliding : function (entity) {
        "use strict";
        var player = this._state.player,
            collisions = [],
            checkCollision = function (e1, e2) {
                var e1dh = e1.dim / 2,
                    e2dh = e2.dim / 2;

                return e1.x + e1dh > e2.x - e2dh &&
                       e1.x - e1dh < e2.x + e2dh &&
                       e1.y + e1dh > e2.y - e2dh &&
                       e1.y - e1dh < e2.y + e2dh;
            };

        // Check if colliding with player

        if (entity.id !== player.id && checkCollision(entity, player)) {
                return [ player ];
        }

        // Check if colliding with other sprite

        for(var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i];

            if (entity.id !== sprite.id && checkCollision(entity, sprite)) {
                collisions.push(sprite);
            }
        }

        return collisions;
    },

    // Move an entity in the simulation.
    //
    moveEntity : function(timeCorrection, entity) {
        "use strict";

        var keepSprite = true;

        if (entity.move !== undefined) {

            // Move routine on the entity can overreide the calculations

            entity.move(timeCorrection, entity);

        } else {

            // Calculate new entity coordinates

            var moveStep = timeCorrection * entity.speed * entity.moveSpeed;
            var strafeStep = timeCorrection * entity.strafe * entity.moveSpeed * 20;

            // Forward / backward movement

            var newX = entity.x + Math.cos(entity.rot) * moveStep;
            var newY = entity.y + Math.sin(entity.rot) * moveStep;

            // Left / right strafe movement

            newX -= Math.sin(entity.rot) * strafeStep;
            newY += Math.cos(entity.rot) * strafeStep;

            // Rotate the entity

            entity.rot += timeCorrection * entity.dir * entity.rotSpeed;

            entity.x = newX;
            entity.y = newY;
        }

        // Ensure the entity does not move outside the boundaries

        if (entity.displayLoop) {

            if (entity.x > this._screen.width) {
                entity.x -= this._screen.width;
            } else if (entity.x < 0) {
                entity.x += this._screen.width;
            }

            if (entity.y > this._screen.height) {
                entity.y -= this._screen.height;
            } else if (entity.y < 0) {
                entity.y += this._screen.height;
            }

        } else {

            if (entity.x > this._screen.width ||
                entity.x < 0 ||
                entity.y > this._screen.heigh ||
                entity.y < 0) {

                keepSprite = false;
            }
        }

        return keepSprite;
    },

    drawLoop : function () {
        "use strict";

        // Calculate animation frame

        if (this.frame === undefined) {
            this.frame = 0;
        } else {
            this.frame++;
            this.frame = this.frame % 1000;
        }


        var start = 0,
            ctx = this._ctx;

        // Clear screen canvas

        if (this._options.backdrop === undefined) {
            ctx.clearRect(0,0,this._screen.width,this._screen.height);
        } else {
            ctx.drawImage(this._options.backdrop,
                0, 0, this._screen.width, this._screen.height);
        }

        if (this._debug !== null) {
            this._debug.innerHTML = "";
            start = new Date().getTime();
        }

        this.drawSprites();
        this.drawPlayer();

        // Call external handler

        this._options.drawHandler(ctx, this._state, this._sprites);

        if (start !== 0) {

            // Calculate Runtime

            var runtime = new Date().getTime() - start;
            this.printDebug("Runtime:" + runtime);

            // Calculate FPS

            var now = new Date().getTime();
            var timeDelta = now - this._debug_lastRenderCycleTime;
            this._debug_lastRenderCycleTime = now;
            var fps = Math.floor(1000 / timeDelta);
            this.printDebug("FPS:" + fps);
        }

        if (this.running) {
            setTimeout(ae.bind(this.drawLoop, this), 20);
        }
    },

    // Draw the player graphics.
    //
    drawPlayer : function () {
        "use strict";

        var ctx = this._ctx;
        var player = this._state.player;

        // Call draw routine in player state

        if (player.draw !== undefined) {
            player.draw(ctx, player);
            return
        }

        // If no specific draw routine is specified then draw a placeholder

        ctx.beginPath();
        ctx.arc(player.x, player.y, player.dim/2, 0, 2 * Math.PI);

        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            (player.x + Math.cos(player.rot) * 20),
            (player.y + Math.sin(player.rot) * 20)
        );
        ctx.closePath();

        ctx.stroke();

        var oldStrokeStyle = ctx.strokeStyle
        var dimHalf = player.dim / 2;

        ctx.strokeStyle = "red";
        ctx.rect(player.x - dimHalf, player.y - dimHalf, player.dim, player.dim);
        ctx.stroke();
        ctx.strokeStyle = oldStrokeStyle;
    },

    // Draw sprite graphics
    //
    drawSprites : function () {
        "use strict";
        var ctx = this._ctx;

        for(var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i];

            // Call draw routine in sprite state

            if (sprite.draw !== undefined) {

                sprite.draw(ctx, sprite);

            } else {

                ctx.beginPath();
                ctx.arc(sprite.x, sprite.y, sprite.dim/2, 0, 2 * Math.PI);

                ctx.moveTo(sprite.x, sprite.y);
                ctx.lineTo(
                    (sprite.x + Math.cos(sprite.rot) * 20),
                    (sprite.y + Math.sin(sprite.rot) * 20)
                );
                ctx.closePath();

                ctx.stroke();

                var oldStrokeStyle = ctx.strokeStyle
                var dimHalf = sprite.dim / 2;

                ctx.strokeStyle = "red";
                ctx.rect(sprite.x - dimHalf, sprite.y - dimHalf, sprite.dim, sprite.dim);
                ctx.stroke();
                ctx.strokeStyle = oldStrokeStyle;
            }
        }
    }
});
