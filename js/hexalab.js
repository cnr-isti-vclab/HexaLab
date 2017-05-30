"use strict";

var HexaLab = {}
HexaLab.filters = [];

// --------------------------------------------------------------------------------
// Utility
// --------------------------------------------------------------------------------
// File utility routines

HexaLab.FS = {
    file_exists: function (path) {
        var stat = FS.stat(path);
        if (!stat) return false;
        return FS.isFile(stat.mode);
    },
    make_file: function (data, name) {
        try {
            if (HexaLab.FS.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
        FS.createDataFile("/", name, data, true, true);
    }
};

// --------------------------------------------------------------------------------
// Model
// --------------------------------------------------------------------------------
// Maps straight to a cpp model class. Pass the cpp model instance and the 
// three.js materials for both surface and wframe as parameters.
// Update fetches the new buffers from the model backend.

HexaLab.Model = function (buffers, surface_material, wireframe_material) {
    this.surface = {
        geometry: new THREE.BufferGeometry(),
        material: surface_material,
    }
    this.wireframe = {
        geometry: new THREE.BufferGeometry(),
        material: wireframe_material,
    }
    this.buffers = buffers;
}

Object.assign(HexaLab.Model.prototype, {
    update: function () {
        this.surface.geometry.removeAttribute('position');
        if (this.buffers.surface_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.buffers.surface_pos().data(), this.buffers.surface_pos().size() * 3);
            this.surface.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.surface.geometry.removeAttribute('normal');
        if (this.buffers.surface_norm().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.buffers.surface_norm().data(), this.buffers.surface_norm().size() * 3);
            this.surface.geometry.addAttribute('normal', new THREE.BufferAttribute(buffer, 3));
        }
        this.surface.geometry.removeAttribute('color');
        if (this.buffers.surface_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.buffers.surface_color().data(), this.buffers.surface_color().size() * 3);
            this.surface.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }

        this.wireframe.geometry.removeAttribute('position');
        if (this.buffers.wireframe_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.buffers.wireframe_pos().data(), this.buffers.wireframe_pos().size() * 3);
            this.wireframe.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.wireframe.geometry.removeAttribute('color');
        if (this.buffers.wireframe_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.buffers.wireframe_color().data(), this.buffers.wireframe_color().size() * 3);
            this.wireframe.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }
    },
})

// --------------------------------------------------------------------------------
// Filter Interface
// --------------------------------------------------------------------------------

