define(["three"], function (THREE) {

    var utils = {
        Load: {
            Images: function(images, complete) {
                var total = images.length,
                    loaded = 0;

                for (var i = 0; i < total; i++) {

                    utils.Load.Image(images[i], singleComplete)
                }

                function singleComplete(img, src) {
                    loaded++;

                    if (loaded == total && typeof(complete) == "function")
                        complete();

                }
            },
            Image: function (src, complete) {
                var img = new Image();
                img.src = src;

                if (img.naturalHeight > 0 && img.naturalWidth > 0) {
                    complete.call(img, src);
                    return;
                }

                img.onload = function() {
                    complete.call(img, src);
                }
            }
        },
        Generate: {

            RandomRange: function (min, max) {
                return Math.random() * (max - min) + min;
            },

            RandomHex: function (hex) {
                return (hex += [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)]) && (hex.length == 6) ? hex : utils.Generate.RandomHex(hex);
            },

            Texture: function (data, width, height) {

                var canvas, context, image, imageData,
				level, diff, vector3, sun, shade;

                vector3 = new THREE.Vector3(0, 0, 0);

                sun = new THREE.Vector3(1, 1, 1);
                sun.normalize();

                canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                context = canvas.getContext('2d');
                context.fillStyle = '#000';
                context.fillRect(0, 0, width, height);

                image = context.getImageData(0, 0, width, height);
                imageData = image.data;

                for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

                    vector3.x = data[j - 1] - data[j + 1];
                    vector3.y = 2;
                    vector3.z = data[j - width] - data[j + width];
                    vector3.normalize();

                    shade = vector3.dot(sun);

                    imageData[i] = (96 + shade * 128) * (data[j] * 0.007);
                    imageData[i + 1] = (32 + shade * 96) * (data[j] * 0.007);
                    imageData[i + 2] = (shade * 96) * (data[j] * 0.007);

                }

                context.putImageData(image, 0, 0);

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
                context.drawImage(img, 0, 0);

                var imageData = context.getImageData(0, 0, width, height).data,
                    color = 0,
                    j = 0;

                for (var i = 0; i < imageData.length; i += 4) {
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

    return utils;
})