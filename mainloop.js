/**
 * Start a main loop on the provided game with the provided options.
 * @param {Object} game Object with two functions: update() and render().
 *   update(deltaTime) should update the game state. The deltaTime parameter
 *   is time passed since the last update in seconds.
 *   render() should draw the current game state and optionally return a
 *   CanvasRenderingContext2D for drawing debug information.
 * @param {Object} options Takes the following keys:
 *
 * updateFPS: number
 *  The rate at which the game state receives update() calls.
 *  Having a fixed update rate can help you to make the game deterministic
 *  and to keep physics calculations stable.
 *  Every update is not necessarily displayed on the screen.
 *
 * debugMode: boolean
 *  When debugMode is on, a timeline of frames is drawn on the canvas returned
 *  from game.render().
 *  - Green in the log is an update which was rendered to the screen.
 *  - Orange in the log is an update which was not rendered to the screen.
 *  - White in the log is a frame on which the game state was not updated.
 */
var startMainLoop = function(game, options) {
    var defaults = {
        updateFPS: 60,
        debugMode: false
    };

    if (options === undefined) {
        options = {};
    }
    for(var key in defaults) {
        if(!options.hasOwnProperty(key)) {
            options[key] = defaults[key];
        }
    }
    
    var timePerUpdate = 1000 / options.updateFPS;

    var nextFrameTime = new Date().getTime() - timePerUpdate * 0.5;

    var frameLog = [];

    var logTimeToX = function(time, lastTime, canvasWidth) {
        var fpsMult = Math.max(60, options.updateFPS) / 60;
        return (canvasWidth - 1) - (Math.ceil(lastTime / 2000) * 2000 - time) * 0.2 * fpsMult;
    }

    var drawFrameLog = function(ctx, callbackTime) {
        var w = ctx.canvas.width;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, 10);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#0f0';
        var lastTime = callbackTime;
        var i = frameLog.length;
        var x = ctx.canvas.width;
        while (i > 0 && x > 0) {
            --i;
            var frameStats = frameLog[i];
            if (frameStats.updates >= 1) {
                ctx.fillRect(logTimeToX(frameStats.time, lastTime, w), 0, 2, 10);
                    if (frameStats.updates > 1) {
                    ctx.fillStyle = '#f84';
                    for (var j = 1; j < frameStats.updates; ++j) {
                        var updateX = logTimeToX(frameStats.time - (j - 0.5) * timePerUpdate, lastTime, w);
                        ctx.fillRect(Math.round(updateX), 0, 2, 10);
                    }
                    ctx.fillStyle = '#0f0';
                }
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(logTimeToX(frameStats.time, lastTime, w), 0, 2, 10);
                ctx.fillStyle = '#0f0';
            }
        }
        ctx.restore();
    };

    var frame = function() {
        // Process a single requestAnimationFrame callback
        var time = new Date().getTime();
        var callbackTime = time;
        var updated = false;
        var updates = 0;
        // If there's been a long time since the last callback, it can be a sign that the game
        // is running very badly but it is possible that the game has gone out of focus entirely.
        // In either case, it is reasonable to do a maximum of half a second's worth of updates
        // at once.
        if (time - nextFrameTime > 500) {
            nextFrameTime = time - 500;
        }
        while (time > nextFrameTime) {
            nextFrameTime += timePerUpdate;
            game.update(timePerUpdate * 0.001);
            updates++;
        }
        if (options.debugMode) {
            frameLog.push({time: callbackTime, updates: updates});
        }
        if (updates > 0) {
            var ctx = game.render();
            if (options.debugMode && (ctx instanceof CanvasRenderingContext2D)) {
                drawFrameLog(ctx, callbackTime);
                if (frameLog.length >= 1024) {
                    frameLog.splice(0, 512);
                }
            }
        }
        requestAnimationFrame(frame);
    };
    frame();
};
