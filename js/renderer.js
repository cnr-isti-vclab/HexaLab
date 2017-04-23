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
            offset: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(0, 0, -1),
            distance: 2
        },
        background: "ffffff",
        light: "ffffff",
        ssao: false,
    }

    // PRIVATE

    var scene, camera, light, renderer, controls, backend;
    var canvas = {};
    var current_settings;

    var object = {
        visible_surface: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.MeshLambertMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
            }),
        },
        visible_wireframe: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.MeshBasicMaterial({
            }),
        },
        culled_surface: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                transparent: true,
                depthWrite: false,
            }),
        },
        culled_wireframe: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
                transparent: true,
                depthWrite: false,
            }),
        },
        bad_edges: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
            }),
        }
    };

    var plane = {
        offset: 0,
        world_offset: 0,
        position: null,
        normal: null,
        material: new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    };

    var render_context = {
        ssao: {},
        depth_prepass: {},
        render_pass: {},
        flags: {}
    };

    var reset_camera = function (offset, direction, distance) {
        controls.target = object.center.clone().add(offset);
        var target = new THREE.Vector3().addVectors(object.center, offset);
        camera.position.set(target.x, target.y, target.z);
        camera.up.set(0, 1, 0);
        camera.lookAt(target.add(direction));
        camera.translateZ(object.size * distance);

        pp_setup();
    };

    var pp_setup = function () {
        // Context
        render_context.depth_prepass.material = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            blending: THREE.NoBlending,
        });
        render_context.depth_prepass.render_target = new THREE.WebGLRenderTarget(canvas.width, canvas.height);

        render_context.render_pass.pass = new THREE.RenderPass(scene, camera);

        render_context.ssao.pass = new THREE.ShaderPass(THREE.SSAOShader);
        render_context.ssao.pass.renderToScreen = true;
        render_context.ssao.pass.uniforms["tDepth"].value = render_context.depth_prepass.render_target.texture;
        render_context.ssao.pass.uniforms['size'].value.set(canvas.width, canvas.height);
        render_context.ssao.pass.uniforms['cameraNear'].value = camera.near;
        render_context.ssao.pass.uniforms['cameraFar'].value = camera.far;
        render_context.ssao.pass.uniforms['onlyAO'].value = false;
        render_context.ssao.pass.uniforms['aoClamp'].value = 0.3;
        render_context.ssao.pass.uniforms['lumInfluence'].value = 0.5;

        render_context.composer = new THREE.EffectComposer(renderer);
        render_context.composer.addPass(render_context.render_pass.pass);
        render_context.composer.addPass(render_context.ssao.pass);
    };

    // PUBLIC API

    return {
        load_settings: function (settings) {
            current_settings = settings;

            // Renderer
            renderer.setClearColor("#" + settings.background, 1);

            // Camera
            scene.remove(camera);
            camera = new THREE.PerspectiveCamera(settings.camera_fov, canvas.width / canvas.height, 0.1, 1000);
            scene.add(camera);
            //camera.position.set(settings.camera.position.x, settings.camera.position.y, settings.camera.position.z);

            // Light
            light = new THREE.PointLight("#" + settings.light);
            camera.add(light);

            // Controls
            if (controls) controls.dispose();
            controls = new THREE.TrackballControls(camera, canvas.container);
            controls.rotateSpeed = 10;
            controls.dynamicDampingFactor = 1;

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

            object.bad_edges.material.vertexColors = THREE.VertexColors;

            plane.material.color.set("#" + settings.plane.color);
            plane.material.opacity = settings.plane.opacity;
            plane.material.visible = settings.plane.show;

            // Plane state
            HexaLab.set_plane_normal(settings.plane.normal.x, settings.plane.normal.y, settings.plane.normal.z);
            HexaLab.set_plane_offset(settings.plane.offset);

            // Context
            render_context.flags.ssao = settings.ssao;

            if (object.center) reset_camera(current_settings.camera.offset, current_settings.camera.direction, current_settings.camera.distance);
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
                    offset: new THREE.Vector3().subVectors(controls.target, object.center),
                    direction: camera.getWorldDirection(),
                    distance: camera.position.distanceTo(object.center) / object.size,
                },
                background: renderer.getClearColor().getHexString(),
                light: light.color.getHexString(),
                ssao: render_context.flags.ssao,
            };
        },

        on_resize: function () {
            canvas.width = document.getElementById('frame').offsetWidth;
            canvas.height = document.getElementById('frame').offsetHeight;
            renderer.setSize(canvas.width, canvas.height);
            camera.aspect = canvas.width / canvas.height;
            camera.updateProjectionMatrix();
            log("Frame resized to " + canvas.width + "x" + canvas.height);
        },

        init: function () {
            // Scene
            scene = new THREE.Scene();
            canvas.width = document.getElementById('frame').offsetWidth;
            canvas.height = document.getElementById('frame').offsetHeight;

            // Backend interface
            backend = new Module.Visualizer();

            // Renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: true,
            });
            renderer.setSize(canvas.width, canvas.height);
            canvas.container = document.getElementById("frame");
            canvas.container.appendChild(renderer.domElement);

            // Settings
            HexaLab.load_settings(default_settings);

            // Resize event
            window.addEventListener('resize', HexaLab.on_resize());
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
            var bad_edge_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_bad_edge_pos(), backend.get_bad_edge_count() * 2 * 3);
            var bad_edge_color = new Float32Array(Module.HEAPU8.buffer, backend.get_bad_edge_color(), backend.get_bad_edge_count() * 2 * 3);

            // Object
            scene.remove(object.visible_surface.mesh);
            object.visible_surface.geometry.addAttribute('position', new THREE.BufferAttribute(visible_face_pos, 3));   // Old attributes are automatically overwritten
            object.visible_surface.geometry.addAttribute('normal', new THREE.BufferAttribute(visible_face_norm, 3));
            object.visible_surface.mesh = new THREE.Mesh(object.visible_surface.geometry, object.visible_surface.material);
            scene.add(object.visible_surface.mesh);

            // Culled object
            scene.remove(object.culled_surface.mesh);
            object.culled_surface.geometry.addAttribute('position', new THREE.BufferAttribute(culled_face_pos, 3));
            object.culled_surface.geometry.addAttribute('normal', new THREE.BufferAttribute(culled_face_norm, 3));
            object.culled_surface.mesh = new THREE.Mesh(object.culled_surface.geometry, object.culled_surface.material);
            scene.add(object.culled_surface.mesh);
            
            // Wireframe
            scene.remove(object.visible_wireframe.mesh);
            object.visible_wireframe.geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            object.visible_wireframe.geometry.setIndex(new THREE.BufferAttribute(visible_edge_idx, 1));
            object.visible_wireframe.mesh = new THREE.LineSegments(object.visible_wireframe.geometry, object.visible_wireframe.material);
            scene.add(object.visible_wireframe.mesh);

            // Culled wireframe
            scene.remove(object.culled_wireframe.mesh);
            object.culled_wireframe.geometry.addAttribute('position', new THREE.BufferAttribute(vert_pos, 3));
            object.culled_wireframe.geometry.setIndex(new THREE.BufferAttribute(culled_edge_idx, 1));
            object.culled_wireframe.mesh = new THREE.LineSegments(object.culled_wireframe.geometry, object.culled_wireframe.material);
            scene.add(object.culled_wireframe.mesh);

            // Bad edges
            scene.remove(object.bad_edges.mesh);
            object.bad_edges.geometry.addAttribute('position', new THREE.BufferAttribute(bad_edge_pos, 3));
            object.bad_edges.geometry.addAttribute('color', new THREE.BufferAttribute(bad_edge_color, 3));
            object.bad_edges.mesh = new THREE.LineSegments(object.bad_edges.geometry, object.bad_edges.material);
            scene.add(object.bad_edges.mesh);

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
                render_context: render_context,
            }
        },

        import_mesh: function (path) {
            var result = backend.import_mesh(path);
            if (result) {
                // Object info
                var obj_center = backend.get_object_center();
                object.center = new THREE.Vector3(obj_center.get_x(), obj_center.get_y(), obj_center.get_z());
                object.size = backend.get_object_size();

                // Plane
                scene.remove(plane.mesh);
                var plane_geometry = new THREE.PlaneGeometry(object.size, object.size);
                plane.mesh = new THREE.Mesh(plane_geometry, plane.material);
                scene.add(plane.mesh);

                reset_camera(current_settings.camera.offset, current_settings.camera.direction, current_settings.camera.distance);
            }
            return result;
        },

        animate: function () {
            controls.update();

            if (render_context.composer && render_context.flags.ssao) {
                scene.overrideMaterial = render_context.depth_prepass.material;
                renderer.render(scene, camera, render_context.depth_prepass.render_target, true);
                scene.overrideMaterial = null;
                render_context.composer.render();
            } else {
                renderer.render(scene, camera);
            }

            requestAnimationFrame(HexaLab.animate);
        },
    }
})();
