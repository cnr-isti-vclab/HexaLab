"use strict";

var HexaLab = {};

// MODEL

HexaLab.Model = function (buffers, surface_material, wireframe_material) {
    this.surface = {
        geometry: new THREE.BufferGeometry(),
        material: surface_material,
        mesh: null
    }
    this.wireframe = {
        geometry: new THREE.BufferGeometry(),
        material: wireframe_material,
        mesh: null
    }
    this.buffers = buffers;
}

// DYNAMIC INTERFACE

HexaLab.DynamicInterface = function () {
    this.gui = [];
    this.gui_roots = [];
}

Object.assign(HexaLab.DynamicInterface.prototype, {
    file_exists: function(path) {
        var stat = FS.stat(path);
        if (!stat) return false;
        return FS.isFile(stat.mode);
    },
    make_file: function (data, name) {
        try {
            if (this.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
        FS.createDataFile("/", name, data, true, true);
    },
    make_color_picker: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'color');
        e.set = function (value) {
            this.value = value;
        }
        e.get = function () {
            return this.value;
        }
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('input', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_range: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'range');
        e.set = function (value) {
            this.value = value * 100;
        }
        e.get = function () {
            return parseFloat(this.value) / 100;
        }
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('input', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_checkbox: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'checkbox');
        e.set = function (value) {
            this.checked = value;
        }
        e.get = function () {
            return this.checked;
        }
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('click', params.callback);
            if (params.value) e.set(value);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_numeric: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'number');
        e.set = function (value) {
            this.value = value;
        }
        e.get = function () {
            return parseFloat(this.value);
        }
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('change', params.callback);
            if (params.value) e.set(params.value);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_button: function (params) {
        var e = document.createElement('input');
        e.setAttribute('type', 'button');
        e.set = function (value) {
            this.value = value;
        }
        e.get = function () {
            return this.value;
        }
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('click', params.callback);
            if (params.value) e.set(params.value);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_select: function (params) {
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
                if (this.label) {
                    this.parentNode.style.display = 'none';
                } else {
                    this.style.display = 'none';
                }
            }
            e.show = function () {
                if (this.label) {
                    this.parentNode.style.display = '';
                } else {
                    this.style.display = '';
                }
            }
            e.add = function (value, text) {
                var e = document.createElement('option');
                e.value = value;
                if (text) e.innerHTML = text;
                else e.innerHTML = value;
                this.appendChild(e);
            }
            if (params.callback) e.addEventListener('change', params.callback);
            if (params.label) e.label = params.label;
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_file_picker: function (params) {
        var e = document.createElement('input'); 
        e.setAttribute('type', 'file'); 
        e.addEventListener('click', function () {
            this.value = null;
        });
        e.hide = function () {
            if (this.label) {
                this.parentNode.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        }
        e.show = function () {
            if (this.label) {
                this.parentNode.style.display = '';
            } else {
                this.style.display = '';
            }
        }
        if (params) {
            if (params.label) e.label = params.label;
            if (params.style) e.setAttribute('style', params.style);
            if (params.callback) e.addEventListener('change', params.callback);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },
    make_label: function (text, params) {
        var e = document.createElement('span'); 
        e.innerHTML = text;
        if (params) {
            if (params.style) e.setAttribute('style', params.style);
            if (params.key) this.gui[params.key] = e;
        }
        return e;
    },

    make_div: function (params) {
        var e = document.createElement('div');
        e.append =  function (e) {
            if (e.label) {
                var span = document.createElement('span');
                span.innerHTML = e.label;
                span.appendChild(e);
                e = span;
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
            if (params.style) e.setAttribute('style', style);
            if (params.title) {
                e.label = document.createElement('span');
                e.label.innerHTML = params.title;
                if (params.title_style) e.label.setAttribute('style', title_style);
            }
        }
        return e;
    },

    make_gui_root: function (e) {
        this.gui_roots.push(e);
    },

    create_html: function (root) {
        for (var key in this.gui_roots) {
            var e = this.gui_roots[key];
            if (e.label) {
                root.appendChild(e.label);
                root.appendChild(document.createElement('br'));
            }
            root.appendChild(e);
        }
    }
});

// VIEW

HexaLab.View = function (view) {
    HexaLab.DynamicInterface.call(this);

    var self = this;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.light = new THREE.PointLight(),
    this.ambient_light = new THREE.AmbientLight(0x404040);
    this.camera.add(this.light);
    this.scene.add(this.camera);
    this.scene.add(this.ambient_light);
    this.view = view;
    this.renderer_settings = {};
    this.camera_settings = {};
    this.webGL = true;  // TODO split into 2 superclasses

    this.make_gui_root(this.make_div({
        title: 'renderer settings'
    }).append(this.make_color_picker({
        key: 'background_color',
        label: 'background',
        callback: function () {
            self.set_background_color(this.get());
            self.update();
        },
    })).newline().append(this.make_color_picker({
        key: 'light_color',
        label: 'light',
        callback: function () {
            self.set_light_color(this.get());
            self.update();
        },
    })).newline().append(this.make_checkbox({
        key: 'occlusion',
        label: 'occlusion',
        callback: function () {
            self.show_occlusion(this.get());
            self.update();
        }
    })));

    var default_settings = {
        camera: {
            offset: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(0, 0, -1),
            distance: 2
        },
        occlusion: false,
        background: '#ffffff',
        light: '#ffffff'
    };

    var set_base_settings = function (settings) {
        this.set_background_color(settings.background);
        this.set_light_color(settings.light);
        this.camera_settings.offset = settings.camera.offset;
        this.camera_settings.direction = settings.camera.direction;
        this.camera_settings.distance = settings.camera.distance;
        this.set_camera(new THREE.Vector3().addVectors(settings.camera.offset, this.get_center()), settings.camera.direction, settings.camera.distance * this.get_size());
        this.show_occlusion(settings.occlusion);
    }.bind(this);

    this.set_settings = function (settings) {
        set_base_settings(settings);
        this.on_settings_change(settings);
    },

    this.clear_settings = function () {
        var settings = Object.assign(default_settings, this.default_settings);
        this.set_settings(settings);
    },

    set_base_settings(default_settings);
};

HexaLab.View.prototype = Object.assign(Object.create(HexaLab.DynamicInterface.prototype), {

    // Utility to plug a model from the view.cpp straight into the scene

    update_model: function (model) {
        this.scene.remove(model.surface.mesh);
        model.surface.geometry.removeAttribute('position');
        if (model.buffers.surface_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, model.buffers.surface_pos().data(), model.buffers.surface_pos().size() * 3);
            model.surface.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        model.surface.geometry.removeAttribute('normal');
        if (model.buffers.surface_norm().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, model.buffers.surface_norm().data(), model.buffers.surface_norm().size() * 3);
            model.surface.geometry.addAttribute('normal', new THREE.BufferAttribute(buffer, 3));
        }
        model.surface.geometry.removeAttribute('color');
        if (model.buffers.surface_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, model.buffers.surface_color().data(), model.buffers.surface_color().size() * 3);
            model.surface.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }
        if (model.buffers.surface_pos().size() != 0) {
            model.surface.mesh = new THREE.Mesh(model.surface.geometry, model.surface.material);
            this.scene.add(model.surface.mesh);
        }

        this.scene.remove(model.wireframe.mesh);
        model.wireframe.geometry.removeAttribute('position');
        if (model.buffers.wireframe_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, model.buffers.wireframe_pos().data(), model.buffers.wireframe_pos().size() * 3);
            model.wireframe.geometry.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        model.wireframe.geometry.removeAttribute('color');
        if (model.buffers.wireframe_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, model.buffers.wireframe_color().data(), model.buffers.wireframe_color().size() * 3);
            model.wireframe.geometry.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }
        if (model.buffers.wireframe_pos().size() != 0) {
            model.wireframe.mesh = new THREE.LineSegments(model.wireframe.geometry, model.wireframe.material);
            this.scene.add(model.wireframe.mesh);
        }
    },

    // Implementation Api

    on_update: function () {
        console.warn('Function "on_update" not implemented for view ' + this.get_name() + '.');
    },

    on_settings_change: function () {
        console.warn('Function "on_settings_change" not implemented for view ' + this.get_name() + '.');
    },

    on_mesh_change: function () {
        console.warn('Function "on_mesh_change" not implemented for view ' + this.get_name() + '.');
    },

    on_resize: function () {
        console.warn('Function "on_resize" not implemented for view ' + this.get_name() + '.');
    },

    serialize_settings: function () {
        console.warn('Function "serialize_settings" not implemented for view ' + this.get_name() + '.');
    },

    // Api

    get_name: function() { 
        return Pointer_stringify(this.view.get_name());
    },

    get_center: function () {
        if (this.view != null) {
            var c = this.view.get_center();
            var center = new THREE.Vector3(c.x(), c.y(), c.z());
            c.delete();
            return center;
        } else {
            return new THREE.Vector3(0, 0, 0);
        }
    },

    get_size: function () {
        return this.view != null ? this.view.get_size() : 0;
    },

    get_settings: function () {
        return Object.assign({
            camera: {
                offset: new THREE.Vector3().subVectors(this.controls.target, this.get_center()), 
                direction: this.camera.getWorldDirection(), 
                distance: this.camera.position.distanceTo(this.get_center()) / this.get_size(), 
            },
            occlusion: this.renderer_settings.occlusion,
            background: this.renderer_settings.background,
            light: this.light.color
        }, this.serialize_settings());
    },

    resize: function() {
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();

        this.on_resize();
    },

    update: function () {
        this.view.update();
        this.on_update();
    },

    set_camera: function (target, direction, distance) {
        if (this.canvas) {
            if (this.controls) this.controls.dispose();
            this.controls = new THREE.TrackballControls(this.camera, this.canvas.container);
            this.controls.rotateSpeed = 10;
            this.controls.dynamicDampingFactor = 1;
            this.controls.target = target.clone();
        }

        this.camera.position.set(target.x, target.y, target.z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3().addVectors(target, direction));
        this.camera.translateZ(distance);
    },

    set_mesh: function (mesh) {
        this.view.set_mesh(mesh);
        this.set_camera(new THREE.Vector3().addVectors(this.camera_settings.offset, this.get_center()), this.camera_settings.direction, this.camera_settings.distance * this.get_size());
        this.on_mesh_change(mesh);
        this.update();
    },

    set_background_color: function (color) {
        this.renderer_settings.background = color;
        this.gui.background_color.set(color);
    },
    
    show_occlusion: function (show) {
        this.renderer_settings.occlusion = show;
        this.gui.occlusion.set(show);
    },

    set_light_color: function (color) {
        this.light.color.set(color);
        this.gui.light_color.set(color);
    },

    set_canvas: function (canvas) {
        this.canvas = canvas;
        this.resize();
        this.set_camera(new THREE.Vector3().addVectors(this.camera_settings.offset, this.get_center()), this.camera_settings.direction, this.camera_settings.distance * this.get_size());
    }
});

// HEXALAB

HexaLab.Context = function (frame_id, gui_id) {

    var self = this;

    // Dynamic interface

    HexaLab.DynamicInterface.call(this);

    var mesh_reader = new FileReader();
    var settings_reader = new FileReader();

    this.make_gui_root(this.make_div().append(this.make_select({
        key: 'views_select',
        label: "View:",
        values: {},
        callback: function () {
            self.set_view(this.get());
        }
    })).newline().append(this.make_file_picker({
        key: 'mesh_picker',
        label: 'mesh',
        callback: function () {
            var file = this.files[0];
            mesh_reader.onload = function () {
                var data = new Int8Array(this.result);
                self.make_file(data, file.name);
                self.import_mesh(file.name);
            }
            mesh_reader.readAsArrayBuffer(file, "UTF-8");
        }
    })).newline().append(this.make_file_picker({
        key: 'settings_picker',
        label: 'settings',
        callback: function () {
            settings_reader.onload = function () {
                var settings = JSON.parse(this.result);
                self.set_settings(settings);
            }
            settings_reader.readAsText(this.files[0], "UTF-8");
        }
    })).newline().append(this.make_button({
        key: 'snapshot',
        value: 'Snapshot',
        callback: function () {
            elf.canvas.container.getElementsByTagName('canvas')[0].toBlob(function (blob) {
                saveAs(blob, "HLsnapshot.png");
            }, "image/png");
        }
    })).newline().append(this.make_button({
        key: 'settings_saver',
        value: 'Export settings',
        callback: function () {
            var settings = JSON.stringify(self.get_settings(), null, 4);
            var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "HLsettings.txt");
        }
    })));

    this.create_html(document.getElementById(gui_id));
    
    // Canvas

    this.canvas = {
        container: document.getElementById(frame_id),
        width: document.getElementById(frame_id).offsetWidth,
        height: document.getElementById(frame_id).offsetHeight,
    };

    // Views

    this.views = [];
    this.gui_container = document.getElementById(gui_id);

    // Renderer

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
    });
    
    this.depth_prepass = {
        material: new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            blending: THREE.NoBlending
        }),
        target: new THREE.WebGLRenderTarget(this.canvas.width, this.canvas.height)
    };

    this.render_pass = new THREE.RenderPass(null, null);

    this.ssao_pass = new THREE.ShaderPass(THREE.SSAOShader);
    this.ssao_pass.enabled = false;
    this.ssao_pass.renderToScreen = true;
    this.ssao_pass.uniforms['tDepth'].value = this.depth_prepass.target.texture;
    this.ssao_pass.uniforms['size'].value.set(this.canvas.width, this.canvas.height);
    this.ssao_pass.uniforms['cameraNear'].value = 0.1;   // TODO param
    this.ssao_pass.uniforms['cameraFar'].value = 1000;
    this.ssao_pass.uniforms['onlyAO'].value = false;

    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(this.render_pass);
    this.composer.addPass(this.ssao_pass);

    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.canvas.container.appendChild(this.renderer.domElement);

    // Resize

    window.addEventListener('resize', this.on_resize.bind(this));
};
 
