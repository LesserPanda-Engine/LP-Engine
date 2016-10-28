var core = require('engine/core');
var EventEmitter = require('engine/eventemitter3');

/**
 * Game is the main hub for a game. A game made with LesserPanda
 * is a combination of different `Games`(menu, shop, game, game-over .etc).
 *
 * @class Game
 * @constructor
 * @extends {EvenetEmitter}
 */
function Game() {
  EventEmitter.call(this);

  /**
   * Desired FPS this scene should run
   * @property {Number} desiredFPS
   * @default 60
   */
  this.desiredFPS = 60;

  /**
   * List of added systems
   * @property {Array} systems
   */
  this.systems = [];

  /**
   * Caches update informations
   * @type {Object}
   * @private
   */
  this.updateInfo = {
    spiraling: 0,
    last: -1,
    realDelta: 0,
    deltaTime: 0,
    desiredFPS: 30,
    lastCount: 0,
    step: 0,
    slowStep: 0,
    count: 0,
  };
}

Game.prototype = Object.create(EventEmitter.prototype);
Game.prototype.constructor = Game;

/**
 * Called each single frame by engine core, support both idle and fixed update.
 * Using a modified fixed update implementation from Phaser by @photonstorm
 * @protected
 */
Game.prototype.run = function(timestamp) {
  var updateInfo = this.updateInfo;

  if (updateInfo.last > 0) {
    updateInfo.realDelta = timestamp - updateInfo.last;
  }
  updateInfo.last = timestamp;

  // If the logic time is spiraling upwards, skip a frame entirely
  if (updateInfo.spiraling > 1) {
    // Reset the deltaTime accumulator which will cause all pending dropped frames to be permanently skipped
    updateInfo.deltaTime = 0;
    updateInfo.spiraling = 0;
  }
  else {
    // Step size
    updateInfo.step = 1000.0 / this.desiredFPS;
    updateInfo.slowStep = updateInfo.step * core.speed;
    updateInfo.slowStepSec = updateInfo.step * 0.001 * core.speed;

    // Accumulate time until the step threshold is met or exceeded... up to a limit of 3 catch-up frames at step intervals
    updateInfo.deltaTime += Math.max(Math.min(updateInfo.step * 3, updateInfo.realDelta), 0);

    // Call the game update logic multiple times if necessary to "catch up" with dropped frames
    // unless forceSingleUpdate is true
    updateInfo.count = 0;

    while (updateInfo.deltaTime >= updateInfo.step) {
      updateInfo.deltaTime -= updateInfo.step;

      // Fixed update
      this.fixedUpdate(updateInfo.slowStep, updateInfo.slowStepSec);

      updateInfo.count += 1;
    }

    // Detect spiraling (if the catch-up loop isn't fast enough, the number of iterations will increase constantly)
    if (updateInfo.count > updateInfo.lastCount) {
      updateInfo.spiraling += 1;
    }
    else if (updateInfo.count < updateInfo.lastCount) {
      // Looks like it caught up successfully, reset the spiral alert counter
      updateInfo.spiraling = 0;
    }

    updateInfo.lastCount = updateInfo.count;
  }

  // Idle update
  this.update(updateInfo.realDelta, updateInfo.realDelta * 0.001);
};

/**
 * Awake is called when this scene is activated.
 * @method awake
 * @memberof Game#
 */
Game.prototype.awake = function() {
  var i, sys;
  for (i = 0; i < this.systems.length; i++) {
    sys = this.systems[i];
    sys.awake && sys.awake();
  }

  this.emit('awake');
};

/**
 * Update is called every single frame.
 * @method update
 * @memberof Game#
 */
Game.prototype.update = function(delta, deltaSec) {
  var i, sys;
  for (i = 0; i < this.systems.length; i++) {
    sys = this.systems[i];
    sys && sys.update && sys.update(delta, deltaSec);
  }

  this.emit('update', delta, deltaSec);
};

/**
 * Fixed update is called in a constant frenquence decided by `desiredFPS`.
 * @method fixedUpdate
 * @memberof Game#
 */
Game.prototype.fixedUpdate = function(delta, deltaSec) {
  var i, sys;
  for (i = 0; i < this.systems.length; i++) {
    sys = this.systems[i];
    sys && sys.fixedUpdate && sys.fixedUpdate(delta, deltaSec);
  }

  this.emit('fixedUpdate', delta, deltaSec);
};

/**
 * Freeze is called when this scene is deactivated(switched to another one)
 * @method freeze
 * @memberof Game#
 */
Game.prototype.freeze = function() {
  var i, sys;
  for (i = 0; i < this.systems.length; i++) {
    sys = this.systems[i];
    sys && sys.freeze && sys.freeze();
  }

  this.emit('freeze');
};

/**
 * System pause callback.
 * @method pause
 * @memberof Game#
 */
Game.prototype.pause = function() {};
/**
 * System resume callback.
 * @method resume
 * @memberof Game#
 */
Game.prototype.resume = function() {};

/**
 * Resize callback.
 * @method resize
 * @memberof Game#
 */
Game.prototype.resize = function(/*w, h*/) {};

/**
 * Create a new layer
 * @param {string} name      Name of this layer
 * @param {string} [parent]  Key of parent layer, default is `stage`.
 */
Game.prototype.createLayer = function(name, parent) {
  renderer.createLayer(this, name, parent);
  return this;
};

/**
 * Sub-system updating order
 * @memberof Game
 * @type {array}
 */
// systems: [
//   'Actor',
//   'Animation',
//   'Physics',
//   'Renderer',
// ]

/**
 * @example <captain>Create a new game class</captain>
 * import Game from 'engine/game';
 * class MyGame extends Game {}
 *
 * @example <captain>Switch to another game</captain>
 * import core from 'engine/core';
 * import MyGame from 'engine/my-game';
 * core.setGame(MyGame);
 *
 * @exports engine/game
 * @requires engine/eventemitter3
 * @requires engine/core
 * @requires engine/utils
 */
module.exports = Game;