HexaLab.Filter = function (filter, name) {
    this.filter = filter;
    this.name = name;
    this.scene = {
        data: [],
        add: function (obj) {
            this.data.push(obj);
        },
        remove: function (obj) {
            var i = this.data.indexOf(obj);
            if (i != -1) {
                this.data.splice(i, 1);
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
});

// --------------------------------------------------------------------------------
// Renderer
// --------------------------------------------------------------------------------

HexaLab.Renderer = function (width, height) {
    this.width = width;
    this.height = height;
    this.aspect = width / height;

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

    this.hud_camera = new THREE.OrthographicCamera(-this.aspect, this.aspect, 1, -1, -500, 1000);
    this.hud_camera.position.set(0, 0, 0);

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);

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
            format: THREE.RGBFormat,
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

    this.settings = {
        clear_color: '#ffffff',
        ssao: false,
        msaa: true
    };

    //this.camera_light = new THREE.PointLight();
    this.camera_light = new THREE.DirectionalLight();
    this.camera_light.position.set(0, 0, 0);
    this.ambient = new THREE.AmbientLight();

    this.renderer.autoClear = false;
}

Object.assign(HexaLab.Renderer.prototype, {
    get_element: function () {
        return this.renderer.domElement;
    },

    // Settings

    set_clear_color: function (color) {
        this.settings.clear_color = color;
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
    },

    get_clear_color: function () {
        return this.settings.clear_color;
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
        log('ssao radius: ' + this.ssao_pass.material.uniforms.uRadius.value);
        log('ssao depth threshold: ' + this.blur_pass.material.uniforms.depthThreshold.value);
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

        this.renderer.setSize(width, height);
    },

    render: function (models, meshes, camera, settings) {
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

        // prepare renderer
        var do_ssao = this.settings.ssao;
        var clear_color = this.settings.clear_color;
        this.renderer.setClearColor(clear_color, 1);

        clear_scene();

        // render
        if (do_ssao) {
            // gather opaque surface models
            for (var k in models) {
                var model = models[k];
                if (model.surface.material && !model.surface.material.transparent) add_model_surface(model);
            }
            for (var k in meshes) {
                var mesh = meshes[k];
                if (!mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene
            this.scene.add(camera);
            this.scene.add(this.ambient);
            camera.add(this.camera_light);
            
            // view norm/depth prepass
            this.scene.overrideMaterial = this.normal_pass.material;
            this.renderer.render(this.scene, camera, this.normal_pass.target, true);
            this.scene.overrideMaterial = null;

            this.scene.overrideMaterial = this.depth_pass.material;
            this.renderer.render(this.scene, camera, this.depth_pass.target, true);
            this.scene.overrideMaterial = null;

            // render opaque models
            this.renderer.setRenderTarget(null);
            this.renderer.clear();
            this.renderer.render(this.scene, camera);

            // clean up
            clear_scene();
            camera.remove(this.camera_light);
            
            // ssao
            this.ssao_pass.material.uniforms.uProj = { value: camera.projectionMatrix };
            this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) };
            this.blur_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) };

            this.scene.add(this.fullscreen_quad);

            this.fullscreen_quad.material = this.ssao_pass.material;
            this.renderer.render(this.scene, this.ortho_camera, this.ssao_pass.target, true);
            
            this.fullscreen_quad.material = this.blur_pass.material;
            this.renderer.render(this.scene, this.ortho_camera);

            clear_scene();

            // gather translucent models (and all wireframes)
            for (var k in models) {
                var model = models[k];
                if (model.wireframe.material) add_model_wireframe(model);
                if (model.surface.material && model.surface.material.transparent) add_model_surface(model);
            }
            for (var k in meshes) {
                var mesh = meshes[k];
                if (mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene
            this.scene.add(camera);
            this.scene.add(this.ambient);
            camera.add(this.camera_light);

            // render translucents
            this.renderer.render(this.scene, camera);

            // clean up
            clear_scene();
            camera.remove(this.camera_light);
        } else {
            // fill scene
            for (var k in models) {
                var model = models[k];
                add_model_surface(model);
                add_model_wireframe(model);
            }
            for (var k in meshes) {
                var mesh = meshes[k];
                this.scene.add(mesh);
            }
            this.scene.add(camera);
            this.scene.add(this.ambient);
            camera.add(this.camera_light);

            // render
            this.renderer.clear();
            this.renderer.render(this.scene, camera);

            // clean up the scene
            clear_scene();
            camera.remove(this.camera_light);
        }

        // hud
        this.scene.add(this.gizmo);
        this.renderer.setViewport(this.width - 100 * this.aspect, (this.aspect - 1) * 50, 100 * this.aspect, 100);
        this.hud_camera.setRotationFromMatrix(camera.matrixWorld);
        this.renderer.render(this.scene, this.hud_camera);
        this.scene.remove(this.gizmo);
        this.renderer.setViewport(0, 0, this.width, this.height);
    }
})


// --------------------------------------------------------------------------------
// Application
// --------------------------------------------------------------------------------

HexaLab.App = function (dom_element) {

    this.app = new Module.App();
    HexaLab.UI.app = this;

    var width = dom_element.offsetWidth;
    var height = dom_element.offsetHeight;

    // Renderer
    this.renderer = new HexaLab.Renderer(width, height);
    this.renderer_settings = this.default_renderer_settings;

    this.default_renderer_settings = {
        occlusion: false,
        antialiasing: true
    };

    this.canvas = {
        element: this.renderer.get_element(),
        container: dom_element
    }
    dom_element.appendChild(this.canvas.element);

    // Materials
    this.visible_surface_material = new THREE.MeshLambertMaterial({
        polygonOffset: true,
        polygonOffsetFactor: 0.5
    });
    this.visible_wireframe_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false
    });
    this.filtered_surface_material = new THREE.MeshLambertMaterial({
        polygonOffset: true,
        polygonOffsetFactor: 0.5,
        transparent: true,
        depthWrite: false
    });
    this.filtered_wireframe_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false
    });
    this.singularity_face_material = new THREE.MeshLambertMaterial({
        transparent: true,
        depthWrite: false
    });
    this.singularity_edge_material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        vertexColors: THREE.VertexColors
    });

    this.default_material_settings = {
        visible_surface_color: '#ffee9f',
        show_quality_on_visible_surface: false,
        visible_wireframe_color: '#000000',
        visible_wireframe_opacity: 1,

        filtered_surface_color: '#d2de0c',
        filtered_surface_opacity: 0.28,
        filtered_wireframe_color: '#000000',
        filtered_wireframe_opacity: 0.3,

        singularity_opacity: 0.3,
    }

    // Models
    this.models = [];
    this.models.visible = new HexaLab.Model(this.app.get_visible_model(), this.visible_surface_material, this.visible_wireframe_material);
    this.models.filtered = new HexaLab.Model(this.app.get_filtered_model(), this.filtered_surface_material, this.filtered_wireframe_material);
    this.models.singularity = new HexaLab.Model(this.app.get_singularity_model(), this.singularity_surface_material, this.singularity_edge_material);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.controls = new THREE.TrackballControls(this.camera, dom_element);

    this.default_camera_settings = {
        offset: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1),
        distance: 2
    }

    this.set_camera_settings(this.default_camera_settings);

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
        this.app.add_filter(this.filters[k].filter);
    }

    // Plots
    this.plots = [];

    // Resize callback
    window.addEventListener('resize', this.resize.bind(this));
};
 
