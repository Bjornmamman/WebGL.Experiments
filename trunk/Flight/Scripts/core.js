var Flight = this.Flight || {};


Flight.Settings = {
    BackgroundColor: 0xffffff,
    SkyColor: 0x9cf2ff,
    Ground: {
        Color: 0xb39272,
        Ambient: 0xe3d1bf,
        Specular: 0x453322
    },
    OcenaColor: 0x7295b3,
    Floor: 0,
    MountainScale: 1000
}

Flight.Utilities = (function ($, window, document, undefined) {

    return {
        Load: {
            Image: function (src, complete) {
                var img = new Image();
                img.src = src;

                if (img.naturalHeight > 0 && img.naturalWidth > 0) {
                    complete.call(img, src);
                    return;
                }

                img.onload = function () {
                    complete.call(img, src);
                }
            }
        },
        Generate: {

            RandomRange: function (min, max) { 
	            return Math.random()*(max-min) + min; 
            },

            RandomHex: function (hex) {
                return (hex += [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)]) && (hex.length == 6) ? hex : Flight.Utilities.Generate.RandomHex(hex);
            },

            Texture: function( data, width, height ) {

				var canvas, context, image, imageData,
				level, diff, vector3, sun, shade;

				vector3 = new THREE.Vector3( 0, 0, 0 );

				sun = new THREE.Vector3( 1, 1, 1 );
				sun.normalize();

				canvas = document.createElement( 'canvas' );
				canvas.width = width;
				canvas.height = height;

				context = canvas.getContext( '2d' );
				context.fillStyle = '#000';
				context.fillRect( 0, 0, width, height );

				image = context.getImageData( 0, 0, width, height );
				imageData = image.data;

				for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++  ) {

					vector3.x = data[ j - 1 ] - data[ j + 1 ];
					vector3.y = 2;
					vector3.z = data[ j - width ] - data[ j + width ];
					vector3.normalize();

					shade = vector3.dot( sun );

					imageData[ i ] = ( 96 + shade * 128 ) * ( data[ j ] * 0.007 );
					imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( data[ j ] * 0.007 );
					imageData[ i + 2 ] = ( shade * 96 ) * ( data[ j ] * 0.007 );

				}

				context.putImageData( image, 0, 0 );

				return canvas;

            },

            HeightData: function (img, width, height, scale) {

                var size = width * height,
                    data = new Float32Array(size);

                if (scale == undefined)
                    scale = 1;

                for (var i = 0; i < size; i++) {
                    data[i] = 0
                }

				var canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

                var context = canvas.getContext("2d");
                context.drawImage(img,0,0);

                var imageData = context.getImageData(0, 0, width, height).data,
                    color = 0,
                    j = 0;

                for (var i = 0; i < imageData.length; i +=4) {
                    color = imageData[i] + imageData[i + 1] + imageData[i + 2];
                    data[j++] = (color / 765) * scale;
                }

                return data;
            },

            AppendHeightData: function (plane, heightData, vertex) {

                for (var i = 0, l = plane.vertices.length; i < l; i++) {
                    plane.vertices[i][vertex] = heightData[i];
                }

                plane.verticesNeedUpdate = true;
                plane.computeFaceNormals();
                plane.computeVertexNormals();
                plane.normalsNeedUpdate = true;

                return plane;
            }
        }
    }

})(jQuery, window, document);

