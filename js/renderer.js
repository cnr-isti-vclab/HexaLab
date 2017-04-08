"use strict";

var HexaLab = (function () {

    // Members

    var scene, camera, renderer, controls, plane, visualizer;
    var mesh, wireframe;
    var mesh_mat, wireframe_mat;
    var vbuffer, faces, edges;
    var depth_mat, depth_target, composer;

    // Private functions

    var update_faces = function () {
        faces = [];

        var base = visualizer.get_faces();
        var size = visualizer.get_faces_size();

        log("[JS]: " + size + " bytes of face data received from visualizer.\n");

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

            faces.push(new THREE.Face3(i1, i2, i3, new THREE.Vector3(nx, ny, nz)));
            faces.push(new THREE.Face3(i3, i4, i1, new THREE.Vector3(nx, ny, nz)));
        }
    };

    var update_edges = function () {
        edges = [];

        var base = visualizer.get_edges();
        var size = visualizer.get_edges_size();

        log("[JS]: " + size + " bytes of edge data received from visualizer.\n");

        for (var i = 0; i < size;) {
            var i1 = Module.getValue(base + i, 'i32');
            i += 4;
            var i2 = Module.getValue(base + i, 'i32');
            i += 4;

            edges.push(vbuffer[i1], vbuffer[i2]);
        }
    };

    var update_vbuffer = function () {
        vbuffer = [];

        var base = visualizer.get_vbuffer();
        var size = visualizer.get_vbuffer_size();

        log("[JS]: " + size + " bytes of vbuffer data received from visualizer.\n");

        for (var i = 0; i < size;) {
            var f1 = Module.getValue(base + i, 'float');
            i += 4;
            var f2 = Module.getValue(base + i, 'float');
            i += 4;
            var f3 = Module.getValue(base + i, 'float');
            i += 4;

            vbuffer.push(new THREE.Vector3(f1, f2, f3));
        }
    };

    // Public API

    return {
        init: function () {
            // Scene
            scene = new THREE.Scene();
            var width = window.innerWidth;
            var height = window.innerHeight;

            // Visualizer interface
            visualizer = new Module.Visualizer();

            // Renderer
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(width, height);
            var container = document.getElementById("frame");
            container.appendChild(renderer.domElement);

            // Camera
            camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
            camera.position.set(0, 0, 5);
            scene.add(camera);

            // Light
            var light = new THREE.PointLight(0xffffff, 1, 100);
            camera.add(light);

            // Controls
            controls = new THREE.TrackballControls(camera, container);
            controls.rotateSpeed = 10;
            controls.dynamicDampingFactor = 1;

            // Background
            var background_color = new THREE.Color(1, 1, 1);
            renderer.setClearColor(background_color, 1);

            // Materials
            mesh_mat = new THREE.MeshLambertMaterial({ color: 0xeeee55, polygonOffset: true, polygonOffsetFactor: 0.5, });
            wireframe_mat = new THREE.LineBasicMaterial({ color: 0x000000 })

            // Render pass
            var render_pass = new THREE.RenderPass(scene, camera);

            // Depth pass
            depth_mat = new THREE.MeshDepthMaterial();
            depth_mat.depthPacking = THREE.RGBADepthPacking;
            depth_mat.blending = THREE.NoBlending;
            depth_target = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });

            // SSAO pass
            var ssao_pass = new THREE.ShaderPass(THREE.SSAOShader);
            ssao_pass.renderToScreen = true;
            ssao_pass.uniforms['tDepth'].value = depth_target.texture;
            ssao_pass.uniforms['size'].value.set(width, height);
            ssao_pass.uniforms['cameraNear'].value = camera.near;
            ssao_pass.uniforms['cameraFar'].value = camera.far;
            ssao_pass.uniforms['onlyAO'].value = false;
            ssao_pass.uniforms['lumInfluence'].value = 0.0;

            // Pass composer
            composer = new THREE.EffectComposer(renderer);
            composer.addPass(render_pass);
            composer.addPass(ssao_pass);

            // Resize event
            window.addEventListener('resize', function () {
                var width = window.innerWidth;
                var height = window.innerHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            });
        },

        update_view: function () {
            update_faces();
            update_edges();

            if (mesh) {
                scene.remove(mesh);
            }

            if (wireframe) {
                scene.remove(wireframe);
            }

            // Mesh
            var mesh_geometry = new THREE.Geometry();
            mesh_geometry.vertices = vbuffer;
            mesh_geometry.faces = faces;
            mesh = new THREE.Mesh(mesh_geometry, mesh_mat);
            scene.add(mesh);

            // Wireframe
            var wireframe_geometry = new THREE.Geometry();
            wireframe_geometry.vertices = edges;
            wireframe = new THREE.LineSegments(wireframe_geometry, wireframe_mat);
            scene.add(wireframe);

            // Controls
            var center = visualizer.get_center();
            controls.target = new THREE.Vector3(center.get_x(), center.get_y(), center.get_z());
        },

        import_mesh: function(path) {
            var result = visualizer.import_mesh(path);
            if (result) {
                update_vbuffer();
                HexaLab.update_view();
            }
            return result;
        },

        set_culling_plane: function(nx, ny, nz, s) {
            if (mesh) {
                visualizer.set_culling_plane(nx, ny, nz, s);
                visualizer.update_view();
                HexaLab.update_view();
            }
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