Object.assign(HexaLab.App.prototype, {

    // Settings

    resize: function () {
        var width = this.canvas.container.offsetWidth;
        var height = this.canvas.container.offsetHeight;
        this.renderer.resize(width, height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        log('Frame resized to ' + width + 'x' + height);
    },

    set_camera_settings: function (settings) {
        var size, center;
        if (this.mesh) {
            size = this.mesh.get_size();
            var c = this.mesh.get_center();
            center = new THREE.Vector3(c.x(), c.y(), c.z());
            c.delete();
        } else {
            size = 1;
            center = new THREE.Vector3(0, 0, 0);
        }

        var target = new THREE.Vector3().addVectors(settings.offset, center);
        var direction = settings.direction;
        var distance = settings.distance * size;

        this.controls.rotateSpeed = 10;
        this.controls.dynamicDampingFactor = 1;
        this.controls.target.set(target.x, target.y, target.z);

        this.camera.position.set(target.x, target.y, target.z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3().addVectors(target, direction));
        this.camera.translateZ(distance);
    },

    set_renderer_settings: function (settings) {
        this.set_occlusion(settings.occlusion);
        this.set_antialiasing(settings.antialiasing);
    },
    
    set_material_settings: function (settings) {
        this.set_visible_surface_color(settings.visible_surface_color);
        this.show_visible_quality(settings.show_quality_on_visible_surface);
        this.set_visible_wireframe_color(settings.visible_wireframe_color);
        this.set_visible_wireframe_opacity(settings.visible_wireframe_opacity);
        this.set_filtered_surface_color(settings.filtered_surface_color);
        this.set_filtered_surface_opacity(settings.filtered_wireframe_opacity);
        this.set_filtered_wireframe_color(settings.filtered_wireframe_color);
        this.set_filtered_wireframe_opacity(settings.filtered_wireframe_opacity);
        this.set_singularity_opacity(settings.singularity_opacity);
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
        this.update();
    },

    get_camera_settings: function () {
        if (this.mesh) {
            var c = this.mesh.get_center();
            var center = new THREE.Vector3(c.x(), c.y(), c.z());
            var offset = new THREE.Vector3().subVectors(this.controls.target, center);
            var distance = this.camera.getWorldDirection();
            var direction = this.camera.position.distanceTo(this.controls.target) / this.mesh.get_size();
            return {
                offset: new THREE.Vector3().subVectors(this.controls.target, new THREE.Vector3(c.x(), c.y(), c.z())),
                direction: this.camera.getWorldDirection(),
                distance: this.camera.position.distanceTo(this.controls.target) / this.mesh.get_size(),
            }
        }
        else return this.default_camera_settings;
    },

    get_material_settings: function () {
        return {
            visible_surface_color: '#' + this.visible_surface_material.color.getHexString(),
            show_quality_on_visible_surface: this.visible_surface_material.vertexColors == THREE.VertexColors,
            visible_wireframe_color: '#' + this.visible_wireframe_material.color.getHexString(),
            visible_wireframe_opacity: this.visible_wireframe_material.opacity,
            filtered_surface_color: '#' + this.filtered_surface_material.color.getHexString(),
            filtered_surface_opacity: this.filtered_surface_material.opacity,
            filtered_wireframe_color: '#' + this.filtered_wireframe_material.color.getHexString(),
            filtered_wireframe_opacity: this.filtered_wireframe_material.opacity,
            singularity_opacity: this.singularity_edge_material.opacity
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

    show_visible_quality: function (show) {
        if (show) {
            this.visible_surface_material.vertexColors = THREE.VertexColors;
            this._surface_color = '#' + this.visible_surface_material.color.getHexString();
            this.set_visible_surface_color('#ffffff');
            HexaLab.UI.visible_surface_color.hide();
            $("label[for='" + HexaLab.UI.visible_surface_color.attr('id') + "']").hide();
        } else {
            this.visible_surface_material.vertexColors = THREE.NoColors;
            if (this._surface_color) this.set_visible_surface_color(this._surface_color);
            HexaLab.UI.visible_surface_color.show();
            $("label[for='" + HexaLab.UI.visible_surface_color.attr('id') + "']").show();
        }
        HexaLab.UI.visible_surface_show_quality.prop('checked', show);
        this.visible_surface_material.needsUpdate = true;
    },

    set_visible_surface_color: function (color) {
        this.visible_surface_material.color.set(color);
        HexaLab.UI.visible_surface_color.val(color);
    },

    set_visible_wireframe_color: function (color) {
        this.visible_wireframe_material.color.set(color);
        HexaLab.UI.visible_wireframe_color.val(color);
    },

    set_visible_wireframe_opacity: function (opacity) {
        this.visible_wireframe_material.opacity = opacity;
        HexaLab.UI.visible_wireframe_opacity.slider('value', opacity * 100);
    },

    set_filtered_surface_color: function (color) {
        this.filtered_surface_material.color.set(color);
        HexaLab.UI.filtered_surface_color.val(color);
    },

    set_filtered_surface_opacity: function (opacity) {
        this.filtered_surface_material.opacity = opacity;
        HexaLab.UI.filtered_surface_opacity.slider('value', opacity * 100);
    },

    set_filtered_wireframe_color: function (color) {
        this.filtered_wireframe_material.color.set(color);
        HexaLab.UI.filtered_wireframe_color.val(color);
    },

    set_filtered_wireframe_opacity: function (opacity) {
        this.filtered_wireframe_material.opacity = opacity;
        HexaLab.UI.filtered_wireframe_opacity.slider('value', opacity * 100);
    },

    set_singularity_opacity: function (opacity) {
        this.singularity_face_material.opacity = opacity;
        this.singularity_edge_material.opacity = opacity;
        HexaLab.UI.singularity_opacity.slider('value', opacity * 100);
    },

    set_occlusion: function (value) {
        this.renderer.set_ssao(value);
        HexaLab.UI.ssao.prop('checked', value);
    },

    set_antialiasing: function (value) {
        this.renderer.set_msaa(value);
        HexaLab.UI.msaa.prop('checked', value);
    },
    
    // Mesh

    import_mesh: function (path) {
        var result = this.app.import_mesh(path);
        if (!result) {
            log('error');
        }

        this.mesh = this.app.get_mesh();
        this.set_settings({
            camera: this.default_camera_settings,
            renderer: this.default_renderer_settings,
            scene: this.default_scene_settings,
            materials: this.default_material_settings
        });
        this.renderer.set_mesh_params(this.mesh.min_edge_len, this.mesh.avg_edge_len);
        for (var k in this.filters) {
            this.filters[k].on_mesh_change(this.mesh);
        }
        this.update();

        var c = mesh.get_center();
        var center = THREE.Vector3(c.x(), c.y(), c.z());
        this.renderer.camera_light.target = center;
    },

    // Update

    update: function () {
        this.app.build_models();
        this.models.visible.update();
        this.models.filtered.update();
        this.models.singularity.update();
    },

    // Animate

    animate: function () {

        this.controls.update();
        //this.stats.begin();
    
        if (this.mesh) {
            var meshes = [];
            for (var k in this.filters) {
                for (var j in this.filters[k].scene.data) {
                    meshes.push(this.filters[k].scene.data[j]);
                }
            }

            this.renderer.render(this.models, meshes, this.camera, this.renderer_settings);
            //this.stats.end();
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this));
    }

});