Flight.Scene = (function ($, window, document, undefined) {
    function Scene(container) {
        var _this = this;

        this.scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
        this.scene.fog = new THREE.FogExp2(Flight.Settings.BackgroundColor, 0.001);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, 25, 0);
        

        var hemiLight = new THREE.HemisphereLight(Flight.Settings.SkyColor, Flight.Settings.BackgroundColor, 0.5);
        hemiLight.position.set(0, 2000, 0);
        hemiLight.castShadow = true;

        this.scene.add(hemiLight);
        /*

        var dirLight = new THREE.DirectionalLight(Flight.Settings.BackgroundColor, 0.8);
        dirLight.castShadow = true;

        this.scene.add(dirLight);
        */
        //var light = new THREE.DirectionalLight(0xffffff);
        //light.position.set(0, 500, 500).normalize();
        //this.scene.add(light);




        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(Flight.Settings.BackgroundColor);
        this.renderer.setSize(window.innerWidth, window.innerHeight);


        $(window).on("resize", function () {
            _this.Resize.call(_this);
        });

        container.appendChild(this.renderer.domElement);
    }

    Scene.prototype.Update = function (delta) {
        var _this = this;

        this.scene.dispatchEvent({ type: 'preupdate', delta: delta });
        this.renderer.render(_this.scene, _this.camera);
        this.scene.dispatchEvent({ type: 'postupdate', delta: delta });
    }

    Scene.prototype.Resize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.scene.dispatchEvent({ type: 'resize' });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    return Scene;

})(jQuery, window, document);


