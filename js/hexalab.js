"use strict";

//var HexaLab = {}
HexaLab.filters = [];

// --------------------------------------------------------------------------------
// Model
// --------------------------------------------------------------------------------
// Maps straight to a cpp model class. Pass the cpp model instance and the
// three.js materials for both surface and wframe as parameters.
// Update fetches the new buffers from the model backend.

HexaLab.Model = function (buffers_backend, surface_material, wireframe_material) {
    this.surface = {
        geometry: new THREE.BufferGeometry(),
        material: surface_material,
    }
    this.wireframe = {
        geometry: new THREE.BufferGeometry(),
        material: wireframe_material,
    }
    this.backend = buffers_backend;
}

Object.assign(HexaLab.Model.prototype, {
    update: function () {
        this.surface.geometry.removeAttribute('position');
        if (this.backend.surface_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_pos().data(), this.backend.surface_pos().size() * 3);
            this.surface.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.surface.geometry.removeAttribute('normal');
        if (this.backend.surface_norm().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_norm().data(), this.backend.surface_norm().size() * 3);
            this.surface.geometry.addAttribute('normal', new THREE.BufferAttribute(buffer, 3));
        }
        this.surface.geometry.removeAttribute('color');
        if (this.backend.surface_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_color().data(), this.backend.surface_color().size() * 3);
            this.surface.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }

        this.wireframe.geometry.removeAttribute('position');
        if (this.backend.wireframe_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_pos().data(), this.backend.wireframe_pos().size() * 3);
            this.wireframe.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.wireframe.geometry.removeAttribute('color');
        if (this.backend.wireframe_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_color().data(), this.backend.wireframe_color().size() * 3);
            this.wireframe.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }
    },
})

// --------------------------------------------------------------------------------
// Filter Interface
// --------------------------------------------------------------------------------

HexaLab.Filter = function (filter_backend, name) {
    this.backend = filter_backend;
    this.name = name;
    this.scene = {
        objects: [],
        add: function (obj) {
            this.objects.push(obj);
        },
        remove: function (obj) {
            var i = this.objects.indexOf(obj);
            if (i != -1) {
                this.objects.splice(i, 1);
            }
        }
    };
};

Object.assign(HexaLab.Filter.prototype, {
    // Implementation Api

    on_mesh_change: function (mesh) {
        console.warn('Function "on_mesh_change" not implemented for filter ' + this.name + '.');
    },

    set_settings: function (settings) {
        console.warn('Function "set_settings" not implemented for filter ' + this.name + '.');
    },

    get_settings: function () {
        console.warn('Function "get_settings" not implemented for filter ' + this.name + '.');
    },

    sync: function () {
        console.warn('Function "sync" not implemented for filter ' + this.name + '.');
    },
});

// --------------------------------------------------------------------------------
// Renderer
// --------------------------------------------------------------------------------

