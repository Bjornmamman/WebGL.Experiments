define(["three", "tween"], function (THREE, TWEEN) {
    var Ticker = function(callbacks, complete, tick) {
        this.clock = new THREE.Clock();
        this.time = 0;

        if (typeof (callbacks.complete) == "function" && typeof (callbacks.tick) == "function") {
            callbacks.complete.call(this);
            this.tick = callbacks.tick;

            this.Animate();
        }
    }

    Ticker.prototype.Animate = function () {
        var _this = this;

        window.requestAnimationFrame(this.Animate.bind(this));

        this.Tick();
    }

    Ticker.prototype.Tick = function () {
        var delta = this.clock.getDelta(),
            time = this.clock.getElapsedTime() * 5;

        TWEEN.update();

        this.tick.call(this, delta, time);
    }

    return Ticker;
})