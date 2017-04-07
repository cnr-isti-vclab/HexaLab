"use strict";

var g_scene, g_camera, g_renderer, g_controls, g_plane, g_visualizer;
var g_mesh, g_wireframe;
var g_mesh_mat, g_wireframe_mat;
var g_vbuffer, g_faces, g_edges;

function renderer_init() {
    // Scene
    g_scene = new THREE.Scene();
    var width = window.innerWidth;
    var height = window.innerHeight;

    // Visualizer interface
    g_visualizer = new Module.Visualizer();

    // Renderer
    g_renderer = new THREE.WebGLRenderer();
    g_renderer.setSize(width, height);
    var container = document.getElementById("frame");
    container.appendChild(g_renderer.domElement);

    // Camera
    g_camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    g_camera.position.set(0, 0, 5);
    g_scene.add(g_camera);

    // Light
    var light = new THREE.PointLight(0xffffff, 1, 100);
    g_camera.add(light);
    
    // Controls
    g_controls = new THREE.TrackballControls(g_camera, container);
    g_controls.rotateSpeed = 10;
    g_controls.dynamicDampingFactor = 1;

    // Background
    var background_color = new THREE.Color(1, 1, 1);
    g_renderer.setClearColor(background_color, 1);

    // Materials
    g_mesh_mat = new THREE.MeshLambertMaterial({ color: 0x666666, polygonOffset: true, polygonOffsetFactor: 0.5, });
    g_wireframe_mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })

    // Resize event
    window.addEventListener('resize', function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        g_renderer.setSize(width, height);
        g_camera.aspect = width / height;
        g_camera.updateProjectionMatrix();
    });
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

    var base = g_visualizer.get_vbuffer();
    var size = g_visualizer.get_vbuffer_size();

    //log("[JS]: " + size + " bytes of vbuffer data received from visualizer.\n");

    for (var i = 0; i < size;) {
        var f1 = Module.getValue(base + i, 'float');
        i += 4;
        var f2 = Module.getValue(base + i, 'float');
        i += 4;
        var f3 = Module.getValue(base + i, 'float');
        i += 4;

        g_vbuffer.push(new THREE.Vector3(f1, f2, f3));
    }
}

function renderer_update_faces() {
    g_faces = [];

    var base = g_visualizer.get_faces();
    var size = g_visualizer.get_faces_size();

    //log("[JS]: " + size + " bytes of face data received from visualizer.\n");

    for (var i = 0; i < size;) {
        var i1 = Module.getValue(base + i, 'i32');
        i += 4;
        var i2 = Module.getValue(base + i, 'i32');
        i += 4;
        var i3 = Module.getValue(base + i, 'i32');
        i += 4;
        var i4 = Module.getValue(base + i, 'i32');
        i += 4;

        var nx = Module.getValue(base + i, 'float');
        i += 4;
        var ny = Module.getValue(base + i, 'float');
        i += 4;
        var nz = Module.getValue(base + i, 'float');
        i += 4;

        g_faces.push(new THREE.Face3(i1, i2, i3, new THREE.Vector3(nx, ny, nz)));
        g_faces.push(new THREE.Face3(i3, i4, i1, new THREE.Vector3(nx, ny, nz)));
    }
}

function renderer_update_edges() {
    g_edges = [];

    var base = g_visualizer.get_edges();
    var size = g_visualizer.get_edges_size();

    //log("[JS]: " + size + " bytes of edge data received from visualizer.\n");

    for (var i = 0; i < size;) {
        var i1 = Module.getValue(base + i, 'i32');
        i += 4;
        var i2 = Module.getValue(base + i, 'i32');
        i += 4;

        g_edges.push(g_vbuffer[i1], g_vbuffer[i2]);
    }
}

function renderer_update_view() {
    renderer_update_faces();
    renderer_update_edges();

    if (g_mesh) {
        g_scene.remove(g_mesh);
    }

    if (g_wireframe) {
        g_scene.remove(g_wireframe);
    }

    // Mesh
    var mesh_geometry = new THREE.Geometry();
    mesh_geometry.vertices = g_vbuffer;
    mesh_geometry.faces = g_faces;
    g_mesh = new THREE.Mesh(mesh_geometry, g_mesh_mat);
    g_scene.add(g_mesh);

    // Wireframe
    var wireframe_geometry = new THREE.Geometry();
    wireframe_geometry.vertices = g_edges;
    g_wireframe = new THREE.LineSegments(wireframe_geometry, g_wireframe_mat);
    g_scene.add(g_wireframe);

    // Controls
    var center = g_visualizer.get_center();
    g_controls.target = new THREE.Vector3(center.get_x(), center.get_y(), center.get_z());
}
