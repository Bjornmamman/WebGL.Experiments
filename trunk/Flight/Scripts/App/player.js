define(["three", "tween"], function (THREE, TWEEN) {
    var Player = function(scenebase) {
        var _this = this;

        _this.scenebase = scenebase;
        _this.moveForward = false;
        _this.moveLeft = false;
        _this.moveBackward = false;
        _this.moveRight = false;

        _this.yawLeft = false;
        _this.yawRight = false;

        _this.rollLeft = false;
        _this.rollRight = false;

        _this.pitchUp = false;
        _this.pitchDown = false;

        _this.rollRad = THREE.Math.degToRad(10);
        _this.rollTween = new TWEEN.Tween(_this.scenebase.camera.rotation).easing(TWEEN.Easing.Cubic.Out);

        _this.pitchRad = THREE.Math.degToRad(10);
        _this.pitchTween = new TWEEN.Tween(_this.scenebase.camera.rotation).easing(TWEEN.Easing.Cubic.Out);

        _this.scenebase.camera.rotationAutoUpdate = true;
        /*
        this.controls = new THREE.FirstPersonControls(scene.camera);
        this.controls.movementSpeed = 100;
        this.controls.lookSpeed = 0.1;
        this.controls.tiltFactor = 0.05;
        this.controls.autoForward = false;*/

        $(window).on("resize", function () {
            _this.Resize.call(_this);
        });

        _this.scenebase.scene.addEventListener('preupdate', function (event) {
            _this.Update.call(_this, event.delta);
        });

        _this.scenebase.scene.addEventListener('resize', function (event) {
            _this.Resize.call(_this);
        });

        _this.Controllers();
    }

    Player.prototype.Controllers = function () {
        var _this = this;

        window.addEventListener('keydown', bind(this, _this.onKeyDown), false);
        window.addEventListener('keyup', bind(this, _this.onKeyUp), false);

        function bind(scope, fn) {

            return function () {

                fn.apply(scope, arguments);

            };

        };
    }


    /*
    * a        65 (yaw)
    * d        68
    * w        87 (yaw)
    * s        83
    * 
    * left     37 (roll)
    * right    39 (roll)
    * up       38 (pitch down)
    * down     40 (pitch up)
    */

    Player.prototype.onKeyDown = function (event) {
        var _this = this;

        switch (event.keyCode) {
            case 65: _this.yawLeft = true; break;
            case 68: _this.yawRight = true; break;

            case 87: _this.moveForward = true; break;
            case 83: _this.moveBackward = true; break;

            case 38:
                if (_this.pitchDown)
                    break;

                _this.pitchDown = true;
                //_this.pitchTween.stop().to({ x: -_this.pitchRad }, 500).start();

                break;
            case 40:
                if (_this.pitchUp)
                    break;

                _this.pitchUp = true;
                //_this.pitchTween.stop().to({ x: _this.pitchRad }, 500).start();

                break;

            case 37:
                if (_this.rollLeft)
                    break;

                _this.rollLeft = true;
                //_this.rollTween.stop().to({ z: _this.rollRad }, 500).start();
                break;

            case 39:
                if (_this.rollRight)
                    break;

                _this.rollRight = true;
                // _this.rollTween.stop().to({ z: -_this.rollRad }, 500).start();
                break;
        }

    };

    Player.prototype.onKeyUp = function (event) {
        var _this = this;

        switch (event.keyCode) {
            case 65: _this.yawLeft = false; break;
            case 68: _this.yawRight = false; break;

            case 87: _this.moveForward = false; break;
            case 83: _this.moveBackward = false; break;

            case 38:
            case 40:
                _this.pitchUp = false;
                _this.pitchDown = false;

                //_this.pitchTween.stop().to({ x: 0 }, 500).start();
                break;

            case 37:
            case 39:
                _this.rollLeft = false;
                _this.rollRight = false;

                //_this.rollTween.stop().to({ z: 0 }, 500).start();
                break;
        }

    };

    Player.prototype.Update = function (delta) {
        var _this = this;

        if (_this.yawLeft && !_this.yawRight)
            _this.scenebase.camera.rotation.y += 0.01;
        else if (_this.yawRight && !_this.yawLeft)
            _this.scenebase.camera.rotation.y -= 0.01;

        if (_this.rollLeft && !_this.rollRight)
            _this.scenebase.camera.rotation.y += 0.01;
        else if (_this.rollRight && !_this.rollLeft)
            _this.scenebase.camera.rotation.y -= 0.01;

        if (_this.pitchDown && !_this.pitchUp)
            _this.scenebase.camera.rotation.x += 0.01;
        else if (_this.pitchUp && !_this.pitchDown)
            _this.scenebase.camera.rotation.x -= 0.01;

        if (_this.moveForward)
            _this.scenebase.camera.translateZ(-5);
        else if (_this.moveBackward)
            _this.scenebase.camera.translateZ(5);

        if (this.controls != undefined)
            this.controls.update(delta);
    }

    Player.prototype.Resize = function () {
        if (this.controls != undefined)
            this.controls.handleResize();
    }

    return Player;
});