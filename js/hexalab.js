"use strict";

var HexaLab = {
    file_exists: function (path) {
        var stat = FS.stat(path);
        if (!stat) return false;
        return FS.isFile(stat.mode);
    },
    make_file: function (data, name) {
        try {
            if (HexaLab.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
        FS.createDataFile("/", name, data, true, true);
    }
};

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
                var e = document.createElement('option');
                e.value = value;
                text ? e.innerHTML = text : e.innerHTML = value;
                this.appendChild(e);
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

    append_html: function (root) {
        for (var key in this.roots) {
            var e = this.roots[key];
            root.appendChild(e);
        }
    }
});

// VIEW

HexaLab.View = function (view) {
    var self = this;
    this.gui = new HexaLab.DynamicInterface();
    this.view = view;
    this.mesh = null;
};

Object.assign(HexaLab.View.prototype, {
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

    serialize_settings: function () {
        console.warn('Function "serialize_settings" not implemented for view ' + this.get_name() + '.');
    },

    on_resize: function (width, height) {
        console.warn('Function "on_resize" not implemented for view ' + this.get_name() + '.');
    },

    // Api

    get_name: function () {
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

    get_settings: function () {
        this.serialize_settings();
    },

    get_size: function () {
        return this.view != null ? this.view.get_size() : 0;
    },

    update: function () {
        this.view.update();
        this.on_update();
    },

    set_mesh: function (mesh) {
        this.mesh = mesh;
        this.view.set_mesh(mesh);
        this.on_mesh_change(mesh);
        this.update();
    },

    resize: function (width, height) {
        this.on_resize(width, height);
    }
});

HexaLab.WebGLView = function (view, camera_id) {

    HexaLab.View.call(this, view);

    if (camera_id) {
        this.camera = camera_id;
    } else {
        this.camera = 'default';
    }

    this.scene = new THREE.Scene();
    this.camera_light = new THREE.PointLight(),
    this.ambient_light = new THREE.AmbientLight(0x404040);
    this.scene.add(this.ambient_light);
    this.renderer_settings = {};

    var self = this;
    this.gui.new_frame({
        title: 'Renderer Settings'
    }).append(this.gui.group().append(this.gui.color_picker({
        key: 'background_color',
        label: 'Background',
        callback: function () {
            self.set_background_color(this.get());
            self.update();
        },
    })).newline().append(this.gui.color_picker({
        key: 'light_color',
        label: 'Light',
        callback: function () {
            self.set_light_color(this.get());
            self.update();
        },
    })).newline().append(this.gui.checkbox({
        key: 'occlusion',
        label: 'Occlusion',
        callback: function () {
            self.show_occlusion(this.get());
            self.update();
        }
    })));

    var default_settings = {
        occlusion: false,
        background: '#ffffff',
        light: '#ffffff'
    };

    var set_base_settings = function (settings) {
        this.set_background_color(settings.background);
        this.set_light_color(settings.light);
        this.show_occlusion(settings.occlusion);
    }.bind(this);

    this.set_settings = function (settings) {
        set_base_settings(settings);
        this.on_settings_change(settings);
    },

    set_base_settings(default_settings);
};

HexaLab.WebGLView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {

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

    // Api

    get_settings: function () {
        return Object.assign({
            occlusion: this.renderer_settings.occlusion,
            background: this.renderer_settings.background,
            light: this.camera_light.color
        }, HexaLab.View.prototype.get_settings.call(this));
    },

    // Setters

    set_background_color: function (color) {
        this.renderer_settings.background = color;
        this.gui.map.background_color.set(color);
    },

    show_occlusion: function (show) {
        this.renderer_settings.occlusion = show;
        this.gui.map.occlusion.set(show);
    },

    set_light_color: function (color) {
        this.camera_light.color.set(color);
        this.gui.map.light_color.set(color);
    }
})

HexaLab.HTMLView = function (view) {
    HexaLab.View.call(this, view);
    this.content = new HexaLab.DynamicInterface();
}

HexaLab.HTMLView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {
})

// HEXALAB

HexaLab.Camera = function (frame, canvas) {
    this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
    //this.controls = new THREE.TrackballControls(this.camera, frame);
    this.canvas = canvas;
    this.frame = frame;
    this.settings = this.default_settings;
}
Object.assign(HexaLab.Camera.prototype, {
    default_settings: {
        offset: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1),
        distance: 2
    },

    on_resize: function () {
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();
    },

    attach: function (view) {
        this.view = view;
        this.set_transform(new THREE.Vector3().addVectors(this.settings.offset, view.get_center()),
            this.settings.direction,
            this.settings.distance * view.get_size());
        view.scene.add(this.camera);
        this.camera.add(view.camera_light);
    },

    detach: function () {
        if (this.view) {
            this.view.scene.remove(this.camera);
            this.camera.remove(this.view.camera_light);
            if (this.controls) this.controls.dispose();
            this.update_settings()
            this.view = null;
        }
    },

    update_settings: function () {
        if (this.view && this.view.mesh) {
            this.settings = {
                offset: new THREE.Vector3().subVectors(this.controls.target, this.view.get_center()),
                direction: this.camera.getWorldDirection(),
                distance: this.camera.position.distanceTo(this.controls.target) / this.view.get_size(),
            };
        }
    },

    get_settings: function () {
        this.update_settings();
        return this.settings;
    },

    set_settings: function (settings) {
        this.settings = settings;
    },

    set_transform: function (target, direction, distance) {
        if (this.controls) this.controls.dispose();
        this.controls = new THREE.TrackballControls(this.camera, this.frame);
        this.controls.rotateSpeed = 10;
        this.controls.dynamicDampingFactor = 1;
        this.controls.target = target.clone();

        this.camera.position.set(target.x, target.y, target.z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3().addVectors(target, direction));
        this.camera.translateZ(distance);
    },
})

