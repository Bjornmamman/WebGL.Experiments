define(["jquery", "three", "settings", "utilities"], function ($, THREE, Settings, Utilities) {
    var Terrain = function(scenebase) {
        var _this = this;

        _this.scenebase = scenebase;

        this.AddGround(function () {
            this.AddOcean();
        });
    }

    Terrain.prototype.AddGround = function (complete) {
        var _this = this;

        Utilities.Load.Image("/assets/textures/mountain_heightmap_300.jpg", function () {

            var heightData = Utilities.Generate.HeightData(this, 301, 301, Settings.MountainScale);
            var groundPlane = new THREE.PlaneGeometry(10000, 10000, 300, 300);

            Utilities.Generate.AppendHeightData(groundPlane, heightData, "z");

            THREE.ImageUtils.loadTexture("/assets/textures/ground.gif", THREE.UVMapping, function (text) {
                text.wrapS = THREE.RepeatWrapping;
                text.wrapT = THREE.RepeatWrapping;
                text.needsUpdate = true;

                var material = new THREE.MeshPhongMaterial({
                    color: Settings.Ground.Color,
                    ambient: Settings.Ground.Ambient,
                    specular: Settings.Ground.Specular,
                    shading: THREE.FlatShading
                });

                _this.ground = new THREE.Mesh(
                    groundPlane,
                    material
                )

                _this.ground.rotation.x = -Math.PI / 2;
                _this.ground.position.y = Settings.Floor - (Settings.MountainScale / 2);
                _this.ground.castShadow = false;
                _this.ground.receiveShadow = true;

                _this.scenebase.scene.add(_this.ground);
            });

            if (typeof (complete) == "function")
                complete.call(_this);

        });
    }

    Terrain.prototype.AddOcean = function (complete) {
        var _this = this;

        _this.ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(10000, 10000, 10, 10),
            new THREE.MeshPhongMaterial({ color: Settings.OcenaColor, ambient: 0x666666, specular: 0xffffff, opacity: 1, shininess: 1, shading: THREE.FlatShading })
        );

        _this.ocean.rotation.x = -Math.PI / 2;
        _this.ocean.position.y = Settings.Floor;

        _this.scenebase.scene.add(_this.ocean);

        new TWEEN.Tween(_this.ocean.position).easing(TWEEN.Easing.Cubic.InOut).yoyo(true).repeat(10000).to({ y: Settings.Floor - 10 }, 10000).start();

        if (typeof (complete) == "function")
            complete();
    }

    return Terrain;
});