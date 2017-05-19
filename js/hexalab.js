"use strict";

var HexaLab = {}

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
// UI Builder
// --------------------------------------------------------------------------------
// HTML widgets builder. To be used in views, to create its own custom interface.
// This is a bit verbose, the upside is that it streamlines the outer interface.

HexaLab.DynamicInterface = function () {
    this.map = [];
    this.roots = [];
}

Object.assign(HexaLab.DynamicInterface.prototype, {
    color_picker: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'color');
        e.set = function (value) {
            this.value = value;
        }
        e.get = function () {
            return this.value;
        }
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.label = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('input', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    range: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'range');
        e.set = function (value) {
            this.value = value * 100;
        }
        e.get = function () {
            return parseFloat(this.value) / 100;
        }
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.label = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('input', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    checkbox: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'checkbox');
        e.set = function (value) {
            this.checked = value;
        }
        e.get = function () {
            return this.checked;
        }
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.label = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('click', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    numeric: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'number');
        e.set = function (value) {
            this.value = parseFloat(value.toFixed(3));
        }
        e.get = function () {
            return parseFloat(this.value);
        }
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.label = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('change', params.callback);
            if (params.value) e.set(params.value);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    button: function (params) {
        var e = document.createElement('button');
        e.set = function (value) {
            this.innerHTML = value;
        }
        e.get = function () {
            return this.innerHTML;
        }
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.label = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('click', params.callback);
            if (params.value) e.set(params.value);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    select: function (params) {
        var e = document.createElement('select');
        if (params) {
            for (var option in params.options) {
                var oe = document.createElement('option');
                if (option.value && option.text) {
                    oe.value = option.value;
                    oe.innerHTML = option.text;
                } else {
                    oe.value = option;
                    oe.innerHTML = option;
                }
                e.appendChild(oe);
            }
            if (params.default) e.selectedIndex = params.default;
            e.get = function () {
                return this.options[this.selectedIndex].text;
            }
            e.set = function (value) {
                this.value = value;
            }
            e.hide = function () {
                this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
            }
            e.show = function () {
                this.label ? this.parentNode.style.display = '' : this.style.display = '';
            }
            e.add = function (value, text) {
                if (this.options[value]) return;
                var e = document.createElement('option');
                e.value = value;
                text ? e.innerHTML = text : e.innerHTML = value;
                this.appendChild(e);
            }
            e.clear = function () {
                for (var i = this.options.length - 1 ; i >= 0 ; --i) {
                    this.remove(i);
                }
            }
            if (params.callback) e.addEventListener('change', params.callback);
            if (params.label) e.label = params.label + ' ';
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    file_picker: function (params) {
        var e = document.createElement('button'); 
        var file_input = document.createElement('input');
        file_input.setAttribute('type', 'file');
        file_input.setAttribute('display', 'none');
        e.appendChild(file_input);

        e.addEventListener('click', function () {
            file_input.value = null;
            file_input.click();
        });
        e.hide = function () {
            this.label ? this.parentNode.style.display = 'none' : this.style.display = 'none';
        }
        e.show = function () {
            this.label ? this.parentNode.style.display = '' : this.style.display = '';
        }
        if (params) {
            if (params.label) e.innerHTML = params.label + ' ';
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) file_input.addEventListener('change', params.callback);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },
    text: function (params) {
        var e = document.createElement('span'); 
        e.innerHTML = params.text;
        if (params) {
            if (params.style) e.setAttribute('style', params.style);
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },

    div: function (params) {
        var e = document.createElement('div');
        e.append = function (e) {
            if (e.label) {
                var label = document.createElement('label');
                var label_text = document.createElement('div');
                label_text.className += ' hl_label_text';
                label_text.innerHTML = e.label;
                label.appendChild(label_text);
                label.appendChild(e);
                e = label;
            }
            this.appendChild(e);
            return this;
        };
        e.newline = function () {
            this.appendChild(document.createElement('br'));
            return this;
        }
        e.hide = function () {
               this.style.display = 'none';
        }
        e.show = function () {
            this.style.display = '';
        }
        if (params) {
            if (params.style) e.setAttribute('style', params.style);
            if (params.title) {
                e.heading = document.createElement('span');
                e.heading.innerHTML = params.title;
                if (params.title_style) e.heading.setAttribute('style', title_style);
                e.append(e.heading).newline();
            }
            if (params.key) this.map[params.key] = e;
        }
        return e;
    },

    group: function (params) {
        var e = this.div(params);
        e.className += ' hl_group';
        if (e.heading) e.heading.className += ' hl_group_title';
        return e;
    },

    new_frame: function (params) {
        var e = this.div(params);
        e.className += ' hl_frame';
        if (e.heading) e.heading.className += ' hl_frame_title';
        this.roots.push(e);
        return e;
    },

    append_to: function (root) {
        for (var key in this.roots) {
            var e = this.roots[key];
            root.appendChild(e);
        }
    }
});

// --------------------------------------------------------------------------------
// View Interface
// --------------------------------------------------------------------------------
// Creates a gui builder instance and prototypes the basic view interface and api.

HexaLab.View = function (view, name) {
    this.gui = new HexaLab.DynamicInterface();
    this.view = view;
    this.name = name;
};

Object.assign(HexaLab.View.prototype, {
    // Implementation Api

    on_update: function () {
        console.warn('Function "on_update" not implemented for view ' + this.get_name() + '.');
    },

    on_settings_change: function () {
        console.warn('Function "on_settings_change" not implemented for view ' + this.get_name() + '.');
    },

    serialize_settings: function () {
        console.warn('Function "serialize_settings" not implemented for view ' + this.get_name() + '.');
    },

    on_resize: function (width, height) {
        console.warn('Function "on_resize" not implemented for view ' + this.get_name() + '.');
    },

    // Api

    get_name: function () {
        return this.name;
    },

    get_settings: function () {
        return this.serialize_settings();
    },

    update: function () {
        this.view.update();
        this.on_update();
    },

    resize: function (width, height) {
        this.on_resize(width, height);
    }
});

// --------------------------------------------------------------------------------
// WebGL View
// --------------------------------------------------------------------------------
// The most typical kind of view. Has its own 3d scene, is presented through a 
// WebGL renderer.
// The camera_id parameter is the id of the camera this view will be using.
// Use a unique id for each view if you want separate cameras,
// otherwise share ids and the respective cameras will be shared.
// Defaults (no id passed) to a common id called 'default', meaning that by default,
// there's only one shared camera between all views.

HexaLab.WebGLView = function (view, name) {

    HexaLab.View.call(this, view, name);

    this.models = [];
    this.meshes = [];
    this.camera_node = new THREE.Group();
    this.camera_node.add(new THREE.PointLight(0xffffff));
    this.scene_node = new THREE.Group();
    this.scene_node.add(new THREE.AmbientLight(0x404040));
};

HexaLab.WebGLView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {
})

// --------------------------------------------------------------------------------
// HTML View
// --------------------------------------------------------------------------------
// Displays an HTML page inside the viewer. Might be useful to embed stuff
// like graphs?

HexaLab.HTMLView = function (view, name) {
    HexaLab.View.call(this, view, name);
    this.content = new HexaLab.DynamicInterface();
}

HexaLab.HTMLView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {
})

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
        preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);

    // SSAO passes setup
    this.ortho_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fullscreen_quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);

    var num_samples = 16;
    var kernel = new Float32Array(num_samples * 3);
    for (var i = 0; i < num_samples * 3; i += 3) {
        var v = new THREE.Vector3(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            Math.random()
        ).normalize();
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
    this.pre_pass = {
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
    this.pre_pass.target.texture.generateMipmaps = false;
    this.pre_pass.target.depthTexture = new THREE.DepthTexture();
    this.pre_pass.target.depthTexture.type = THREE.UnsignedShortType;

    // Render ssao on another off texture
    this.ssao_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.SSAOEval.vertexShader,
            fragmentShader: THREE.SSAOEval.fragmentShader,
            uniforms: {
                tDepth: { value: this.pre_pass.target.depthTexture },
                tNormals: { value: this.pre_pass.target.texture },
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
                uSize: { value: new THREE.Vector2(width, height) },
                uTexture: { value: this.ssao_pass.target.texture }
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

    this.renderer.autoClear = false;
}

Object.assign(HexaLab.Renderer.prototype, {
    get_element: function () {
        return this.renderer.domElement;
    },

    set_clear_color: function (color) {
        this.settings.clear_color = color;
    },

    set_ssao: function (value) {
        this.settings.occlusion = value;
    },

    resize: function (width, height) {
        this.width = width;
        this.height = height;
        this.aspect = width / height;

        this.ssao_pass.material.uniforms.uSize.value.set(width, height);
        this.blur_pass.material.uniforms.uSize.value.set(width, height);

        this.pre_pass.target.setSize(width, height);
        this.ssao_pass.target.setSize(width, height);

        this.renderer.setSize(width, height);
    },

    render: function (view, camera, settings) {
        var self = this;
        function clear_scene() {
            while (self.scene.children.length > 0) {
                self.scene.remove(self.scene.children[0]);
            }
        }
        function add_model_surface(model) {
            if (model.surface.geometry.attributes.position) {
                self.scene.add(new THREE.Mesh(model.surface.geometry, model.surface.material));
            }
        }
        function add_model_wireframe(model) {
            if (model.wireframe.geometry.attributes.position) {
                self.scene.add(new THREE.LineSegments(model.wireframe.geometry, model.wireframe.material));
            }
        }

        // prepare renderer
        var do_ssao = settings.occlusion;
        var clear_color = settings.background_color;
        this.renderer.setClearColor(clear_color, 1);

        clear_scene();

        // render
        if (do_ssao) {
            // gather opaque surface models
            for (var k in view.models) {
                var model = view.models[k];
                if (model.surface.material && !model.surface.material.transparent) add_model_surface(model);
            }
            for (var k in view.meshes) {
                var mesh = view.meshes[k];
                if (!mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene
            this.scene.add(view.scene_node);
            this.scene.add(camera);
            camera.add(view.camera_node);
            
            // view norm/depth prepass
            this.scene.overrideMaterial = this.pre_pass.material;
            this.renderer.render(this.scene, camera, this.pre_pass.target, true);
            this.scene.overrideMaterial = null;

            // render opaque models
            this.renderer.setRenderTarget(null);
            this.renderer.clear();
            this.renderer.render(this.scene, camera);
            
            // clean up
            clear_scene();
            camera.remove(view.camera_node);
            
            // ssao
            this.ssao_pass.material.uniforms.uProj = { value: camera.projectionMatrix };
            this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) };

            this.scene.add(this.fullscreen_quad);

            this.fullscreen_quad.material = this.ssao_pass.material;
            this.renderer.render(this.scene, this.ortho_camera, this.ssao_pass.target, true);
            
            this.fullscreen_quad.material = this.blur_pass.material;
            this.renderer.render(this.scene, this.ortho_camera);

            clear_scene();

            // gather translucent models (and all wireframes)
            for (var k in view.models) {
                var model = view.models[k];
                if (model.wireframe.material) add_model_wireframe(model);
                if (model.surface.material && model.surface.material.transparent) add_model_surface(model);
            }
            for (var k in view.meshes) {
                var mesh = view.meshes[k];
                if (mesh.material.transparent) this.scene.add(mesh);
            }
            // finish up the scene
            this.scene.add(view.scene_node);
            this.scene.add(camera);
            camera.add(view.camera_node);

            // render translucents
            this.renderer.render(this.scene, camera);

            // clean up
            clear_scene();
            camera.remove(view.camera_node);
        } else {
            // fill scene
            for (var k in view.models) {
                var model = view.models[k];
                add_model_surface(model);
                add_model_wireframe(model);
            }
            for (var k in view.meshes) {
                var mesh = view.meshes[k];
                this.scene.add(mesh);
            }
            this.scene.add(view.scene_node);
            this.scene.add(camera);
            camera.add(view.camera_node);

            // render
            this.renderer.clear();
            this.renderer.render(this.scene, camera);

            // clean up the scene
            clear_scene();
            camera.remove(view.camera_node);
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

HexaLab.App = function (frame_id, gui_id) {

    // Fetch page elements
    this.frame = {
        element: document.getElementById(frame_id),
        content: null,
        clear: function () {
            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }
        },
        set_content: function (e) {
            this.content = e;
            this.element.appendChild(e);
        }
    }
    this.canvas = {
        width: this.frame.element.offsetWidth,
        height: this.frame.element.offsetHeight,
        element: null
    };
    this.html = {
        element: document.createElement('div'),
        clear: function () {
            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }
        }
    }
    this.gui_container = document.getElementById(gui_id);

    // Renderer
    this.renderer = new HexaLab.Renderer(this.canvas.width, this.canvas.height);
    this.canvas.element = this.renderer.get_element();
    this.renderer_settings = this.default_renderer_settings;

    // Dynamic interface
    this.gui = new HexaLab.DynamicInterface();

    var mesh_reader = new FileReader();
    var settings_reader = new FileReader();

    var self = this;
    this.gui.new_frame({
        title: 'HexaLab'
    }).append(this.gui.group({
        key: 'general_settings'
    }).append(this.gui.select({
        key: 'views_select',
        label: "View:",
        values: {},
        callback: function () {
            self.set_view(this.get());
        }
    })).newline().append(this.gui.file_picker({
        key: 'mesh_picker',
        label: 'Load Mesh',
        callback: function () {
            var file = this.files[0];
            mesh_reader.onload = function () {
                var data = new Int8Array(this.result);
                HexaLab.FS.make_file(data, file.name);
                self.import_mesh(file.name);
            }
            mesh_reader.readAsArrayBuffer(file, "UTF-8");
        }
    })).newline().append(this.gui.file_picker({
        key: 'settings_picker',
        label: 'Import Settings',
        callback: function () {
            settings_reader.onload = function () {
                var settings = JSON.parse(this.result);
                self.set_settings(settings);
            }
            settings_reader.readAsText(this.files[0], "UTF-8");
        }
    })).newline().append(this.gui.button({
        key: 'settings_saver',
        value: 'Export settings',
        callback: function () {
            var settings = JSON.stringify(self.get_settings(), null, 4);
            var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "HLsettings.txt");
        }
    }))).newline().append(this.gui.group({
        key: 'renderer_settings'
    }).append(this.gui.button({
        key: 'snapshot',
        value: 'Snapshot',
        callback: function () {
            self.canvas.element.toBlob(function (blob) {
                saveAs(blob, "HLsnapshot.png");
            }, "image/png");
        }
    })).newline().append(this.gui.button({
        key: 'reset_camera',
        value: 'Reset Camera',
        callback: function () {
            self.set_camera(self.default_camera_settings);
        }
    })).newline().append(this.gui.color_picker({
        key: 'background_color',
        label: 'Background',
        callback: function () {
            self.set_background_color(this.get());
        },
    })).newline().append(this.gui.checkbox({
        key: 'occlusion',
        label: 'Occlusion',
        callback: function () {
            self.set_occlusion(this.get());
        }
    })));

    this.gui.append_to(document.getElementById(gui_id));

    // Views
    this.view_types = [];
    this.views = {};

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, this.canvas.width / this.canvas.height, 0.1, 1000);
    this.controls = new THREE.TrackballControls(this.camera, this.frame.element);
    this.set_camera(this.default_camera_settings);

    // Stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    //document.body.appendChild(this.stats.dom);

    // Hook resize event
    window.addEventListener('resize', this.resize.bind(this));
};
 
Object.assign(HexaLab.App.prototype, {
    default_camera_settings: {
        offset: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1),
        //distance: 2
    },

    default_renderer_settings: {
        occlusion: false,
        background_color: '#ffffff'
    },

    // view

    add_view: function (type) {
        this.view_types.push(type);

        if (this.mesh) {
            var view = new type(this.mesh);
            this.views[view.name] = view;
            this.gui.map.views_select.add(view.name);
        }
    },

    set_view: function (view) {
        var new_view;
        if (typeof view == 'string' || view instanceof String) {
            if (!this.views[view]) {
                alert('View "' + view + '" not found!');
                return;
            }
            new_view = this.views[view];
        } else if (view instanceof HexaLab.View) {
            new_view = view;
        } else {
            alert('Not a view!');
        }

        // clear previous gui
        while (this.gui_container.firstChild) {
            this.gui_container.removeChild(this.gui_container.firstChild);
        }

        // create gui
        this.gui.append_to(this.gui_container);
        if (new_view instanceof HexaLab.HTMLView) {
            this.gui.map.renderer_settings.hide();
        } else {
            this.gui.map.renderer_settings.show();
        }
        new_view.gui.append_to(this.gui_container);

        // update frame content
        if (new_view instanceof HexaLab.WebGLView && this.frame.content != this.canvas.element) {
            this.frame.clear();
            this.frame.set_content(this.canvas.element);
        } else if (new_view instanceof HexaLab.HTMLView && this.frame.content != this.html.element) {
            this.html.clear();
            new_view.content.append_to(this.html.element);
            this.frame.clear();
            this.frame.set_content(this.html.element);
            new_view.resize(this.canvas.width, this.canvas.height);
        }

        // update selection
        this.view = new_view;
        this.view.update();
        this.gui.map.views_select.set(new_view.name);
    },

    // settings

    resize: function () {
        this.canvas.width = this.frame.element.offsetWidth;
        this.canvas.height = this.frame.element.offsetHeight;
        this.renderer.resize(this.canvas.width, this.canvas.height);

        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();

        for (var key in this.views) {
            this.views[key].resize(this.canvas.width, this.canvas.height);
        }

        this.renderer.resize(this.canvas.width, this.canvas.height);

        log('Frame resized to ' + this.canvas.width + 'x' + this.canvas.height);
    },

    get_camera: function () {
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

    set_camera: function (settings) {
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
        var distance = size;

        this.controls.rotateSpeed = 10;
        this.controls.dynamicDampingFactor = 1;
        this.controls.target.set(target.x, target.y, target.z);

        this.camera.position.set(target.x, target.y, target.z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3().addVectors(target, direction));
        this.camera.translateZ(distance);
    },

    set_settings: function (settings) {
        // views
        for (var key in this.views) {
            if (settings[key]) {
                this.views[key].set_settings(settings.views[key]);
            }
        }
        // camera
        this.set_camera(settings.camera);
        // renderer
        this.set_occlusion(settings.renderer.occlusion);
        this.set_background_color(settings.renderer.background_color);
        this.renderer_settings = settings.renderer;
    },

    get_settings: function () {
        var settings = {};
        // views
        settings.views = {};
        for (var key in this.views) {
            settings.views[key] = this.views[key].get_settings();
        }
        // camera
        settings.camera = this.get_camera();
        // renderer
        settings.renderer = this.renderer_settings;
        return settings;
    },

    set_occlusion: function (value) {
        this.renderer_settings.occlusion = value;
        this.gui.map.occlusion.set(value);
    },

    set_background_color: function (value) {
        this.renderer_settings.background_color = value;
        this.gui.map.background_color.set(value);
    },

    // mesh

    import_mesh: function (path) {
        // prepare new settings
        var settings = {
            camera: this.default_camera_settings,
            renderer: this.default_renderer_settings,
            views: {}
        }
        for (var key in this.views) {
            var view = this.views[key];
            settings.views[view.name] = view.default_settings;
        }

        // import mesh
        var result = Module.import_mesh(path);
        if (!result) {
            log('error');
        }

        // re create views
        this.gui.map.views_select.clear();
        var mesh = Module.get_mesh();
        for (var key in this.view_types) {
            var view = new this.view_types[key](mesh);
            this.views[view.name] = view;
            this.gui.map.views_select.add(view.name);
        }
        this.set_view(Object.keys(this.views)[0]);

        // restore settings
        this.mesh = mesh;
        this.set_settings(settings);
    },

    // Animate

    animate: function () {

        if (this.view) {
            if (this.view instanceof HexaLab.WebGLView) {
                this.controls.update();
                this.stats.begin();
                this.renderer.render(this.view, this.camera, this.renderer_settings);
                this.stats.end();
            }
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this));
    }
});