HexaLab.Context.prototype = Object.assign(Object.create(HexaLab.DynamicInterface.prototype), {
    // view

    add_view: function (view) {
        this.views[view.get_name()] = view;
        this.gui.views_select.add(view.get_name());
        view.set_canvas(this.canvas);
    },

    set_view: function (view) {
        if (typeof view == 'string' || view instanceof String) {
            if (!this.views[view]) {
                alert('View "' + view + '" not found!');
                return;
            }
            this.view = this.views[view];
        } else {    // TODO use proper inheritance, check for instanceof View, abort if false
            this.view = view;
        }

        this.gui.views_select.set(this.view.get_name());

        // clear previous gui
        while (this.gui_container.firstChild) {
            this.gui_container.removeChild(this.gui_container.firstChild);
        }

        // create new gui
        this.create_html(this.gui_container);
        this.view.create_html(this.gui_container);
    },

    // settings

    on_resize: function () {
        this.canvas.width = document.getElementById('frame').offsetWidth;
        this.canvas.height = document.getElementById('frame').offsetHeight;
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        for (var key in this.views) {
            this.views[key].resize();
        };

        this.depth_prepass.target = new THREE.WebGLRenderTarget(this.canvas.width, this.canvas.height);
        this.ssao_pass.uniforms['tDepth'].value = this.depth_prepass.target.texture;
        this.ssao_pass.uniforms['size'].value.set(this.canvas.width, this.canvas.height);

        log('Frame resized to ' + this.canvas.width + 'x' + this.canvas.height);
    },

    set_settings: function (settings) {
        for (var key in this.views) {
            if (settings[key]) {
                this.views[key].set_settings(settings[key]);
            }
        }
    },

    set_background_color: function (color) {
        this.renderer.setClearColor(color);
    },

    show_occlusion: function (show) {
        this.ssao_pass.enabled = show;
    },

    get_settings: function () {
        var settings = {};
        for (var key in this.views) {
            settings[key] = this.views[key].get_settings();
        }
        return settings;
    },

    // mesh

    import_mesh: function (path) {
        var result = Module.import_mesh(path);
        if (result) {
            for (var key in this.views) {
                this.views[key].set_mesh(Module.get_mesh());
            };
        }
    },

    // Animate

    animate: function () {
        if (this.view) {
            // update view controls
            this.view.controls.update();

            // prepare renderer
            this.show_occlusion(this.view.renderer_settings.occlusion);
            this.set_background_color(this.view.renderer_settings.background);
            this.render_pass.scene = this.view.scene;
            this.render_pass.camera = this.view.camera;

            // render
            if (this.composer && this.ssao_pass.enabled) {
                this.view.scene.overrideMaterial = this.depth_prepass.material;
                this.renderer.render(this.view.scene, this.view.camera, this.depth_prepass.target, true);
                this.view.scene.overrideMaterial = null;
                this.composer.render();
            } else {
                this.renderer.render(this.view.scene, this.view.camera);
            }
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this));
    }
});

// Automated global context

HexaLab.views = [];
HexaLab.register_view = function (view) {
    this.views[view.get_name()] = view;
}
HexaLab.init = function (frame_id, gui_id) {
    this.context = new HexaLab.Context(frame_id, gui_id);
    this.context.views = this.views;
    //this.context.animate();
}
