"use strict";

var HexaLab = (function () {

    // SETUP

    var default_settings = {
        plane: {
            color: "000000",
            opacity: 0.5,
            offset: 0.5,
            normal: new THREE.Vector3(1, 0, 0),
            show: true,
        },
        object: {
            visible_surface: {
                color: "eeee55",
                show: true,
            },
            visible_wireframe: {
                color: "000000",
                show: true,
            },
            culled_surface: {
                color: "000000",
                opacity: 0.5,
                show: true,
            },
            culled_wireframe: {
                color: "000000",
                opacity: 0.5,
                show: true,
            }
        },
        camera: {
            fov: 60,
            position: new THREE.Vector3(0, 0, 5),
            direction: new THREE.Vector3(0, 0, -1),
        },
        background: "ffffff",
        light: "ffffff",
        ssao: false,
    }

    // PRIVATE

    var scene, camera, light, renderer, controls, backend;
    var canvas = {};
    var render_context = {};

    var object = {
        visible_surface: {
            mesh: new THREE.BufferGeometry(),
            material: new THREE.MeshLambertMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
            }),
        },
        visible_wireframe: {
            mesh: new THREE.BufferGeometry(),
            material: new THREE.MeshBasicMaterial({
            }),
        },
        culled_surface: {
            mesh: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                transparent: true,
                depthWrite: false,
            }),
        },
        culled_wireframe: {
            mesh: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
                transparent: true,
                depthWrite: false,
            }),
        },
    };

    var plane = {
        offset: 0,
        world_offset: 0,
        position: null,
        normal: null,
        mesh: null,
        material: new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    };

    // PUBLIC API

    return {
        load_settings: function (settings) {
            // Renderer
            renderer.setClearColor("#" + settings.background, 1);

            // Camera
            scene.remove(camera);
            camera = new THREE.PerspectiveCamera(settings.camera_fov, canvas.width / canvas.height, 0.1, 1000);
            scene.add(camera);
            camera.position.set(settings.camera.position.x, settings.camera.position.y, settings.camera.position.z);
            var camera_target = new THREE.Vector3().addVectors(settings.camera.position, settings.camera.direction);
            camera.up = new THREE.Vector3(0, 1, 0);
            camera.lookAt(camera_target);
            camera.updateProjectionMatrix();

            // Light
            light = new THREE.PointLight("#" + settings.light);
            camera.add(light);

            // Controls
            if (controls) controls.dispose();
            controls = new THREE.TrackballControls(camera, canvas.container);
            controls.rotateSpeed = 10;
            controls.dynamicDampingFactor = 1;
            controls.noPan = true;
            if (object.center) controls.target = object.center.clone();
            else controls.target = new THREE.Vector3(0, 0, 0);

            // Materials
            object.visible_surface.material.color.set("#" + settings.object.visible_surface.color);
            object.visible_surface.material.visible = settings.object.visible_surface.show;

            object.culled_surface.material.color.set("#" + settings.object.culled_surface.color);
            object.culled_surface.material.opacity = settings.object.culled_surface.opacity;
            object.culled_surface.material.visible = settings.object.culled_surface.show;

            object.visible_wireframe.material.color.set("#" + settings.object.visible_wireframe.color);
            object.visible_wireframe.material.visible = settings.object.visible_wireframe.show;

            object.culled_wireframe.material.color.set("#" + settings.object.culled_wireframe.color);
            object.culled_wireframe.material.opacity = settings.object.culled_wireframe.opacity;
            object.culled_wireframe.material.visible = settings.object.culled_wireframe.show;

            plane.material.color.set("#" + settings.plane.color);
            plane.material.opacity = settings.plane.opacity;
            plane.material.visible = settings.plane.show;

            /*object.visible_surface.material = new THREE.MeshLambertMaterial({
                color: "#" + settings.object.visible_surface.color,
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                visible: settings.object.visible_surface.show,
            });
            object.culled_surface.material = new THREE.MeshBasicMaterial({
                color: "#" + settings.object.culled_surface.color,
                opacity: settings.object.culled_surface.opacity,
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                transparent: true,
                depthWrite: false,
                visible: settings.object.culled_surface.show,
            });
            object.visible_wireframe.material = new THREE.LineBasicMaterial({
                color: "#" + settings.object.visible_wireframe.color,
                visible: settings.object.visible_wireframe.show,
            });
            object.culled_wireframe.material = new THREE.LineBasicMaterial({
                color: "#" + settings.object.culled_wireframe.color,
                opacity: settings.object.culled_wireframe.opacity,
                transparent: true,
                depthWrite: false,
                visible: settings.object.culled_wireframe.show,
            });

            plane.material = new THREE.MeshBasicMaterial({
                color: "#" + settings.plane.color,
                opacity: settings.plane.opacity,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                visible: settings.plane.show,
            });*/

            // Plane state
            HexaLab.set_plane_normal(settings.plane.normal.x, settings.plane.normal.y, settings.plane.normal.z);
            HexaLab.set_plane_offset(settings.plane.offset);

            // Context
            render_context.ssao = settings.ssao;
        },

        get_settings: function () {
            return {
                plane: {
                    color: plane.material.color.getHexString(),
                    opacity: plane.material.opacity,
                    offset: plane.offset,
                    normal: plane.normal.clone(),
                    show: plane.material.visible,
                },
                object: {
                    visible_surface: {
                        color: object.visible_surface.material.color.getHexString(),
                        show: object.visible_surface.material.visible,
                    },
                    visible_wireframe: {
                        color: object.visible_wireframe.material.color.getHexString(),
                        show: object.visible_wireframe.material.visible,
                    },
                    culled_surface: {
                        color: object.culled_surface.material.color.getHexString(),
                        opacity: object.culled_surface.material.opacity,
                        show: object.culled_surface.material.visible,
                    },
                    culled_wireframe: {
                        color: object.culled_wireframe.material.color.getHexString(),
                        opacity: object.culled_wireframe.material.opacity,
                        show: object.culled_wireframe.material.visible,
                    }
                },
                camera: {
                    fov: camera.fov,
                    position: camera.position.clone(),
                    direction: camera.getWorldDirection().clone(),
                },
                background: renderer.getClearColor().getHexString(),
                light: light.color.getHexString(),
                ssao: false,    // TODO
            };
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
            scene.remove(object.visible_surface.mesh);
            var object_geometry = new THREE.BufferGeometry();
            object_geometry.addAttribute('position', new THREE.BufferAttribute(visible_face_pos, 3));
            object_geometry.addAttribute('normal', new THREE.BufferAttribute(visible_face_norm, 3));
            object.visible_surface.mesh = new THREE.Mesh(object_geometry, object.visible_surface.material);
            scene.add(object.visible_surface.mesh);

            // Culled object
            scene.remove(object.culled_surface.mesh);
            var object_cull_geometry = new THREE.BufferGeometry();
            object_cull_geometry.addAttribute('position', new THREE.BufferAttribute(culled_face_pos, 3));
            object_cull_geometry.addAttribute('normal', new THREE.BufferAttribute(culled_face_norm, 3));
            object.culled_surface.mesh = new THREE.Mesh(object_cull_geometry, object.culled_surface.material);
            scene.add(object.culled_surface.mesh);
            
            // Wireframe
            scene.remove(object.visible_wireframe.mesh);
            var wireframe_geometry = new THREE.BufferGeometry();
            wireframe_geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            wireframe_geometry.setIndex(new THREE.BufferAttribute(visible_edge_idx, 1));
            object.visible_wireframe.mesh = new THREE.LineSegments(wireframe_geometry, object.visible_wireframe.material);
            scene.add(object.visible_wireframe.mesh);

            // Culled wireframe
            scene.remove(object.culled_wireframe.mesh);
            var wireframe_cull_geometry = new THREE.BufferGeometry();
            wireframe_cull_geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            wireframe_cull_geometry.setIndex(new THREE.BufferAttribute(culled_edge_idx, 1));
            object.culled_wireframe.mesh = new THREE.LineSegments(wireframe_cull_geometry, object.culled_wireframe.material);
            scene.add(object.culled_wireframe.mesh);

            // Plane
            plane.mesh.position.set(object.center.x, object.center.y, object.center.z);
            var plane_dir = new THREE.Vector3();
            plane_dir.addVectors(plane.mesh.position, plane.normal);
            plane.mesh.lookAt(plane_dir);
            plane.mesh.translateZ(-plane.world_offset);
        },

        set_plane_normal: function (nx, ny, nz) {
            backend.set_plane_normal(nx, ny, nz);
            var plane_norm = backend.get_plane_normal();
            plane.normal = new THREE.Vector3(plane_norm.get_x(), plane_norm.get_y(), plane_norm.get_z());
        },

        set_plane_offset: function (offset) {
            backend.set_plane_offset(offset);
            plane.offset = offset;
            plane.world_offset = backend.get_plane_world_offset();

            var plane_pos = backend.get_plane_position();
            plane.position = new THREE.Vector3(plane_pos.get_x(), plane_pos.get_y(), plane_pos.get_z());
        },

        set_plane_position: function (x, y, z) {
            backend.set_plane_position(x, y, z);
            plane.position = new THREE.Vector3(x, y, z);

            plane.offset = backend.get_plane_offset();
            plane.world_offset = backend.get_plane_world_offset();
        },

        get_state: function() {
            return {
                plane: plane,
                object: object,
            }
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
                plane.mesh = new THREE.Mesh(plane_geometry, plane.material);
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
