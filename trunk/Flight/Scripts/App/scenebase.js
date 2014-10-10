define(["three", "settings"], function (THREE, Settings) {
    var SceneBase = function(container) {
        var _this = this;

        _this.scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
        _this.scene.fog = new THREE.FogExp2(Settings.BackgroundColor, 0.001);

        _this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        _this.camera.position.set(0, 25, 0);


        var hemiLight = new THREE.HemisphereLight(Settings.SkyColor, Settings.BackgroundColor, 0.5);
        hemiLight.position.set(0, 2000, 0);
        hemiLight.castShadow = true;

        _this.scene.add(hemiLight);
        /*

        var dirLight = new THREE.DirectionalLight(Flight.Settings.BackgroundColor, 0.8);
        dirLight.castShadow = true;

        this.scene.add(dirLight);
        */
        //var light = new THREE.DirectionalLight(0xffffff);
        //light.position.set(0, 500, 500).normalize();
        //this.scene.add(light);




        _this.renderer = new THREE.WebGLRenderer();
        _this.renderer.setClearColor(Settings.BackgroundColor);
        _this.renderer.setSize(window.innerWidth, window.innerHeight);


        $(window).on("resize", function () {
            _this.Resize.call(_this);
        });

        container.appendChild(_this.renderer.domElement);
    }

    SceneBase.prototype.Update = function (delta) {
        var _this = this;

        this.scene.dispatchEvent({ type: 'preupdate', delta: delta });
        this.renderer.render(_this.scene, _this.camera);
        this.scene.dispatchEvent({ type: 'postupdate', delta: delta });
    }

    SceneBase.prototype.Resize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.scene.dispatchEvent({ type: 'resize' });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    return SceneBase;
})