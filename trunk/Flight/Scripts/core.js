var Flight = this.Flight || {};

Flight.Utilities = (function ($, window, document, undefined) {

    return {
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

			}
        }
    }

})(jQuery, window, document);

Flight.Scene = (function ($, window, document, undefined) {
    function Scene(container) {
        var _this = this;
        this.scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0035);

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
        this.renderer.setClearColor(0x000000);
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
        this.controls = new THREE.FirstPersonControls(scene.camera);
        this.controls.movementSpeed = 70;
        this.controls.lookSpeed = 0.1;
        this.controls.tiltFactor = 0.05;

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

    function Element(scene) {
        this.el = new THREE.Mesh(
            new THREE.SphereGeometry(10, 360, 602),
            new THREE.MeshPhongMaterial({ ambient: 0xffffff, color: 0x00ff00, specular: 0x000000 })
        );
        this.el.position.y = 10;
        this.el.castShadow = true;
        this.el.receiveShadow = true;

        scene.scene.add(this.el);
    }

    return Element;

})(jQuery, window, document);


Flight.ElementIterator = (function ($, window, document, undefined) {
    
    function ElementIterator(scene) {
        this.el = new THREE.Mesh(
            new THREE.SphereGeometry(10, 360, 602),
            new THREE.MeshPhongMaterial({ ambient: 0xffffff, color: 0x00ff00, specular: 0x000000 })
        );

        this.el.position.y = 10;
        this.el.castShadow = true;
        this.el.receiveShadow = true;

        scene.scene.add(this.el);
    }

    ElementIterator.prototype.Add = function(count, box) {

    }

    return ElementIterator;

})(jQuery, window, document);

Flight.World = (function ($, window, document, undefined) {

    function World(scene) {
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000, 100, 100),
            new THREE.MeshLambertMaterial({ color: 0x00ff00, wireframe: true, wireframeLinewidth: 1 }
        ));
        this.ground.position.y = 0.1;
        this.ground.rotation.x = -Math.PI / 2;

        scene.scene.add(this.ground);
    }

    return World;

})(jQuery, window, document);



Flight.Core = (function ($, window, document, undefined) {
    var container,
        scene,
        player,
        element,
        clock,
        world;

    function init() {
        container = $("#container");

        if (Modernizr.webgl) {
            container.empty();

            generateScene();

            animate();
        }
    }

    function generateScene() {
        clock = new THREE.Clock();

        scene = new Flight.Scene(container[0]);
        world = new Flight.World(scene);
        element = new Flight.Element(scene);
        player = new Flight.Player(scene);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        var delta = clock.getDelta(),
            time = clock.getElapsedTime() * 5;

        scene.Update(delta);
    }

    return {
        Init: init
    }
})(jQuery, window, document);

$(function () {
    Flight.Core.Init();
})