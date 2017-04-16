"use strict";

var HexaLab = (function () {

    // Private

    var scene, camera, light, renderer, controls, backend;
    var object = {}, wireframe = {}, plane = {};
    var draw_flags = {};
    var canvas = {};

    var default_settings = {
        clear_color: "ffffff",
        light_color: "ffffff",

        mesh_color: "eeee55",
        mesh_cull_color: "000000",
        mesh_cull_opacity: 0.5,
        wireframe_color: "000000",

        plane_color: "000000",
        plane_opacity: 0.5,
        plane_offset: 0.5,
        plane_normal: new THREE.Vector3(1, 0, 0),

        camera_fov: 60,
        camera_position: new THREE.Vector3(0, 0, 5),
        camera_direction: new THREE.Vector3(0, 0, -1),

        draw_culled_mesh: true,
        draw_culling_plane: true,
        draw_wireframe: true,
        ssao: false,
    };

    // Public API

    return {
        load_settings: function (settings) {
            renderer.setClearColor("#" + settings.clear_color, 1);

            scene.remove(camera);
            camera = new THREE.PerspectiveCamera(settings.camera_fov, canvas.width / canvas.height, 0.1, 1000);
            scene.add(camera);
            camera.position.set(settings.camera_position.x, settings.camera_position.y, settings.camera_position.z);
            var camera_target = new THREE.Vector3();
            camera_target.addVectors(settings.camera_position, settings.camera_direction);
            camera.up = new THREE.Vector3(0, 1, 0);
            camera.lookAt(camera_target);
            camera.updateProjectionMatrix();

            light = new THREE.PointLight("#" + settings.light_color);
            camera.add(light);

            if(controls) controls.dispose();
            controls = new THREE.TrackballControls(camera, canvas.container);
            controls.rotateSpeed = 10;
            controls.dynamicDampingFactor = 1;
            controls.noPan = true;
            if (object.center) controls.target = object.center.clone();
            else controls.target = new THREE.Vector3(0, 0, 0);

            object.mat = new THREE.MeshLambertMaterial({ color: "#" + settings.mesh_color, polygonOffset: true, polygonOffsetFactor: 0.5 });
            object.cull_mat = new THREE.MeshBasicMaterial({ color: "#" + settings.mesh_cull_color, opacity: settings.mesh_cull_opacity, polygonOffset: true, polygonOffsetFactor: 0.5, transparent: true, depthWrite: false });
            plane.mat = new THREE.MeshBasicMaterial({ color: "#" + settings.plane_color, opacity: settings.plane_opacity, transparent: true, side: THREE.DoubleSide, depthWrite: false });
            wireframe.mat = new THREE.LineBasicMaterial({ color: "#" + settings.wireframe_color });
            wireframe.cull_mat = new THREE.LineBasicMaterial({ color: "#" + settings.wireframe_color });

            HexaLab.set_culling_plane(settings.plane_normal.x, settings.plane_normal.y, settings.plane_normal.z, settings.plane_offset);

            draw_flags.culled_mesh = settings.draw_culled_mesh;
            draw_flags.plane = settings.draw_culling_plane;
            draw_flags.wireframe = settings.draw_wireframe;
            draw_flags.ssao = settings.ssao;
        },

        get_settings: function() {
            var settings = {
                clear_color: renderer.getClearColor().getHexString(),
                light_color: light.color.getHexString(),
                mesh_color: object.mat.color.getHexString(),
                mesh_cull_color: object.cull_mat.color.getHexString(),
                mesh_cull_opacity: object.cull_mat.opacity,
                wireframe_color: wireframe.mat.color.getHexString(),
                plane_color: plane.mat.color.getHexString(),
                plane_opacity: plane.mat.opacity,
                plane_offset: plane.s,
                plane_normal: plane.normal,
                camera_position: camera.position,
                camera_direction: camera.getWorldDirection(),
                camera_fov: camera.fov,
                draw_culled_mesh: draw_flags.culled_mesh,
                draw_culling_plane: draw_flags.plane,
                draw_wireframe: draw_flags.wireframe,
                ssao: draw_flags.ssao,
            };
            return settings;
        },

        init: function () {
            // Scene
            scene = new THREE.Scene();
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Backend interface
            backend = new Module.Visualizer();

            // Renderer
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(canvas.width, canvas.height);
            canvas.container = document.getElementById("frame");
            canvas.container.appendChild(renderer.domElement);

            // Settings
            HexaLab.load_settings(default_settings);

            // Resize event
            window.addEventListener('resize', function () {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                renderer.setSize(canvas.width, canvas.height);
                camera.aspect = canvas.width / canvas.height;
                camera.updateProjectionMatrix();
            });
        },

        update_scene: function () {
            backend.update_components();

            var vert_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_vert_pos(), backend.get_vert_count() * 3);
            var visible_face_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_visible_face_pos(), backend.get_visible_face_count() * 3 * 3);
            var visible_face_norm = new Float32Array(Module.HEAPU8.buffer, backend.get_visible_face_norm(), backend.get_visible_face_count() * 3 * 3);
            var culled_face_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_culled_face_pos(), backend.get_culled_face_count() * 3 * 3);
            var culled_face_norm = new Float32Array(Module.HEAPU8.buffer, backend.get_culled_face_norm(), backend.get_culled_face_count() * 3 * 3);
            var visible_edge_idx = new Uint16Array(Module.HEAPU8.buffer, backend.get_visible_edge_idx(), backend.get_visible_edge_count() * 2);
            var culled_edge_idx = new Uint16Array(Module.HEAPU8.buffer, backend.get_culled_edge_idx(), backend.get_culled_edge_count() * 2);

            // Object
            scene.remove(object.mesh);
            var object_geometry = new THREE.BufferGeometry();
            object_geometry.addAttribute('position', new THREE.BufferAttribute(visible_face_pos, 3));
            object_geometry.addAttribute('normal', new THREE.BufferAttribute(visible_face_norm, 3));
            object.mesh = new THREE.Mesh(object_geometry, object.mat);
            scene.add(object.mesh);

            // Culled object
            scene.remove(object.cull_mesh);
            var object_cull_geometry = new THREE.BufferGeometry();
            object_cull_geometry.addAttribute('position', new THREE.BufferAttribute(culled_face_pos, 3));
            object_cull_geometry.addAttribute('normal', new THREE.BufferAttribute(culled_face_norm, 3));
            object.cull_mesh = new THREE.Mesh(object_cull_geometry, object.cull_mat);
            scene.add(object.cull_mesh);
            
            // Wireframe
            scene.remove(wireframe.mesh);
            var wireframe_geometry = new THREE.BufferGeometry();
            wireframe_geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            wireframe_geometry.setIndex(new THREE.BufferAttribute(visible_edge_idx, 1));
            wireframe.mesh = new THREE.LineSegments(wireframe_geometry, wireframe.mat);
            scene.add(wireframe.mesh);

            // Culled wireframe
            scene.remove(wireframe.cull_mesh);
            var wireframe_cull_geometry = new THREE.BufferGeometry();
            wireframe_cull_geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            wireframe_cull_geometry.setIndex(new THREE.BufferAttribute(culled_edge_idx, 1));
            wireframe.cull_mesh = new THREE.LineSegments(wireframe_cull_geometry, wireframe.cull_mat);
            scene.add(wireframe.cull_mesh);

            // Plane
            plane.mesh.position.set(object.center.x, object.center.y, object.center.z);
            var plane_dir = new THREE.Vector3();
            plane_dir.addVectors(plane.mesh.position, plane.normal);
            plane.mesh.lookAt(plane_dir);
            plane.mesh.translateZ(-plane.world_offset);
        },

        set_culling_plane: function (nx, ny, nz, s) {
            backend.set_culling_plane(nx, ny, nz, s);
            var plane_norm = backend.get_plane_normal();
            plane.normal = new THREE.Vector3(plane_norm.get_x(), plane_norm.get_y(), plane_norm.get_z());
            plane.s = s;
            plane.world_offset = backend.get_plane_offset();
        },

        get_culling_plane: function() {
            var plane_state = {
                nx: plane.normal.x,
                ny: plane.normal.y,
                nz: plane.normal.z,
                s: plane.normal.s,
            };
            return plane_state;
        },

        import_mesh: function (path) {
            var result = backend.import_mesh(path);
            if (result) {

                // VBuffer

                // Object info
                var obj_center = backend.get_object_center();
                object.center = new THREE.Vector3(obj_center.get_x(), obj_center.get_y(), obj_center.get_z());
                object.size = backend.get_object_size();

                // Plane
                scene.remove(plane.mesh);
                var plane_geometry = new THREE.PlaneGeometry(object.size, object.size);
                plane.mesh = new THREE.Mesh(plane_geometry, plane.mat);
                scene.add(plane.mesh);

                // Controls
                controls.target = object.center.clone();
            }
            return result;
        },

        animate: function () {
            controls.update();

            renderer.render(scene, camera);
            //g_scene.overrideMaterial = g_depth_mat;
            //g_renderer.render(g_scene, g_camera, g_depth_target, true);
            //g_scene.overrideMaterial = null;
            //g_composer.render();

            requestAnimationFrame(HexaLab.animate);
        },
    }
})();
