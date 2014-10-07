var Flight = this.Flight || {};

if (!window.requestAnimationFrame) {

    window.requestAnimationFrame = (function () {

        return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {

		    window.setTimeout(callback, 1000 / 60);

		};

    })();

}


Flight.Settings = {
    BackgroundColor: 0xffffff
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
            Topography: function (width, height) {
                var data = new Uint8Array(width * height),
                    perlin = new SimplexNoise(),
                    size = width * height,
                    quality = 2,
                    z = Math.random() * 100;

                for (var j = 0; j < 4; j++) {
                    quality *= 4;

                    for (var i = 0; i < size; i++) {
                        var x = i % width, y = ~~(i / width);
                        data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * 0.5) * quality + 10;
                    }

                }

                return data;
            },

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

                var imageData = context.getImageData(0, 0, width, height).data;
                
                var j = 0;
                for (var i = 0; i < imageData.length; i +=4) {
                    var all = imageData[i] + imageData[i + 1] + imageData[i + 2];
                    data[j++] =  (all / 30) * scale;
                }

                return data;
            },

            AppendHeightData: function (plane, heightData) {
                for (var i = 0, l = plane.vertices.length; i < l; i++) {
                    plane.vertices[i].z = heightData[i];
                }

                return plane;
            }
        }
    }

})(jQuery, window, document);

Flight.Scene = (function ($, window, document, undefined) {
    function Scene(container) {
        var _this = this;

        this.scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
       // this.scene.fog = new THREE.FogExp2(Flight.Settings.BackgroundColor, 0.005);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0, 25, 0);


        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
        hemiLight.position.set(100, 1000, 100);

        this.scene.add(hemiLight);


        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 1000, 100);

        spotLight.castShadow = true;

        spotLight.shadowMapWidth = 1024;
        spotLight.shadowMapHeight = 1024;

        spotLight.shadowCameraNear = 500;
        spotLight.shadowCameraFar = 4000;
        spotLight.shadowCameraFov = 300;

        this.scene.add(spotLight);


        this.renderer = new THREE.WebGLRenderer({ antialias: false, autoClear: false });
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

    Scene.prototype.AddMesh = function (geometry, scale, x, y, z, rx, ry, rz, material) {

        var mesh = new THREE.Mesh(geometry, material);
        mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        mesh.rotation.x = rx;
        mesh.rotation.y = ry;
        mesh.rotation.z = rz;
        mesh.overdraw = true;
        mesh.doubleSided = false;
        mesh.updateMatrix();

        this.scene.addObject(mesh);

        return mesh;
    }

    return Scene;

})(jQuery, window, document);


Flight.Player = (function ($, window, document, undefined) {

    function Player(scene) {
        var _this = this;
        this.controls = new THREE.FirstPersonControls(scene.camera);
        this.controls.movementSpeed = 100;
        this.controls.lookSpeed = 0.1;
        this.controls.tiltFactor = 0.05;
        this.controls.autoForward = true;
        this.controls.bounding = new THREE.Box3(
            new THREE.Vector3(-500, 10, -500),
            new THREE.Vector3(500, 100, 500)
        )

        $(window).on("resize", function () {
            _this.Resize.call(_this);
        });

        scene.scene.addEventListener('preupdate', function (event) {
            _this.Update.call(_this, event.delta);
        });

        scene.scene.addEventListener('resize', function (event) {
            _this.Resize.call(_this);
        });
    }

    Player.prototype.Update = function (delta) {
        this.controls.update(delta);
        
    }

    Player.prototype.Resize = function () {
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

        this.materials = [];
        this.currenMaterial = 0;


        var imageLoader = new THREE.ImageLoader();
        Flight.Utilities.Load.Image("/assets/textures/mountain_heightmap_300.jpg", function () {

            var heightData = Flight.Utilities.Generate.HeightData(this, 300, 300, 100);

            _this.plane = new THREE.PlaneGeometry(10000, 10000, 300, 300);

            Flight.Utilities.Generate.AppendHeightData(_this.plane, heightData);

            var texture = THREE.ImageUtils.loadTexture("/assets/textures/mountain_300.jpg", THREE.UVMapping, function (text) {
                text.wrapS = THREE.RepeatWrapping;
                text.wrapT = THREE.RepeatWrapping;

                var mountainMaterial = new THREE.MeshPhongMaterial({
                    map: texture,
                    ambient: 0xaaaaaa,
                    specular: 0xffffff,
                    shininess: 0,
                    shading: THREE.SmoothShading
                });

                this.ground = new THREE.Mesh(_this.plane, mountainMaterial);

                this.ground.position.y = 0;
                this.ground.rotation.x = -Math.PI / 2;

                scene.scene.add(this.ground);
            });

            
            
        });

        
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
                elements = new Flight.ElementIterator(scene, {
                    count: 100,
                    bounding: new THREE.Box3(
                        new THREE.Vector3(-500, 10, -500),
                        new THREE.Vector3(500, 100, 500)
                    )
                });

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