Flight.Player = (function ($, window, document, undefined) {

    function Player(scene) {
        var _this = this;

        _this.scene = scene;
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
        _this.rollTween = new TWEEN.Tween(_this.scene.camera.rotation).easing(TWEEN.Easing.Cubic.Out);

        _this.pitchRad = THREE.Math.degToRad(10);
        _this.pitchTween = new TWEEN.Tween(_this.scene.camera.rotation).easing(TWEEN.Easing.Cubic.Out);
        
        _this.scene.camera.rotationAutoUpdate = true;
        /*
        this.controls = new THREE.FirstPersonControls(scene.camera);
        this.controls.movementSpeed = 100;
        this.controls.lookSpeed = 0.1;
        this.controls.tiltFactor = 0.05;
        this.controls.autoForward = false;*/

        $(window).on("resize", function () {
            _this.Resize.call(_this);
        });

        scene.scene.addEventListener('preupdate', function (event) {
            _this.Update.call(_this, event.delta);
        });

        scene.scene.addEventListener('resize', function (event) {
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
            _this.scene.camera.rotation.y += 0.01;
        else if (_this.yawRight && !_this.yawLeft)
            _this.scene.camera.rotation.y -= 0.01;

        if (_this.rollLeft && !_this.rollRight)
            _this.scene.camera.rotation.y += 0.01;
        else if (_this.rollRight && !_this.rollLeft)
            _this.scene.camera.rotation.y -= 0.01;

        if (_this.pitchDown && !_this.pitchUp)
            _this.scene.camera.rotation.x += 0.01;
        else if (_this.pitchUp && !_this.pitchDown)
            _this.scene.camera.rotation.x -= 0.01;

        if (_this.moveForward)
            _this.scene.camera.translateZ(-5);
        else if (_this.moveBackward)
            _this.scene.camera.translateZ(5);

        if (this.controls != undefined)
            this.controls.update(delta);
    }

    Player.prototype.Resize = function () {
        if(this.controls != undefined)
            this.controls.handleResize();
    }

    return Player;

})(jQuery, window, document);

Flight.Element = (function ($, window, document, undefined) {

    function Element(scene, settings) {
        this.el = new THREE.Mesh(
            new THREE.SphereGeometry(10, 32, 32),
            new THREE.MeshPhongMaterial({
                ambient: 0xffffff,
                color: settings != undefined && settings.color != undefined ? settings.color : 0x00ff00,
                specular: 0x000000
            })
        );
        
        if (settings != undefined && settings.position != undefined) {
            this.el.position.x = settings.position.x;
            this.el.position.y = settings.position.y;
            this.el.position.z = settings.position.z;
        }
            

        this.el.castShadow = true;
        this.el.receiveShadow = true;

        scene.scene.add(this.el);
    }

    return Element;

})(jQuery, window, document);

Flight.ElementIterator = (function ($, window, document, undefined) {
    
    function ElementIterator(scene, settings) {
        for (var i = 0; i < settings.count; i++) {
            var element = new Flight.Element(scene, {
                color: "#" + Flight.Utilities.Generate.RandomHex(""),
                position: new THREE.Vector3(
                    Flight.Utilities.Generate.RandomRange(settings.bounding.min.x, settings.bounding.max.x),
                    Flight.Utilities.Generate.RandomRange(settings.bounding.min.y, settings.bounding.max.y),
                    Flight.Utilities.Generate.RandomRange(settings.bounding.min.z, settings.bounding.max.z)
                )
            });
        }

    }

    return ElementIterator;

})(jQuery, window, document);

Flight.World = (function ($, window, document, undefined) {

    function World(scene) {
        var _this = this;

        _this.scene = scene;

        this.AddGround(function () {
            this.AddOcean();
        });
    }

    World.prototype.AddGround = function (complete) {
        var _this = this;

        Flight.Utilities.Load.Image("/assets/textures/mountain_heightmap_300.jpg", function () {

            var heightData = Flight.Utilities.Generate.HeightData(this, 301, 301, Flight.Settings.MountainScale);
            var groundPlane = new THREE.PlaneGeometry(10000, 10000, 300, 300);

            Flight.Utilities.Generate.AppendHeightData(groundPlane, heightData, "z");

            THREE.ImageUtils.loadTexture("/assets/textures/ground.gif", THREE.UVMapping, function (text) {
                text.wrapS = THREE.RepeatWrapping;
                text.wrapT = THREE.RepeatWrapping;
                text.needsUpdate = true;

                var material = new THREE.MeshPhongMaterial({
                    color: Flight.Settings.Ground.Color,
                    ambient: Flight.Settings.Ground.Ambient,
                    specular: Flight.Settings.Ground.Specular,
                    shading: THREE.FlatShading
                });
                
                _this.ground = new THREE.Mesh(
                    groundPlane, 
                    material
                )

                _this.ground.rotation.x = -Math.PI / 2;
                _this.ground.position.y = Flight.Settings.Floor - (Flight.Settings.MountainScale / 2);
                _this.ground.castShadow = false;
                _this.ground.receiveShadow = true;

                _this.scene.scene.add(_this.ground);
            });

            if (typeof (complete) == "function")
                complete.call(_this);

        });
    }

    World.prototype.AddOcean = function (complete) {
        var _this = this;

        _this.ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(10000, 10000, 10, 10),
            new THREE.MeshPhongMaterial({ color: Flight.Settings.OcenaColor, ambient: 0x666666, specular: 0xffffff,  opacity: 1, shininess: 1, shading: THREE.FlatShading })
        );

        _this.ocean.rotation.x = -Math.PI / 2;
        _this.ocean.position.y = Flight.Settings.Floor;

        _this.scene.scene.add(_this.ocean);

        new TWEEN.Tween(_this.ocean.position).easing(TWEEN.Easing.Cubic.InOut).yoyo(true).repeat(10000).to({ y: Flight.Settings.Floor - 10 }, 10000).start();

        if (typeof (complete) == "function")
            complete();
    }

    return World;

})(jQuery, window, document);

Flight.Ticker = (function ($, window, document, undefined) {

    function Ticker(calllbacks, complete, tick) {
        this.clock = new THREE.Clock();
        this.time = 0;

        if (typeof (calllbacks.complete) == "function" && typeof (calllbacks.tick) == "function") {
            calllbacks.complete.call(this);
            this.tick = calllbacks.tick;

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

})(jQuery, window, document);



Flight.Core = (function ($, window, document, undefined) {
    var container,
        scene,
        player,
        element,
        elements,
        clock,
        world,
        ticker;

    function init() {
        container = $("#container");

        if (Modernizr.webgl) {
            container.empty();

            generateScene();
        }
    }

    function generateScene() {
        ticker = new Flight.Ticker({
            complete: function () {
                scene = new Flight.Scene(container[0]);
                world = new Flight.World(scene);
                /*elements = new Flight.ElementIterator(scene, {
                    count: 100,
                    bounding: new THREE.Box3(
                        new THREE.Vector3(-500, 10, -500),
                        new THREE.Vector3(500, 100, 500)
                    )
                });*/

                player = new Flight.Player(scene);
            },
            tick: function(delta, time) {
                scene.Update(delta);
            }
        });
    }

    return {
        Init: init
    }
})(jQuery, window, document);

$(function () {
    Flight.Core.Init();
})