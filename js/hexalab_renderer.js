"use strict";

// ------------------------------------------------------------------------------------------------------
// Globals
// ------------------------------------------------------------------------------------------------------
var g_scene, g_camera, g_renderer, g_controls, g_render_item, g_mesh, g_plane;

// ------------------------------------------------------------------------------------------------------
// Init
// ------------------------------------------------------------------------------------------------------
function renderer_init() {
    g_scene = new THREE.Scene();
    var width = window.innerWidth;
    var height = window.innerHeight;

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
    g_scene.add(light);

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
// ------------------------------------------------------------------------------------------------------
// Rendering
// ------------------------------------------------------------------------------------------------------
function renderer_render() {
    g_renderer.render(g_scene, g_camera);
}

function renderer_animate() {
    g_controls.update();
    renderer_render();
    requestAnimationFrame(renderer_animate);
}
// ------------------------------------------------------------------------------------------------------
// Mesh
// ------------------------------------------------------------------------------------------------------
function renderer_set_mesh(HLmesh) {
    if (g_mesh) { log("FREE\n"); g_mesh.delete(); }
    g_mesh = HLmesh

    g_plane = new Module.Plane();
    
    renderer_update_plane(1, 0, 0, 0.5);
    renderer_update_mesh();
}

function renderer_update_plane(nx, ny, nz, s) {
    g_plane.orient(nx, ny, nz);
    var center_x = g_mesh.get_center_x();
    var center_y = g_mesh.get_center_y();
    var center_z = g_mesh.get_center_z();
    var d = g_mesh.get_diagonal_size();
    var x = center_x + nx*(s*d - d/2);
    var y = center_y + ny*(s*d - d/2)
    var z = center_z + nz*(s*d - d/2);
    g_plane.move(x, y, z);
}

function renderer_update_mesh() {
    // remove current renderable
    g_scene.remove(g_render_item);

    // build an updated index buffer
    g_mesh.make_ibuffer(g_plane);

    // build a new render item
    var vertices_base = g_mesh.get_vbuffer();
    var vertices_size = g_mesh.get_vertices_count() * 4 * 3;
    var indices_base = g_mesh.get_ibuffer();
    var indices_size = g_mesh.get_indices_count() * 4;

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

    var material = new THREE.MeshLambertMaterial({ color: 0xeeccee, wireframe : true /*,side : THREE.DoubleSide*/ });
    g_render_item = new THREE.Mesh(geometry, material);

    // add the new render item to the scene
    g_scene.add(g_render_item);
}
