"use strict";

var g_scene, g_camera, g_renderer, g_controls, g_mesh, g_plane, g_visualizer;
var g_vbuffer, g_ibuffer;

function renderer_init() {
    g_scene = new THREE.Scene();
    var width = window.innerWidth;
    var height = window.innerHeight;

    g_visualizer = new Module.Visualizer();

    g_renderer = new THREE.WebGLRenderer();
    g_renderer.setSize(width, height);
    var container = document.getElementById("frame");
    container.appendChild(g_renderer.domElement);

    g_camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    g_camera.position.set(0, 0, 5);
    g_scene.add(g_camera);

    window.addEventListener('resize', function(){
        var width = window.innerWidth;
        var height = window.innerHeight;
        g_renderer.setSize(width, height);
        g_camera.aspect = width / height;
        g_camera.updateProjectionMatrix();
    });

    var light = new THREE.DirectionalLight(0xffffff, 1);
    g_camera.add(light);

    g_controls = new THREE.TrackballControls(g_camera, container);
    g_controls.rotateSpeed = 20;
    g_controls.zoomSpeed = 1.2;
    g_controls.panSpeed = 1;
    g_controls.noZoom = false;
    g_controls.noPan = false;
    g_controls.staticMoving = true;
    g_controls.dynamicDampingFactor = 0.3;
    g_controls.keys = [65, 83, 68];

    var background_color = new THREE.Color(0.15, 0.15, 0.15);
    g_renderer.setClearColor(background_color, 1);
}

function renderer_render() {
    g_renderer.render(g_scene, g_camera);
}

function renderer_animate() {
    g_controls.update();
    renderer_render();
    requestAnimationFrame(renderer_animate);
}

function renderer_update_vbuffer() {
    g_vbuffer = [];

    var vertices_base = g_visualizer.get_vbuffer();
    var vertices_size = g_visualizer.get_vbuffer_size() * 4 * 3;
    for (var i = 0; i < vertices_size;) {
        var f1 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var f2 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var f3 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var vertex = new THREE.Vector3(f1, f2, f3);
        g_vbuffer.push(vertex);
    }
}

function renderer_update_ibuffer() {
    g_ibuffer = [];
    
    var indices_base = g_visualizer.get_ibuffer();
    var indices_size = g_visualizer.get_ibuffer_size() * 4;
    for (var i = 0; i < indices_size;) {
        var i1 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i2 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i3 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var face = new THREE.Face3(i1, i2, i3);
        g_ibuffer.push(face);
    }
}


function renderer_update_mesh() {
    if (g_mesh) {
        g_scene.remove(g_mesh);
    }

    var geometry = new THREE.Geometry();
    geometry.vertices = g_vbuffer;
    geometry.faces = g_ibuffer;
    geometry.computeFaceNormals();
    var material = new THREE.MeshLambertMaterial({ color: 0xeeccee, side : THREE.DoubleSide});
    g_mesh = new THREE.Mesh(geometry, material);

    g_scene.add(g_mesh);
}


/*
function renderer_update_mesh() {
    // remove current renderable
    g_scene.remove(g_mesh);

    // build a new render item
    var vertices_base = g_visualizer.get_vbuffer();
    var vertices_size = g_visualizer.get_vbuffer_size() * 4 * 3;
    var indices_base = g_visualizer.get_ibuffer();
    var indices_size = g_visualizer.get_ibuffer_size() * 4;

    log(g_visualizer.get_ibuffer_size() + "indices \n");

    var geometry = new THREE.Geometry();
    for (var i = 0; i < vertices_size;) {
        var f1 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var f2 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var f3 = Module.getValue(vertices_base + i, 'float');
        i += 4;
        var vertex = new THREE.Vector3(f1, f2, f3);
        geometry.vertices.push(vertex);
    }
    for (var i = 0; i < indices_size;) {
        var i1 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i2 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i3 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var face = new THREE.Face3(i1, i2, i3);
        geometry.faces.push(face);
    }

    geometry.computeFaceNormals();
    //geometry.computeVertexNormals();

    var material = new THREE.MeshLambertMaterial({ color: 0xeeccee, wireframe : false });
    g_mesh = new THREE.Mesh(geometry, material);

    // add the new render item to the scene
    g_scene.add(g_mesh);
}
*/