HexaLab.Renderer = function (width, height) {
    this.settings = {
        ssao: false,
        msaa: true,
        clear_color: 0xffffff
    };

    this.width = width;
    this.height = height;
    this.aspect = width / height;

    this.init_backend();

    this.gizmo = function (size) {
        var obj = new THREE.Object3D();
        obj.position.set(0, 0, 0);

        var origin = new THREE.Vector3(0, 0, 0);
        var arrows = {
            x: new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, size, 0xff0000),
            y: new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, size, 0x00ff00),
            z: new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, size, 0x0000ff),
        }

        obj.add(arrows.x);
        obj.add(arrows.y);
        obj.add(arrows.z);

        return obj;
    }(1);

    this.hud_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    this.hud_camera.position.set(0, 0, 0);

    this.scene = new THREE.Scene();

    this.camera_light = new THREE.PointLight(); // TODO ? should be directional
    this.camera_light.position.set(0, 0, 0);
    this.ambient = new THREE.AmbientLight();

    // RENDER PASSES/MATERIALS SETUP

    // Used for silhouette drawing
    this.alpha_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.AlphaPass.vertexShader,
            fragmentShader: THREE.AlphaPass.fragmentShader,
            uniforms: {
                uAlpha: { value: 1.0 }
            },
        }),
    }

    // SSAO passes setup
    this.ortho_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fullscreen_quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);

    var num_samples = 16;
    var kernel = new Float32Array(num_samples * 3);
    var n = new THREE.Vector3(0, 0, 1);
    for (var i = 0; i < num_samples * 3; i += 3) {
        var v;
        do {
            v = new THREE.Vector3(
                Math.random() * 2.0 - 1.0,
                Math.random() * 2.0 - 1.0,
                Math.random()
            ).normalize();
        } while(v.dot(n) < 0.15);
        var scale = i / (num_samples * 3);
        scale = 0.1 + scale * scale * 0.9;
        kernel[i + 0] = v.x * scale;
        kernel[i + 1] = v.y * scale;
        kernel[i + 2] = v.z * scale;
    }
    var noise_size = 4;
    var noise = new Float32Array(noise_size * noise_size * 3);
    for (var i = 0; i < noise_size * noise_size * 3; i += 3) {
        var v = new THREE.Vector3(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            0
        ).normalize();
        noise[i + 0] = v.x;
        noise[i + 1] = v.y;
        noise[i + 2] = v.z;
    }
    var noise_tex = new THREE.DataTexture(noise, noise_size, noise_size, THREE.RGBFormat, THREE.FloatType,
        THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter);
    noise_tex.needsUpdate = true;

    // Render depth and normals on an off texture
    this.normal_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.SSAOPre.vertexShader,
            fragmentShader: THREE.SSAOPre.fragmentShader,
            uniforms: {
            },
        }),
        target: new THREE.WebGLRenderTarget(width, height, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: true,
        })
    }
    this.normal_pass.target.texture.generateMipmaps = false;
    this.normal_pass.target.depthTexture = new THREE.DepthTexture();
    this.normal_pass.target.depthTexture.type = THREE.UnsignedShortType;

    this.depth_pass = {
        material: new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking
        }),
        target: new THREE.WebGLRenderTarget(width, height, {

        })
    }

    // Render ssao on another off texture
    this.ssao_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.SSAOEval.vertexShader,
            fragmentShader: THREE.SSAOEval.fragmentShader,
            uniforms: {
                tDepth: { value: this.depth_pass.target.texture },
                tNormals: { value: this.normal_pass.target.texture },
                uRadius: { value: 0.1 },
                uSize: { value: new THREE.Vector2(width, height) },
                uNear: { value: 0.1 },
                uFar: { value: 1000 },
                uKernel: { value: kernel },
                tNoise: { value: noise_tex }
            },
            defines: {
                numSamples: 16,
            }
        }),
        target: new THREE.WebGLRenderTarget(width, height, {
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: false,
        })
    }

    // blur ssao and blend in the result on the opaque colored canvas
    this.blur_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.SSAOBlur.vertexShader,
            fragmentShader: THREE.SSAOBlur.fragmentShader,
            uniforms: {
                tSSAO: { value: this.ssao_pass.target.texture },
                tDepth: { value: this.depth_pass.target.texture },
                tNormals: { value: this.normal_pass.target.texture },
                uSize: { value: new THREE.Vector2(width, height) },
                depthThreshold: { value: 0.01 }
            },
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.DstColorFactor,
            blendDst: THREE.ZeroFactor,
            transparent: true,
            depthTest: false,
            depthWrite: false
        }),
    }
}

