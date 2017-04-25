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
                opacity: 1,
                show: true,
            },
            visible_wireframe: {
                color: "000000",
                opacity: 1,
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
            },
            singularity_edges: {
                opacity: 0.5,
                show: true,
            },
            bad_hexa_mode: {
                enabled: false,
                threshold: 0.3,
            },
            occlusion: false,
            quality: false,
        },
        camera: {
            fov: 60,
            offset: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(0, 0, -1),
            distance: 2
        },
        background: "ffffff",
        light: "ffffff",
    }

    // PRIVATE

    var scene, camera, light, renderer, controls, backend;
    var canvas = {};
    var settings = {};

    var object = {
        visible_surface: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.MeshLambertMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                vertexColors: THREE.VertexColors,
                //transparent: true,
            }),
        },
        visible_wireframe: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.MeshBasicMaterial({
                transparent: true,
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
        singularity_edges: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.LineBasicMaterial({
                vertexColors: THREE.VertexColors,
                transparent: true,
            }),
        },
        center: new THREE.Vector3(0, 0, 0),
        size: 0,
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

    var reset_camera = function (fov, offset, direction, distance, light_color) {
        scene.remove(camera);
        //camera.remove(light);
        camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
        scene.add(camera);

        light.color.set(light_color);
        camera.add(light);

        if (controls) controls.dispose();
        controls = new THREE.TrackballControls(camera, canvas.container);
        controls.rotateSpeed = 10;
        controls.dynamicDampingFactor = 1;

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
        load_settings: function (new_settings) {
            reset_camera(new_settings.camera.fov, new_settings.camera.offset, new_settings.camera.direction, new_settings.camera.distance, "#" + new_settings.light);

            HexaLab.set_background_color("#" + new_settings.background);

            HexaLab.set_mesh_color("#" + new_settings.object.visible_surface.color);
            HexaLab.set_mesh_opacity(new_settings.object.visible_surface.opacity);
            HexaLab.show_mesh(new_settings.object.visible_surface.show);

            HexaLab.set_culled_mesh_color("#" + new_settings.object.culled_surface.color);
            HexaLab.set_culled_mesh_opacity(new_settings.object.culled_surface.opacity);
            HexaLab.show_culled_mesh(new_settings.object.culled_surface.show);

            HexaLab.set_wireframe_color("#" + new_settings.object.visible_wireframe.color);
            HexaLab.set_wireframe_opacity(new_settings.object.visible_wireframe.opacity);
            HexaLab.show_wireframe(new_settings.object.visible_wireframe.show);

            HexaLab.set_culled_wireframe_color("#" + new_settings.object.culled_wireframe.color);
            HexaLab.set_culled_wireframe_opacity(new_settings.object.culled_wireframe.opacity);
            HexaLab.show_culled_wireframe(new_settings.object.culled_wireframe.show);

            HexaLab.set_singularity_edges_opacity(new_settings.object.singularity_edges.opacity);
            HexaLab.show_singularity_edges(new_settings.object.singularity_edges.show);

            HexaLab.set_plane_color("#" + new_settings.plane.color);
            HexaLab.set_plane_opacity(new_settings.plane.opacity);
            HexaLab.show_plane(new_settings.plane.show);
            HexaLab.set_plane_normal(new_settings.plane.normal.x, new_settings.plane.normal.y, new_settings.plane.normal.z);
            HexaLab.set_plane_offset(new_settings.plane.offset);

            HexaLab.show_mesh_occlusion(new_settings.object.occlusion);
            HexaLab.show_mesh_quality(new_settings.object.quality);
            HexaLab.show_bad_hexas_only(new_settings.object.bad_hexa_mode.enabled);
            HexaLab.set_bad_hexa_threshold(new_settings.object.bad_hexa_mode.threshold);
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

        get_state: function() {
            return {
                object,
                plane,
                settings
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

            // Light
            light = new THREE.PointLight();

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
            backend.update_dynamic_buffers();

            var vert_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_vert_pos(), backend.get_vert_count() * 3);
            var visible_face_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_visible_face_pos(), backend.get_visible_face_count() * 3 * 3);
            var visible_face_norm = new Float32Array(Module.HEAPU8.buffer, backend.get_visible_face_norm(), backend.get_visible_face_count() * 3 * 3);
            var visible_face_color = new Float32Array(Module.HEAPU8.buffer, backend.get_visible_face_color(), backend.get_visible_face_count() * 3 * 3);
            var culled_face_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_culled_face_pos(), backend.get_culled_face_count() * 3 * 3);
            var culled_face_norm = new Float32Array(Module.HEAPU8.buffer, backend.get_culled_face_norm(), backend.get_culled_face_count() * 3 * 3);
            var visible_edge_idx = new Uint16Array(Module.HEAPU8.buffer, backend.get_visible_edge_idx(), backend.get_visible_edge_count() * 2);
            var culled_edge_idx = new Uint16Array(Module.HEAPU8.buffer, backend.get_culled_edge_idx(), backend.get_culled_edge_count() * 2);
            var bad_edge_pos = new Float32Array(Module.HEAPU8.buffer, backend.get_bad_edge_pos(), backend.get_bad_edge_count() * 2 * 3);
            var bad_edge_color = new Float32Array(Module.HEAPU8.buffer, backend.get_bad_edge_color(), backend.get_bad_edge_count() * 2 * 3);


            // Object
            scene.remove(object.visible_surface.mesh);
            object.visible_surface.geometry.addAttribute('position', new THREE.BufferAttribute(visible_face_pos, 3));
            object.visible_surface.geometry.addAttribute('normal', new THREE.BufferAttribute(visible_face_norm, 3));
            object.visible_surface.geometry.addAttribute('color', new THREE.BufferAttribute(visible_face_color, 3));
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

            // Singularity edges
            scene.remove(object.singularity_edges.mesh);
            object.singularity_edges.geometry.addAttribute('position', new THREE.BufferAttribute(bad_edge_pos, 3));
            object.singularity_edges.geometry.addAttribute('color', new THREE.BufferAttribute(bad_edge_color, 3));
            object.singularity_edges.mesh = new THREE.LineSegments(object.singularity_edges.geometry, object.singularity_edges.material);
            scene.add(object.singularity_edges.mesh);

            // Plane
            plane.mesh.position.set(object.center.x, object.center.y, object.center.z);
            var plane_dir = new THREE.Vector3();
            plane_dir.addVectors(plane.mesh.position, plane.normal);
            plane.mesh.lookAt(plane_dir);
            plane.mesh.translateZ(-plane.world_offset);
        },

        // Materials
        set_mesh_color: function (color) {
            object.visible_surface.material.color.set(color);
            settings.mesh_color = color;
        },

        set_mesh_opacity: function (opacity) {
            object.visible_surface.material.opacity = opacity;
        },

        set_wireframe_color: function (color) {
            object.visible_wireframe.material.color.set(color);
        },

        set_wireframe_opacity: function (opacity) {
            object.visible_wireframe.material.opacity = opacity;
        },

        set_culled_mesh_color: function (color) {
            object.culled_surface.material.color.set(color);
        },

        set_culled_mesh_opacity: function (opacity) {
            object.culled_surface.material.opacity = opacity;
        },

        set_culled_wireframe_color: function (color) {
            object.culled_wireframe.material.color.set(color);
        },

        set_culled_wireframe_opacity: function (opacity) {
            object.culled_wireframe.material.opacity = opacity;
        },

        set_plane_color: function (color) {
            plane.material.color.set(color);
        },

        set_plane_opacity: function (opacity) {
            plane.material.opacity = opacity;
        },

        set_singularity_edges_opacity: function (opacity) {
            object.singularity_edges.material.opacity = opacity;
        },

        // Flags

        show_plane: function (show) {
            plane.material.visible = show;
        },

        show_mesh: function (show) {
            object.visible_surface.material.visible = show;
        },

        show_wireframe: function (show) {
            object.visible_wireframe.material.visible = show;
        },

        show_culled_mesh: function (show) {
            object.culled_surface.material.visible = show;
        },

        show_culled_wireframe: function (show) {
            object.culled_wireframe.material.visible = show;
        },

        show_singularity_edges: function (show) {
            object.singularity_edges.material.visible = show;
        },

        show_mesh_quality: function (show) {
            settings.show_mesh_quality = show;
            if (show) {
                object.visible_surface.material.vertexColors = THREE.VertexColors;
                object.visible_surface.material.color.set(0xffffff);
                object.visible_surface.material.needsUpdate = true;
            } else {
                object.visible_surface.material.vertexColors = THREE.NoColors;
                object.visible_surface.material.color.set(settings.mesh_color);
                object.visible_surface.material.needsUpdate = true;
            }
        },

        show_mesh_occlusion: function (show) {
            settings.show_mesh_occlusion = show;
        },

        show_bad_hexas_only: function (show) {
            settings.show_bad_hexas_only = show;
        },

        // General settings

        set_background_color: function (color) {
            renderer.setClearColor(color, 1);
        },

        set_light_color: function (color) {
            light.color.set(color);
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

        set_bad_hexa_threshold: function (threshold) {
            settings.bad_hexa_threshold = threshold;
        },

        // Import

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

               reset_camera(default_settings.camera.fov, default_settings.camera.offset, default_settings.camera.direction, default_settings.camera.distance, default_settings.light);
            }
            return result;
        },

        // Animate

        animate: function () {
            controls.update();

            if (render_context.composer && settings.show_mesh_occlusion) {
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