HexaLab.Context = function (frame_id, gui_id) {

    var self = this;

    // Dynamic interface

    this.gui = new HexaLab.DynamicInterface();

    var mesh_reader = new FileReader();
    var settings_reader = new FileReader();

    this.gui.new_frame({
        title: 'HexaLab'
    }).append(this.gui.group().append(this.gui.select({
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
                HexaLab.make_file(data, file.name);
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
    })).newline().append(this.gui.button({
        key: 'snapshot',
        value: 'Snapshot',
        callback: function () {
            self.canvas.element.toBlob(function (blob) {
                saveAs(blob, "HLsnapshot.png");
            }, "image/png");
        }
    })));

    this.gui.append_html(document.getElementById(gui_id));
    
    // Canvas

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
    };
    this.html = {
        element: document.createElement('div'),
        clear: function () {
            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }
        }
    }

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
    this.ssao_pass.uniforms['cameraNear'].value = 0.1;
    this.ssao_pass.uniforms['cameraFar'].value = 1000;
    this.ssao_pass.uniforms['onlyAO'].value = false;

    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.setSize(this.canvas.width, this.canvas.height);
    this.composer.addPass(this.render_pass);
    this.composer.addPass(this.ssao_pass);

    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.canvas.element = this.renderer.domElement;
    //this.frame.container.appendChild(this.canvas.element);

    // Resize

    window.addEventListener('resize', this.resize.bind(this));

    // Cameras

    this.cameras = {};
    this.cameras.default = new HexaLab.Camera(this.frame.element, this.canvas);
};
 
Object.assign(HexaLab.Context.prototype, {
    // view

    add_view: function (view) {
        this.views[view.get_name()] = view;
        this.gui.map.views_select.add(view.get_name());
        if (view instanceof HexaLab.WebGLView) {
            if (!this.cameras[view.camera]) {
                this.cameras[view.camera] = new HexaLab.Camera(this.frame.element, this.canvas);
            }
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

        // update camera
        if (this.view instanceof HexaLab.WebGLView) {
            this.cameras[this.view.camera].detach(this.view);
        }
        if (new_view instanceof HexaLab.WebGLView) {
            this.cameras[new_view.camera].attach(new_view);
        }

        // update view
        this.view = new_view;
        this.gui.map.views_select.set(this.view.get_name());

        // clear previous gui
        while (this.gui_container.firstChild) {
            this.gui_container.removeChild(this.gui_container.firstChild);
        }

        // create new gui
        this.gui.append_html(this.gui_container);
        this.view.gui.append_html(this.gui_container);

        // update frame content
        if (this.view instanceof HexaLab.WebGLView && this.frame.content != this.canvas.element) {
            this.frame.clear();
            this.frame.set_content(this.canvas.element);

        } else if (this.view instanceof HexaLab.HTMLView && this.frame.content != this.html.element) {
            this.html.clear();
            this.view.content.append_html(this.html.element);
            this.frame.clear();
            this.frame.set_content(this.html.element);
        }

        if (new_view instanceof HexaLab.HTMLView) {
            new_view.resize(this.canvas.width, this.canvas.height);
        }
    },

    // settings

    resize: function () {
        this.canvas.width = document.getElementById('frame').offsetWidth;
        this.canvas.height = document.getElementById('frame').offsetHeight;
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        for (var key in this.cameras) {
            this.cameras[key].on_resize();
        }
        for (var key in this.views) {
            this.views[key].resize(this.canvas.width, this.canvas.height);
        }

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
        for (var key in settings.cameras) {
            if (!this.cameras[key]) {
                this.cameras[key] = new HexaLab.Camera(this.frame.element, this.canvas);
            }
            this.cameras.key.set_settings(settings.cameras.key);
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
            if (this.view && this.view instanceof HexaLab.WebGLView) {
                this.cameras[this.view.camera].detach()
            }
            for (key in this.cameras) {
                this.cameras[key].set_settings(this.cameras[key].default_settings);
            }
            for (var key in this.views) {
                this.views[key].set_mesh(Module.get_mesh());
            }
            if (this.view && this.view instanceof HexaLab.WebGLView) {
                this.cameras[this.view.camera].attach(this.view);
            }
        }
    },

    // Animate

    animate: function () {
        if (this.view) {
            if (this.view instanceof HexaLab.WebGLView) {
                // update view controls
                this.cameras[this.view.camera].controls.update();

                // prepare renderer
                this.show_occlusion(this.view.renderer_settings.occlusion);
                this.set_background_color(this.view.renderer_settings.background);
                this.render_pass.scene = this.view.scene;
                this.render_pass.camera = this.cameras[this.view.camera].camera;

                // render
                if (this.composer && this.ssao_pass.enabled) {
                    this.view.scene.overrideMaterial = this.depth_prepass.material;
                    this.renderer.render(this.view.scene, this.cameras[this.view.camera].camera, this.depth_prepass.target, true);
                    this.view.scene.overrideMaterial = null;
                    this.composer.render();
                } else {
                    this.renderer.render(this.view.scene, this.cameras[this.view.camera].camera);
                }
            }
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this));
    }
});