Object.assign(HexaLab.Renderer.prototype, {
    init_backend: function() {
        this.backend = new THREE.WebGLRenderer({
            antialias: this.settings.msaa,  // MSAA
            preserveDrawingBuffer: true,    // disable hidden/automatic clear of the rendertarget
            alpha: true                     // to have an alpha on the rendertarget? (needed for setClearAlpha to work)
        });
        this.backend.setSize(this.width, this.height);
        this.backend.autoClear = false;
        this.backend.setClearColor(this.settings.clear_color, 1.0)
        this.backend.clear()
    },

    get_element: function () {
        return this.backend.domElement;
    },

    // Settings
    set_clear_color: function (color) {
        this.settings.clear_color = color
    },

    set_camera_light_color: function (color) {
        this.camera_light.color.set(color);
    },

    set_camera_light_intensity: function (intensity) {
        this.camera_light.intensity = intensity;
    },

    set_ambient_color: function (color) {
        this.ambient.color.set(color);
    },

    set_ambient_intensity: function (intensity) {
        this.ambient.intensity = intensity;
    },

    set_ssao: function (value) {
        this.settings.ssao = value;
    },

    set_msaa: function (value) {
        this.settings.msaa = value;
        //init_backend();
    },

    get_clear_color: function () {
        return this.settings.clear_color
    },

    get_ssao: function () {
        return this.settings.ssao;
    },

    get_msaa: function () {
        return this.settings.msaa;
    },

    get_camera_light_color: function () {
        return '#' + this.camera_light.color.getHexString();
    },

    get_camera_light_intensity: function () {
        return this.camera_light.intensity;
    },

    get_ambient_color: function () {
        return '#' + this.ambient.color.getHexString();
    },

    get_ambient_intensity: function () {
        return this.ambient.intensity;
    },

    set_mesh_params(min_edge_len, avg_edge_len) {
        this.ssao_pass.material.uniforms.uRadius.value = 5 * avg_edge_len;
        this.blur_pass.material.uniforms.depthThreshold.value = min_edge_len * 0.5 + avg_edge_len * 0.5;
        // Does anybody care ?
        //log('ssao radius: ' + this.ssao_pass.material.uniforms.uRadius.value);
        //log('ssao depth threshold: ' + this.blur_pass.material.uniforms.depthThreshold.value);
    },

    resize: function (width, height) {
        this.width = width;
        this.height = height;
        this.aspect = width / height;

        this.ssao_pass.material.uniforms.uSize.value.set(width, height);
        this.blur_pass.material.uniforms.uSize.value.set(width, height);

        this.normal_pass.target.setSize(width, height);
        this.depth_pass.target.setSize(width, height);
        this.ssao_pass.target.setSize(width, height);

        this.backend.setSize(width, height);
    },

    render: function (models, meshes, main_camera) {
        var self = this;
        function clear_scene() {
            while (self.scene.children.length > 0) {
                self.scene.remove(self.scene.children[0]);
            }
        }
        function add_model_surface(model) {
            if (model.surface.geometry.attributes.position) {
                var mesh = new THREE.Mesh(model.surface.geometry, model.surface.material);
                self.scene.add(mesh);
                mesh.frustumCulled = false;
            }
        }
        function add_model_wireframe(model) {
            if (model.wireframe.geometry.attributes.position) {
                var mesh = new THREE.LineSegments(model.wireframe.geometry, model.wireframe.material);
                self.scene.add(mesh);
                mesh.frustumCulled = false;
            }
        }
        function enable_lighting() {
            self.scene.add(main_camera)
            self.scene.add(self.ambient)
            main_camera.add(self.camera_light)
        }
        function disable_lighting() {
            main_camera.remove(self.camera_light)
        }

        clear_scene();

        // render
        if (this.settings.ssao) {
            this.backend.setRenderTarget()

            // gather opaque surface models
            for (var k in models) {
                var model = models[k];
                if (model.surface.material && !model.surface.material.transparent) add_model_surface(model);
            }
            for (var k in meshes) {
                var mesh = meshes[k];
                if (!mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene with camera and lighing
            this.scene.add(main_camera);
            this.scene.add(this.ambient);
            main_camera.add(this.camera_light);

            // view space norm/depth prepass
            this.scene.overrideMaterial = this.normal_pass.material;
            this.backend.render(this.scene, main_camera, this.normal_pass.target, true);
            this.scene.overrideMaterial = null;

            this.scene.overrideMaterial = this.depth_pass.material;
            this.backend.render(this.scene, main_camera, this.depth_pass.target, true);
            this.scene.overrideMaterial = null;

            // render opaque models
            this.backend.setRenderTarget();
            this.backend.clear();
            this.backend.render(this.scene, main_camera);

            // clean up
            clear_scene();
            main_camera.remove(this.camera_light);

            // ssao
            this.ssao_pass.material.uniforms.uProj = { value: main_camera.projectionMatrix };
            this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(main_camera.projectionMatrix) };
            this.blur_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(main_camera.projectionMatrix) };

            this.scene.add(this.fullscreen_quad);

            this.fullscreen_quad.material = this.ssao_pass.material;
            this.backend.render(this.scene, this.ortho_camera, this.ssao_pass.target, true);

            this.fullscreen_quad.material = this.blur_pass.material;
            this.backend.render(this.scene, this.ortho_camera);

            clear_scene();

            // gather translucent models (and all wireframes)
            for (var k in models) {
                var model = models[k];
                if (model.surface.material && model.surface.material.transparent) add_model_surface(model);
                if (model.wireframe.material) add_model_wireframe(model);
            }
            for (var k in meshes) {
                var mesh = meshes[k];
                if (mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene
            this.scene.add(main_camera);
            this.scene.add(this.ambient);
            main_camera.add(this.camera_light);

            // render translucents
            this.backend.render(this.scene, main_camera);

            // clean up
            clear_scene();
            main_camera.remove(this.camera_light);
        } else {
            this.backend.setRenderTarget()
            this.backend.clear()

            // Draw the solid mesh
            enable_lighting()
            add_model_surface(models.visible)
            add_model_wireframe(models.visible)
            this.backend.render(this.scene, main_camera)

            clear_scene()

            // Draw the singularity mesh
            add_model_surface(models.singularity)
            this.backend.render(this.scene, main_camera)

            clear_scene()
            disable_lighting()

            // Clear all alpha values to 0
            this.fullscreen_quad.material = this.alpha_pass.material
            this.fullscreen_quad.material.uniforms.uAlpha = { value: 0.0 }
            this.fullscreen_quad.material.depthWrite = false;
            this.fullscreen_quad.material.depthTest = false;
            this.scene.add(this.fullscreen_quad);
            this.backend.context.colorMask(false, false, false, true);
            this.backend.render(this.scene, this.ortho_camera);
            this.backend.context.colorMask(true, true, true, true);

            clear_scene()

            // Set the outer silhouette alpha values
            add_model_surface(models.filtered)
            this.scene.overrideMaterial = this.alpha_pass.material
            this.scene.overrideMaterial.uniforms.uAlpha = { value: models.filtered.surface.material.opacity }
            this.scene.overrideMaterial.depthWrite = false;
            this.scene.overrideMaterial.depthTest = true;
            this.backend.context.colorMask(false, false, false, true);
            this.backend.render(this.scene, main_camera);
            this.backend.context.colorMask(true, true, true, true);

            clear_scene()
            this.scene.overrideMaterial = null

            // Do a fullscreen pass, coloring the set alpha values only
            this.fullscreen_quad.material = new THREE.MeshBasicMaterial({
                color: "#000000",
                blending: THREE.CustomBlending,
                blendEquation: THREE.AddEquation,
                blendSrc: THREE.DstAlphaFactor,
                blendDst: THREE.OneMinusDstAlphaFactor,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            this.scene.add(this.fullscreen_quad);
            this.backend.render(this.scene, this.ortho_camera);

            clear_scene();

            // Set back all alpha values to 1
            this.fullscreen_quad.material = this.alpha_pass.material
            this.fullscreen_quad.material.uniforms.uAlpha = { value: 1.0 }
            this.fullscreen_quad.material.depthWrite = false;
            this.fullscreen_quad.material.depthTest = false;
            this.scene.add(this.fullscreen_quad);
            this.backend.context.colorMask(false, false, false, true);
            this.backend.render(this.scene, this.ortho_camera);
            this.backend.context.colorMask(true, true, true, true);

            clear_scene()

            // Finally render transparent meshes (the culling plane)
            for (var k in meshes) {
                var mesh = meshes[k];
                this.scene.add(mesh);
            }
            this.scene.add(main_camera);
            this.backend.render(this.scene, main_camera);

            clear_scene();
        }

        // hud
        this.scene.add(this.gizmo);
        this.backend.setViewport(10, 10, 100, 100);
        this.hud_camera.setRotationFromMatrix(main_camera.matrixWorld);
        this.backend.render(this.scene, this.hud_camera);
        this.scene.remove(this.gizmo);
        this.backend.setViewport(0, 0, this.width, this.height);
    }
})


// --------------------------------------------------------------------------------
// Application
// --------------------------------------------------------------------------------
/*
    Creating an instance of the an App object also creates a global ref to the
    object in the HexaLab namespace. This is needed for the ui and the filters.
    The ui.js file has bindings for all the main hexalab ui components,meaning,
    everything except the filters components. Those are handled directly from
    the DOM by the filters themselves. The ui.js file also contains the handlers
    for all the application events. The global app reference is used from these
    handlers, to message changes from the ui to the application.

*/

HexaLab.App = function (dom_element) {

    this.backend = new Module.App();
    HexaLab.app = this;

    var width = dom_element.offsetWidth;
    var height = dom_element.offsetHeight;

    // Renderer
    this.renderer = new HexaLab.Renderer(width, height);

    this.canvas = {
        element: this.renderer.get_element(),
        container: dom_element
    }
    this.canvas.container.appendChild(this.canvas.element);

    this.default_renderer_settings = {
        occlusion: false,
        antialiasing: true
    };

    // Materials
    this.visible_surface_material = new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
        polygonOffset: true,
        polygonOffsetFactor: 0.5
    });
    this.visible_wireframe_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: 0.5
    });
    this.filtered_surface_material = new THREE.MeshLambertMaterial({
        transparent: true,
        depthWrite: false
    });
    this.filtered_wireframe_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false
    });
    this.singularity_surface_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
    });
    this.singularity_wireframe_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        vertexColors: THREE.VertexColors
    });

    this.default_material_settings = {
        show_quality_on_visible_surface: false,
        visible_wireframe_color: '#000000',
        visible_wireframe_opacity: 1,

        filtered_surface_color: '#d2de0c',
        filtered_surface_opacity: 0.28,
        filtered_wireframe_color: '#000000',
        filtered_wireframe_opacity: 0,

        singularity_mode: 0,

        color_map: 'Parula',
        quality_measure: 'Scaled Jacobian'  // TODO move this?
    }

    // Models
    this.models = [];
    this.models.visible = new HexaLab.Model(this.backend.get_visible_model(), this.visible_surface_material, this.visible_wireframe_material);
    this.models.filtered = new HexaLab.Model(this.backend.get_filtered_model(), this.filtered_surface_material, this.filtered_wireframe_material);
    this.models.singularity = new HexaLab.Model(this.backend.get_singularity_model(), this.singularity_surface_material, this.singularity_wireframe_material);

    // Camera
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    this.controls = new THREE.TrackballControls(this.camera, dom_element);

    this.default_camera_settings = {
        offset: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1),
        up: new THREE.Vector3(0, 1, 0),
        distance: 1.5
    }

    // Scene
    this.default_scene_settings = {
        background: '#ffffff',
        ambient_light_color: '#ffffff',
        ambient_light_intensity: 0.2,
        camera_light_color: '#ffffff',
        camera_light_intensity: 1
    }

    // Filters
    this.filters = [];
    for (var k in HexaLab.filters) {
        this.filters[k] = HexaLab.filters[k];
        if (this.filters[k].default_settings) {
            this.filters[k].set_settings(this.filters[k].default_settings);
        }
        this.backend.add_filter(this.filters[k].backend);
    }

    // Plots
    this.plots = [];

    // Resize callback
    window.addEventListener('resize', this.resize.bind(this));
};

