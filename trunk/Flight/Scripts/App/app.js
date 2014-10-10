define(["jquery", "three", "settings", "utilities", "ticker", "scenebase", "terrain", "player"], function ($, THREE, Settings, Utilities, Ticker, SceneBase, Terrain, Player) {
    var app = {

        init: function () {
            app.container = $("#container");

            if (Modernizr.webgl) {
                app.container.empty();

                app.generateScene();
            }
        },

        generateScene: function () {
            app.ticker = new Ticker({
                complete: function () {
                    app.sceneBase = new SceneBase(app.container[0]);
                    app.world = new Terrain(app.sceneBase);
                    app.player = new Player(app.sceneBase);
                },
                tick: function(delta, time) {
                    app.sceneBase.Update(delta);
                }
            });
        }
    }

    return app;
});