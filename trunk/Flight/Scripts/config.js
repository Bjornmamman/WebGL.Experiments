var require = {
    baseUrl: "scripts/app",
    shim: {
        three: { exports: "THREE" },
        tween: { exports: "TWEEN" },
        controls: { deps: ["three"] }
    },
    paths: {
        three: "../vendor/three",
        jquery: "../vendor/jquery.min",
        tween: "../vendor/tween.min",
        controls : "../controls"
    }
}