Object.assign(HexaLab.App.prototype, {

    // Propagate back the current app settings to the UI.
    // This is generally only used when external settings are loaded into the
    // system and the UI needs to sync with those. Sometime though it is also
    // necessary to change a user setting from inside the system, so syncing can
    // also be useful in those situation.
    sync: function () {
        var settings = this.get_settings();
        HexaLab.UI.filtered_opacity.slider('value', settings.materials.filtered_surface_opacity * 100)
        HexaLab.UI.wireframe_opacity.slider('value', settings.materials.visible_wireframe_opacity * 100)
        HexaLab.UI.singularity_mode.slider('value', settings.materials.singularity_mode)
        HexaLab.UI.quality.prop('checked', settings.materials.show_quality_on_visible_surface)
        HexaLab.UI.occlusion.prop('checked', settings.renderer.occlusion)
        HexaLab.UI.color_map.val(settings.materials.color_map)
        if (settings.materials.show_quality_on_visible_surface) {
            HexaLab.UI.surface_color_source.val("ColorMap")
            $("#surface_colormap_input").css('display', 'flex');
        } else {
            HexaLab.UI.surface_color_source.val("Default")
            $("#surface_colormap_input").hide();
        }

        for (var k in this.filters) {
            this.filters[k].sync()
        }
    },

    // Resize callback
    resize: function () {
        var width = this.canvas.container.offsetWidth
        var height = this.canvas.container.offsetHeight
        this.renderer.resize(width, height)

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        log('Frame resized to ' + width + 'x' + height)
    },

    // Settings setters
    set_camera_settings: function (settings) {
        var size, center
        if (this.mesh) {
            size = this.mesh.get_size()
            var c = this.mesh.get_center()
            center = new THREE.Vector3(c.x(), c.y(), c.z())
            c.delete();
        } else {
            size = 1;
            center = new THREE.Vector3(0, 0, 0)
        }

        var target = new THREE.Vector3().addVectors(settings.offset, center)
        var direction = settings.direction
        var up = settings.up
        var distance = settings.distance * size

        this.controls.rotateSpeed = 10
        this.controls.dynamicDampingFactor = 1
        this.controls.target.set(target.x, target.y, target.z)

        this.camera.position.set(target.x, target.y, target.z)
        this.camera.up.set(up.x, up.y, up.z)
        this.camera.lookAt(new THREE.Vector3().addVectors(target, direction))
        this.camera.translateZ(distance)
    },

    set_renderer_settings: function (settings) {
        this.set_occlusion(settings.occlusion)
        this.set_antialiasing(settings.antialiasing)
    },

    set_material_settings: function (settings) {
        this.show_visible_quality(settings.show_quality_on_visible_surface)
        this.set_visible_wireframe_color(settings.visible_wireframe_color)
        this.set_visible_wireframe_opacity(settings.visible_wireframe_opacity)
        this.set_filtered_surface_color(settings.filtered_surface_color)
        this.set_filtered_surface_opacity(settings.filtered_surface_opacity)
        this.set_filtered_wireframe_color(settings.filtered_wireframe_color)
        this.set_filtered_wireframe_opacity(settings.filtered_wireframe_opacity)
        this.set_singularity_mode(settings.singularity_mode)
        //this.set_singularity_surface_opacity(settings.singularity_surface_opacity)
        //this.set_singularity_wireframe_opacity(settings.singularity_wireframe_opacity)
        this.set_color_map(settings.color_map)
        this.set_quality_measure(settings.quality_measure)
    },

    set_scene_settings: function (settings) {
        this.renderer.set_clear_color(settings.background);
        this.renderer.set_camera_light_color(settings.camera_light_color);
        this.renderer.set_camera_light_intensity(settings.camera_light_intensity);
        this.renderer.set_ambient_color(settings.ambient_light_color);
        this.renderer.set_ambient_intensity(settings.ambient_light_intensity);
    },

    set_settings: function (settings) {
        this.set_camera_settings(settings.camera);
        this.set_renderer_settings(settings.renderer);
        this.set_material_settings(settings.materials);
        this.set_scene_settings(settings.scene);
        for (var k in this.filters) {
            var filter = this.filters[k];
            if (settings.filters && settings.filters[filter.name]) {
                filter.set_settings(settings.filters[filter.name]);
            }
        }
        this.sync()
        this.update();
    },

    // Settings getters
    get_camera_settings: function () {
        if (this.mesh) {
            var c = this.mesh.get_center();
            return {
                offset: new THREE.Vector3().subVectors(this.controls.target, new THREE.Vector3(c.x(), c.y(), c.z())),
                direction: this.camera.getWorldDirection(),
                up: this.camera.up,
                distance: this.camera.position.distanceTo(this.controls.target) / this.mesh.get_size(),
            }
        }
        else return this.default_camera_settings;
    },

    get_material_settings: function () {
        return {
            show_quality_on_visible_surface: this.backend.do_show_color_map,
            visible_wireframe_color: '#' + this.visible_wireframe_material.color.getHexString(),
            visible_wireframe_opacity: this.visible_wireframe_material.opacity,
            filtered_surface_color: '#' + this.filtered_surface_material.color.getHexString(),
            filtered_surface_opacity: this.filtered_surface_material.opacity,
            filtered_wireframe_color: '#' + this.filtered_wireframe_material.color.getHexString(),
            filtered_wireframe_opacity: this.filtered_wireframe_material.opacity,
            singularity_mode: this.singularity_mode,
            //singularity_surface_opacity: this.singularity_surface_material.opacity,
            //singularity_wireframe_opacity: this.singularity_wireframe_material.opacity,
            color_map: this.color_map
        }
    },

    get_renderer_settings: function () {
        return {
            occlusion: this.renderer.get_ssao(),
            antialiasing: this.renderer.get_msaa()
        }
    },

    get_scene_settings: function () {
        return {
            background: this.renderer.get_clear_color(),
            camera_light_color: this.renderer.get_camera_light_color(),
            camera_light_intensity: this.renderer.get_camera_light_intensity(),
            ambient_light_color: this.renderer.get_ambient_color(),
            ambient_light_intensity: this.renderer.get_ambient_intensity()
        }
    },

    get_settings: function () {
        var filters = {};
        for (var k in this.filters) {
            filters[this.filters[k].name] = this.filters[k].get_settings();
        }
        return {
            camera: this.get_camera_settings(),
            renderer: this.get_renderer_settings(),
            scene: this.get_scene_settings(),
            materials: this.get_material_settings(),
            filters: filters,
        }
    },

    // Individual setters/getters. These are more for comodity than anything
    // else, they just wrap the thing that actually contains/controls the data.
    get_canvas_size() {
        return {
            width: this.canvas.container.offsetWidth,
            height: this.canvas.container.offsetHeight
        }
    },

    set_color_map: function (map) {
        if      (map == 'Jet')      this.backend.set_color_map(Module.ColorMap.Jet)
        else if (map == 'Parula')   this.backend.set_color_map(Module.ColorMap.Parula)
        else if (map == 'RedGreen') this.backend.set_color_map(Module.ColorMap.RedGreen)
        this.color_map = map
        HexaLab.UI.on_set_color_map(map)
    },

    set_quality_measure: function (measure) {
        if      (measure == "Scaled Jacobian")  this.backend.compute_hexa_quality(Module.QualityMeasure.ScaledJacobian)
        else if (measure == "Diagonal Ratio")   this.backend.compute_hexa_quality(Module.QualityMeasure.DiagonalRatio)
        else if (measure == "Edge Ratio")       this.backend.compute_hexa_quality(Module.QualityMeasure.EdgeRatio)
        this.quality_measure = measure
        this.update();  // TODO move this out into the caller
        HexaLab.UI.on_set_quality_measure(measure)
    },

    show_visible_quality: function (show) {
        this.backend.do_show_color_map = show;
        this.visible_surface_material.needsUpdate = true;
        HexaLab.UI.on_show_visible_quality(show)
        this.update();
    },

    set_singularity_mode: function (mode) {
        if (mode == 0) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(0.0)
        } else if (mode == 1) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(1.0)
        } else if (mode == 2) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(1.0)
        } else if (mode == 3) {
            this.set_singularity_surface_opacity(1.0)
            this.set_singularity_wireframe_opacity(1.0)
        } else if (mode == 4) {
            this.set_singularity_surface_opacity(1.0)
            this.set_singularity_wireframe_opacity(1.0)
        }
        if (this.singularity_mode == 0 && mode > 0) {
            if (this.filtered_surface_material.opacity > 0.3) {
                var x = this.filtered_surface_material.opacity
                this.set_filtered_surface_opacity(0.3)
                this.prev_filtered_surface_opacity = x
                this.sync()
            }
            if (this.visible_wireframe_material.opacity > 0.3) {
                var x = this.visible_wireframe_material.opacity
                this.set_visible_wireframe_opacity(0.3)
                this.prev_visible_wireframe_opacity = x
                this.sync()
            }
        } else if (this.singularity_mode > 0 && mode == 0) {
            if (this.prev_filtered_surface_opacity) {
                this.set_filtered_surface_opacity(this.prev_filtered_surface_opacity)
                this.sync()
            }
            if (this.prev_visible_wireframe_opacity) {
                this.set_visible_wireframe_opacity(this.prev_visible_wireframe_opacity)
                this.sync()
            }
        }
        this.singularity_mode = mode
        HexaLab.UI.on_set_singularity_mode(mode)
    },

    set_visible_wireframe_color: function (color) {
        this.visible_wireframe_material.color.set(color);
    },

    set_visible_wireframe_opacity: function (opacity) {
        this.visible_wireframe_material.opacity = opacity
        this.visible_wireframe_material.visible = opacity != 0
        this.prev_visible_wireframe_opacity = null
        HexaLab.UI.on_set_wireframe_opacity(opacity)
    },

    set_filtered_surface_color: function (color) {
        this.filtered_surface_material.color.set(color);
    },

    set_filtered_surface_opacity: function (opacity) {
        this.filtered_surface_material.opacity = opacity;
        this.filtered_surface_material.visible = opacity != 0;
        this.prev_filtered_surface_opacity = null
        HexaLab.UI.on_set_filtered_surface_opacity(opacity)
    },

    set_filtered_wireframe_color: function (color) {
        this.filtered_wireframe_material.color.set(color);
    },

    set_filtered_wireframe_opacity: function (opacity) {
        this.filtered_wireframe_material.opacity = opacity;
        this.filtered_wireframe_material.visible = opacity != 0;
    },

    set_singularity_surface_opacity: function (opacity) {
        this.singularity_surface_material.opacity = opacity;
        this.singularity_surface_material.visible = opacity != 0;
    },

    set_singularity_wireframe_opacity: function (opacity) {
        this.singularity_wireframe_material.opacity = opacity;
    },

    set_occlusion: function (value) {
        this.renderer.set_ssao(value)
        HexaLab.UI.on_set_occlusion(value)
    },

    set_antialiasing: function (value) {
        this.renderer.set_msaa(value);
    },

    // Import a new mesh. First invoke the backend for the parser and builder.
    // If everything goes well, reset settings to default and propagate the
    // fact that a new mesh is in use to the entire system. Finally sync
    // the mesh gpu data (vertices, normals, ecc) with that of the backend.
    import_mesh: function (path) {
        // invoke backend
        var result = this.backend.import_mesh(path);
        if (!result) {
            HexaLab.UI.on_import_mesh_fail(path)
            return
        }
        // reset settings
        // settings the mesh mush happen before the reset, as it is used inside
        // the set_settings call.
        this.mesh = this.backend.get_mesh();
        this.set_settings({
            camera: this.default_camera_settings,
            renderer: this.default_renderer_settings,
            scene: this.default_scene_settings,
            materials: this.default_material_settings
        });
        // propagate
        this.mesh_stats = this.backend.get_mesh_stats();
        this.renderer.set_mesh_params(this.mesh_stats.min_edge_len, this.mesh_stats.avg_edge_len);
        this.set_quality_measure(this.quality_measure)
        for (var k in this.filters) {
            this.filters[k].on_mesh_change(this.mesh);
        }
        var c = this.mesh.get_center();
        var center = new THREE.Vector3(c.x(), c.y(), c.z());
        var mesh_obj = new THREE.Object3D();
        mesh_obj.position.set(center.x, center.y, center.z);
        this.renderer.camera_light.target = mesh_obj;
        // update mesh data
        this.update();
        HexaLab.UI.on_import_mesh(path)
    },

    // Update all models to their current version in the cpp backend.
    update: function () {
        this.backend.build_models();
        this.models.visible.update();
        this.models.filtered.update();
        this.models.singularity.update();
    },

    // The application main loop. Call this after instancing an App object to
    // start rendering.
    animate: function () {
        this.controls.update();

        if (this.mesh) {
            var meshes = [];

            for (var k in this.filters) {
                for (var j in this.filters[k].scene.objects) {
                    meshes.push(this.filters[k].scene.objects[j]);
                }
            }

            this.renderer.render(this.models, meshes, this.camera);
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this));
    }

});
