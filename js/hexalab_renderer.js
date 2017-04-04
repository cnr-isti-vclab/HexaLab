"use strict";

var g_scene, g_camera, g_renderer, g_controls, g_mesh, g_plane, g_visualizer;
var g_verts, g_faces;

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
    
    g_controls = new THREE.OrbitControls(g_camera, container);

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
    g_verts = [];

    // TODO is there a way to directly "plug in" the visualizer vbuffer instead of creating a copy?

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
        g_verts.push(vertex);
    }
}

function renderer_update_view() {
    g_faces = [];

    // TODO is there a way to directly "plug in" the visualizer ibuffer instead of creating a copy?
    
    var indices_base = g_visualizer.get_ibuffer();
    var indices_size = g_visualizer.get_ibuffer_size() * 4;
    var normals_base = g_visualizer.get_normals();
    for (var i = 0, n = 0; i < indices_size;) {
        var nx = Module.getValue(normals_base + n, 'float');
        n += 4;
        var ny = Module.getValue(normals_base + n, 'float');
        n += 4;
        var nz = Module.getValue(normals_base + n, 'float');
        n += 4;
        var normal = new THREE.Vector3(nx, ny, nz);

        var i1 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i2 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var i3 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        var face = new THREE.Face3(i1, i2, i3, normal);
        g_faces.push(face);

        i1 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        i2 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        i3 = Module.getValue(indices_base + i, 'i32');
        i += 4;
        face = new THREE.Face3(i1, i2, i3, normal);
        g_faces.push(face);
    }

    if (g_mesh) {
        g_scene.remove(g_mesh);
    }

    var geometry = new THREE.Geometry();
    geometry.vertices = g_verts;
    geometry.faces = g_faces;
    //geometry.computeFaceNormals();
    var material = new THREE.MeshLambertMaterial({ color: 0xeeccee, side: THREE.DoubleSide });
    g_mesh = new THREE.Mesh(geometry, material);

    g_scene.add(g_mesh);

    var center = g_visualizer.get_center();
    g_controls.target = new THREE.Vector3(center.get_x(), center.get_y(), center.get_z());
}
