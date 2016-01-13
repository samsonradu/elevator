var EventEmitter = require('events').EventEmitter;
var Dispatcher = require('./dispatcher.js');

const LEVEL_TIMEOUT = 3000; //time to move one floor
const DOOR_TIMEOUT = 5000; //time to wait for inner commands when doors open
const CHANGE_EVENT = 'change';

class Elevator extends EventEmitter {

    emitChange() {
        this.emit(CHANGE_EVENT);
    }
    
    /**
     * @param {function} callback
     */
    addChangeListener(callback) {
        this.on(CHANGE_EVENT, callback);
    }

    /**
     * @param {function} callback
     */
    removeChangeListener(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }

    constructor(levels){
        super();
        this.levels = levels;
        this.state = {
            'level' : 0,
            'running' : null,
            'inner' : [],
            'outer' : [],
        };
    }

    /**
     * Offload a queued command - for example when we have to do a stop somewhere 
     *
     * @param string type (inner/outer)
     * @param integer level
     * @param string direction (up/down)
     *
     * @return
     */ 
    offload(type, level, direction){
        if (type === 'inner')
            this.state.inner = this.state.inner.filter(function(item){
                return item.level !== level;
            });
        else 
            this.state.outer = this.state.outer.filter(function(item){
                return item.level !== level || item.direction !== direction;
            });
    }

    /**
     * Returns an existing inner/outer command for level (if any)
     * @param string type (inner/outer)
     * @param integer level
     * @param string direction
     *
     * @return command || null;
     */ 
     get(type, level, direction){
        if (type === 'inner')
            var match = this.state.inner.filter(function(item){
                return item.level === level;
            });
        else
            var match = this.state.outer.filter(function(item){
                return item.level === level && item.direction === direction;
            });

        return match.shift();
    }

    /**
     * Send commands to the elevator
     * @param string type (inner/outer)
     * @param integer level
     * @param string direction (up/down)
     *
     */ 
    command(type, level, direction){
        if (level > (this.levels - 1) || level < 0) //invalid command
            return;
        if (level === this.state.level){
            //console.log("[INFO] Opening doors...");
            return;
        }

        console.log("[COMMAND][" + type.toUpperCase() + "] button to " + level + " pressed");

        if (type === 'inner')
            this.state.inner.push({
                'level' : level,
                'type' : type
            });
        else 
            this.state.outer.push({
                'level' : level,
                'direction' : direction,
                'type' : type
            });
    }

    move(level, cb){
        var self = this;
        //if we reached our level 
        if (this.state.level === level){
            //every time we reach a desired level we have to wait a couple of seconds for 'inner' commands 
            console.log("[INFO] Opening doors at destination: " + level);
            setTimeout(function(){
                self.state.running = null;
            }, DOOR_TIMEOUT);
            return;
        }
        var direction = this.state.level > level ? 'down' : 'up';
        console.log("[INFO] Going " + direction);

        setTimeout(function(){
            self.state.level += (direction === 'up' ? 1 : -1);
            console.log("[INFO] Reaching " + self.state.level);

            //if we need to make a middle stop we do it here, delaying to leave 
            var found = self.get('inner', self.state.level) || self.get('outer', self.state.level, direction); 
            if (found){
                console.log("[INFO] Opening doors at level: " + self.state.level);
                self.offload(found.type, self.state.level, found.direction);
                setTimeout(function(){
                    cb(level, cb);
                }, DOOR_TIMEOUT);
            }
            else {
                //we call this same method recursively until level is reached
                cb(level, cb);
            }
        }, LEVEL_TIMEOUT);
    }

    init(){
        var self = this;
        setInterval(function(){
            self.evaluate();
        }, 100);
    }

    /**
     * The elevator picks up commands from the command queues by the following rules:
     *  - It can only perform one command at a time so when picking a command we set the running property on the state (Elevator.prototype.state.running is a "lock")
     *  - When the destination is reached we release the "lock" and the elevator can pick up further commands
     *  - The inner queue has priority, since we don't want our clients to be moved around
     *  - Once we picked a command we call the "@move" method with the requested level as a parameter
     *  - The move() method goes step by step calls itself recursively until the requested level has been reached. Only inner commands can be interrupted by other 
     *  "inner" commands. For example:
     *      If 2 people get in the elevator at level 3, then, one presses button 0, after that the other presses button 1. 
     *      It's the command to 0 that's picked up, however at each level we check if there are other inner commands queued that we can take care of.
     *      If yes, we just delay the next move call by 5 seconds and "open the doors". 
     *            
     */ 
    evaluate(){
        Dispatcher.dispatch({
            actionType: 'CHANGE_EVENT'
        });

        //we need to see if we can pick new instruction from the queues
        if (this.state.running !== null)
            return;

        //inner queue has priority
        if (this.state.inner.length) {
            //we have people inner the elevator and they pressed buttons
            var current = this.state.inner.shift();
            console.log("[PROCESS][INNER] Picked command to " + current.level);
            this.state.running = current;
            this.move(current.level, this.move.bind(this));
        }
        else if (this.state.outer.length){
            //elevator is called from the outer, lets pick up the command
            var current = this.state.outer.shift();
            console.log("[PROCESS][OUTER] Picked command to " + current.level);
            this.state.running = current;
            this.move(current.level, this.move.bind(this));
        }
    }
}

let elevator = new Elevator();
elevator.init();

Dispatcher.register(function(action) {
    elevator.emitChange();  
});


module.exports = elevator;

