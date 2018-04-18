"use strict";

//var HexaLab = {}
HexaLab.filters = [];

// --------------------------------------------------------------------------------
// Model
// --------------------------------------------------------------------------------
// Maps straight to a cpp model class. Pass the cpp model instance and the
// three.js materials for both surface and wframe as parameters.
// Update fetches the new buffers from the model backend.

HexaLab.BufferGeometry = function (backend) {
    this.surface = new THREE.BufferGeometry()
    this.wireframe = new THREE.BufferGeometry()
    this.backend = backend
}

Object.assign(HexaLab.BufferGeometry.prototype, {
    update: function () {
        this.surface.removeAttribute('position');
        const x = this.backend.surface_pos().size()
        if (this.backend.surface_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_pos().data(), this.backend.surface_pos().size() * 3);
            this.surface.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.surface.removeAttribute('normal');
        if (this.backend.surface_norm().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_norm().data(), this.backend.surface_norm().size() * 3);
            this.surface.addAttribute('normal', new THREE.BufferAttribute(buffer, 3));
        } else {
            this.surface.computeVertexNormals()
        }
        this.surface.removeAttribute('color');
        if (this.backend.surface_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_color().data(), this.backend.surface_color().size() * 3);
            this.surface.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
        }

        this.wireframe.removeAttribute('position');
        if (this.backend.wireframe_pos().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_pos().data(), this.backend.wireframe_pos().size() * 3);
            this.wireframe.addAttribute('position', new THREE.BufferAttribute(buffer, 3));
        }
        this.wireframe.removeAttribute('color');
        if (this.backend.wireframe_color().size() != 0) {
            var buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_color().data(), this.backend.wireframe_color().size() * 3);
            this.wireframe.addAttribute('color', new THREE.BufferAttribute(buffer, 3));
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

    on_mesh_change: function (mesh) {   // cpp MeshStats data structure
        console.warn('Function "on_mesh_change" not implemented for filter ' + this.name + '.');
    },

    set_settings: function (settings) { // whatever was read from the settings json
        console.warn('Function "set_settings" not implemented for filter ' + this.name + '.');
    },

    get_settings: function () {         // whatever the filter wants to write to the settings json
        console.warn('Function "get_settings" not implemented for filter ' + this.name + '.');
    }
});

// --------------------------------------------------------------------------------
// Viewer
// --------------------------------------------------------------------------------

HexaLab.Viewer = function (canvas_width, canvas_height) {
    const self = this
    this.settings = {
        ao: 'object space',
        aa: 'msaa',
        background: 0xffffff,
    };

    this.width = canvas_width
    this.height = canvas_height
    this.aspect = this.width / this.height

    this.setup_renderer()

    this.gizmo = function (size) {
        var obj = new THREE.Object3D()
        obj.position.set(0, 0, 0)

        var origin = new THREE.Vector3(0, 0, 0)
        var arrows = {
            x: new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, size, 0xff0000),
            y: new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, size, 0x00ff00),
            z: new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, size, 0x0000ff),
        }

        obj.add(arrows.x)
        obj.add(arrows.y)
        obj.add(arrows.z)

        return obj
    }(1);
    this.hud_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000)
    this.hud_camera.position.set(0, 0, 0)

    this.scene = new THREE.Scene()

    this.scene_camera = new THREE.PerspectiveCamera(30, this.aspect, 0.1, 1000)
    this.scene_light = new THREE.PointLight()
    // this.scene_light = new THREE.AmbientLight()

    //this.scene_world = new THREE.Matrix4()

    // Materials
    this.materials = []
    this.materials.visible_surface      = new THREE.MeshBasicMaterial({
        vertexColors:                   THREE.VertexColors,
        polygonOffset:                  true,
        polygonOffsetFactor:            0.5,
    })
    this.materials.visible_wireframe    = new THREE.LineBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
        polygonOffset:                  true,
        polygonOffsetFactor:            0.5,
        vertexColors:                   THREE.VertexColors,
    })
    this.materials.filtered_surface     = new THREE.MeshBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.filtered_wireframe   = new THREE.LineBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.singularity_surface  = new THREE.MeshLambertMaterial({
        transparent:                    true,
        depthWrite:                     true,
        polygonOffset:                  true,
        polygonOffsetFactor:            -1.0,
        vertexColors:                   THREE.VertexColors,
        side:                           THREE.DoubleSide,
    })
    this.materials.singularity_wireframe= new THREE.LineBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
        vertexColors:                   THREE.VertexColors,
        linewidth:                      1,
    })

    // BufferGeometry instances
    this.buffers = []
    this.buffers.visible                = new HexaLab.BufferGeometry(HexaLab.app.backend.get_visible_model())
    this.buffers.filtered               = new HexaLab.BufferGeometry(HexaLab.app.backend.get_filtered_model())
    this.buffers.singularity            = new HexaLab.BufferGeometry(HexaLab.app.backend.get_singularity_model())
    // this.buffers.boundary_singularity   = new HexaLab.BufferGeometry(HexaLab.app.backend.get_boundary_singularity_model())
    // this.buffers.boundary_creases       = new HexaLab.BufferGeometry(HexaLab.app.backend.get_boundary_creases_model())
    this.buffers.update = function () {
        const x = HexaLab.app.backend.update_models()
        this.visible.update()
        this.filtered.update()
        this.singularity.update()
    }

    // THREE.js renderables
    this.renderables = []
    function make_renderable_surface (name, material) {
        self.renderables[name] = self.renderables[name] || {}
        self.renderables[name].surface = new THREE.Mesh(self.buffers[name].surface, material)
        self.renderables[name].surface.frustumCulled = false  // TODO ?
    }
    function make_renderable_wireframe (name, material) {
        self.renderables[name] = self.renderables[name] || {}
        self.renderables[name].wireframe = new THREE.LineSegments(self.buffers[name].wireframe, material)
        self.renderables[name].wireframe.frustumCulled = false  // TODO ?
    }

    make_renderable_surface     ('visible',     this.materials.visible_surface)
    make_renderable_surface     ('filtered',    this.materials.filtered_surface)
    make_renderable_surface     ('singularity', this.materials.singularity_surface)
    
    make_renderable_wireframe   ('visible',     this.materials.visible_wireframe)
    make_renderable_wireframe   ('filtered',    this.materials.filtered_wireframe)
    make_renderable_wireframe   ('singularity', this.materials.singularity_wireframe)
    // make_wireframe_renderable('boundary_singularity', this.visible_wireframe_material)
    // make_wireframe_renderable('boundary_creases', this.visible_wireframe_material)

    // additional meshes
    this.meshes = new THREE.Group() // TODO add_mesh api

    // RENDER PASSES/MATERIALS SETUP

    this.fullscreen_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.fullscreen_quad   = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null)

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

    // SSAO
    /*
        http://john-chapman-graphics.blogspot.it/2013/01/ssao-tutorial.html
        Prepass of both depth and normals
        Then accumulate ssao sampling from an hemisphere oriented along the fragment normal
        Finally blur and blend
        TODOs:
            Unify depth and normal passes
            Split blur in two passes
    */
    var num_samples = 16
    var kernel = new Float32Array(num_samples * 3)
    var n = new THREE.Vector3(0, 0, 1);
    for (var i = 0; i < num_samples * 3; i += 3) {
        var v;
        do {
            v = new THREE.Vector3(
                Math.random() * 2.0 - 1.0,
                Math.random() * 2.0 - 1.0,
                Math.random()
            ).normalize()
        } while(v.dot(n) < 0.15)
        var scale = i / (num_samples * 3)
        scale = 0.1 + scale * scale * 0.9
        kernel[i + 0] = v.x * scale
        kernel[i + 1] = v.y * scale
        kernel[i + 2] = v.z * scale
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
        THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter)
    noise_tex.needsUpdate = true

    // Render depth and normals on an off texture
    this.normal_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.SSAOPre.vertexShader,
            fragmentShader: THREE.SSAOPre.fragmentShader,
            uniforms: {
            },
        }),
        target: new THREE.WebGLRenderTarget(this.width, this.height, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: true,
        })
    }
    // TODO remove?
    //this.normal_pass.target.texture.generateMipmaps = false;
    this.normal_pass.target.depthTexture = new THREE.DepthTexture();
    this.normal_pass.target.depthTexture.type = THREE.UnsignedShortType;

    this.depth_pass = {
        material: new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking
        }),
        target: new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
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
                uSize: { value: new THREE.Vector2(this.width, this.height) },
                uNear: { value: 0.1 },
                uFar: { value: 1000 },
                uKernel: { value: kernel },
                tNoise: { value: noise_tex }
            },
            defines: {
                numSamples: 16,
            }
        }),
        target: new THREE.WebGLRenderTarget(this.width, this.height, {
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
                uSize: { value: new THREE.Vector2(this.width, this.height) },
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

    // AO
    /*
        Current mesh verts pos on texture A
        Current mesh verts norm on texture B
        AO accumulation on texture C
            All of the same size so that fragment shader texture samples using fragment uv access each vert only once
        Light occlusion pass on texture D of arbitrary size
        Before each accumulation step the occlusion texture is re-rendered from the current light POV 
        TODOs:
            for occlusion render depth instead of view-space position
    */
    this.viewpos_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.AOPre.vertexShader,
            fragmentShader: THREE.AOPre.fragmentShader,
            uniforms: {
            },
        }),
        target: new THREE.WebGLRenderTarget(120, 120, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: true,
        })
    },
    this.ao_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.AOEval.vertexShader,
            fragmentShader: THREE.AOEval.fragmentShader,
            uniforms: {
                tNorm: { value: null },     // created on on_mesh_change
                tVert: { value: null },     // created on on_mesh_change
                tDepth: { value: this.viewpos_pass.target.texture },
                uModel: { value: new THREE.Matrix4() },
                uView: { value: new THREE.Matrix4() },
                uProj: { value: new THREE.Matrix4() },
                uCamPos: { value: new THREE.Vector3() },
                uDepthBias: null
            },
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
            transparent: true,
            depthTest: false,
            depthWrite: false
        }),
        samples: 1024,
        views: [],
        cones: [],
        progress: null,
        timer: null,
        paused: false,
    }
    this.ao_cache = {}
}

Object.assign(HexaLab.Viewer.prototype, {

    setup_renderer: function() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.settings.aa == 'msaa',
            preserveDrawingBuffer: true,    // disable hidden/automatic clear of the rendertarget
            alpha: true                     // to have an alpha on the rendertarget? (needed for setClearAlpha to work)
        });
        this.renderer.setSize(this.width, this.height)
        this.renderer.autoClear = false
        this.renderer.setClearColor(this.settings.background, 1.0)
        this.renderer.clear()
    },

    get_element: function () { return this.renderer.domElement },
    get_scene_camera: function () { return this.scene_camera },

    // Settings
    set_background_color:   function (color) { this.settings.background = color },
    set_light_intensity:    function (intensity) { this.scene_light.intensity = intensity },
    set_ao_mode:            function (value) { this.settings.ao = value },
    set_aa_mode:            function (value) { this.settings.aa = value; /*this.init_backend()*/ },
    get_background_color:   function () { return this.settings.background },
    get_light_intensity:    function () { return this.scene_light.intensity },
    get_ao_mode:            function () { return this.settings.ao },
    get_aa_mode:            function () { return this.settings.aa },

    on_geometry_buffers_update: function () { this.dirty_geometry = true; HexaLab.app.backend.flag_models_as_dirty() },
    on_color_buffers_update:    function () { this.dirty_color = true },

    add_mesh:               function (mesh) { this.meshes.add(mesh) },
    remove_mesh:            function (mesh) { this.meshes.remove(mesh) },

    reset_osao: function () {
        // determine ao textures size
        const pos_attrib    = this.buffers.visible.surface.attributes.position
        const norm_attrib   = this.buffers.visible.surface.attributes.normal
        const color_attrib  = this.buffers.visible.surface.attributes.color
        let t_size  = 1
        while (t_size * t_size < pos_attrib.count) {   // count is number of vec3 items
            t_size *= 2
        }
        // create and fill ao textures
        let pos_tex_data    = new Float32Array(t_size * t_size * 4)
        let norm_tex_data   = new Float32Array(t_size * t_size * 4)
        let a = new THREE.Vector3(),
            b = new THREE.Vector3(),
            c = new THREE.Vector3(),
            d = new THREE.Vector3()
        for (let i = 0; i < pos_attrib.count / 6; ++i) {
            a.set(pos_attrib.array[i * 18 +  0], pos_attrib.array[i * 18 +  1], pos_attrib.array[i * 18 +  2])
            b.set(pos_attrib.array[i * 18 +  3], pos_attrib.array[i * 18 +  4], pos_attrib.array[i * 18 +  5])
            c.set(pos_attrib.array[i * 18 +  6], pos_attrib.array[i * 18 +  7], pos_attrib.array[i * 18 +  8])
            // skip the first vertex of the second face since it's the same as the last of the first face
            d.set(pos_attrib.array[i * 18 + 12], pos_attrib.array[i * 18 + 13], pos_attrib.array[i * 18 + 14])
            // skip the last vertex of the second face since it's the same as the first of the first face
            let center = new THREE.Vector3().add(a).add(b).add(c).add(d).multiplyScalar(0.25)    // average
            
            // TODO in offset calculation, account for triangle screen size ?
            let v
            v = a.clone()
            v.add(new THREE.Vector3().add(center).sub(a).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 +  0] = v.x
            pos_tex_data[i * 24 +  1] = v.y
            pos_tex_data[i * 24 +  2] = v.z
            pos_tex_data[i * 24 +  3] = 0

            v = b.clone()
            v.add(new THREE.Vector3().add(center).sub(b).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 +  4] = v.x
            pos_tex_data[i * 24 +  5] = v.y
            pos_tex_data[i * 24 +  6] = v.z
            pos_tex_data[i * 24 +  7] = 0

            v = c.clone()
            v.add(new THREE.Vector3().add(center).sub(c).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 +  8] = v.x
            pos_tex_data[i * 24 +  9] = v.y
            pos_tex_data[i * 24 + 10] = v.z
            pos_tex_data[i * 24 + 11] = 0

            v = c.clone()
            v.add(new THREE.Vector3().add(center).sub(c).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 + 12] = v.x
            pos_tex_data[i * 24 + 13] = v.y
            pos_tex_data[i * 24 + 14] = v.z
            pos_tex_data[i * 24 + 15] = 0

            v = d.clone()
            v.add(new THREE.Vector3().add(center).sub(d).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 + 16] = v.x
            pos_tex_data[i * 24 + 17] = v.y
            pos_tex_data[i * 24 + 18] = v.z
            pos_tex_data[i * 24 + 19] = 0

            v = a.clone()
            v.add(new THREE.Vector3().add(center).sub(a).normalize().multiplyScalar(0.01))
            pos_tex_data[i * 24 + 20] = v.x
            pos_tex_data[i * 24 + 21] = v.y
            pos_tex_data[i * 24 + 22] = v.z
            pos_tex_data[i * 24 + 23] = 0
        }
        for (let i = 0; i < t_size * t_size; ++i) {
            if (i < pos_attrib.count) {
                norm_tex_data[i * 4 + 0] = norm_attrib.array[i * 3 + 0]
                norm_tex_data[i * 4 + 1] = norm_attrib.array[i * 3 + 1]
                norm_tex_data[i * 4 + 2] = norm_attrib.array[i * 3 + 2]
                norm_tex_data[i * 4 + 3] = 0
            } else {
                pos_tex_data[i * 4 + 0] = 0
                pos_tex_data[i * 4 + 1] = 0
                pos_tex_data[i * 4 + 2] = 0
                pos_tex_data[i * 4 + 3] = 0
                norm_tex_data[i * 4 + 0] = 0
                norm_tex_data[i * 4 + 1] = 0
                norm_tex_data[i * 4 + 2] = 0
                norm_tex_data[i * 4 + 3] = 0
            }
        }
        
        const tVert = new THREE.DataTexture(pos_tex_data, t_size, t_size, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping,
            THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1)
        const tNorm = new THREE.DataTexture(norm_tex_data, t_size, t_size, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping,
            THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1)
        tVert.needsUpdate = true
        tNorm.needsUpdate = true
        const tTarget = new THREE.WebGLRenderTarget(t_size, t_size, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            stencilBuffer: false,
            depthBuffer: false
        })
        // clear render target to 0,0,0,1
        const prev_clear_color = this.renderer.getClearColor().clone()
        const prev_clear_alpha = this.renderer.getClearAlpha()
        this.renderer.setClearColor(0x000000, 1.0)
        this.renderer.clearTarget(tTarget, true, true, true)     // TODO this is not working ?
        this.renderer.setClearColor(prev_clear_color, prev_clear_alpha)

        // ao pass
        this.ao_pass.material.uniforms.tVert.value = tVert
        this.ao_pass.material.uniforms.tNorm.value = tNorm
        this.ao_pass.original_color = color_attrib
        this.ao_pass.paused = false

        // ao cache
        const settings = HexaLab.app.get_settings()
        const relevant_settings = {
            app:        settings.app,
            filters:    settings.filters,
            // materials:  settings.materials,
            rendering:  settings.rendering
        }
        relevant_settings.app.singularity_mode = null
        relevant_settings.app.apply_color_map = null
        // Dirty hack for not resetting on quality change if quality filtering is disabled
        if (!relevant_settings.filters["Quality"].enabled) {
            relevant_settings.app.quality_measure = null
        }
        const hash = objectHash.sha1(relevant_settings)
        let cached = true
        if (!this.ao_cache[hash]) {
            this.ao_cache[hash] = {
                result:     new Float32Array(t_size * t_size * 4),
                readback_i: 0,
                sum:        0,
                target:     tTarget,
                view_i:     0,
            }
            cached = false
        }
        this.ao_pass.progress = this.ao_cache[hash]
        if (cached) {
            const progress = this.ao_pass.progress.view_i / this.ao_pass.samples * 100
            Module.print("[AO] Cached at " + progress.toFixed(0) + "%")
            this.apply_ao()
        } else {
            Module.print("[AO] Starting...")
        }
    },

    apply_ao: function () {
        if (this.ao_pass.progress.readback_i != this.ao_pass.progress.view_i) {
            this.renderer.readRenderTargetPixels(this.ao_pass.progress.target, 0, 0,
                this.ao_pass.progress.target.width, this.ao_pass.progress.target.height, 
                this.ao_pass.progress.result)
            this.ao_pass.progress.readback_i = this.ao_pass.progress.view_i
        }
        const gpu_data  = this.ao_pass.progress.result
        const scale     = this.ao_pass.progress.sum
        const color     = this.ao_pass.original_color
        let new_color   = new Float32Array(color.count * 3)

        for (var i = 0; i < color.count * 3; ++i) {
            new_color[i * 3 + 0] = color.array[i * 3 + 0] * (gpu_data[i * 4 + 0] - 1) / scale
            new_color[i * 3 + 1] = color.array[i * 3 + 1] * (gpu_data[i * 4 + 1] - 1) / scale
            new_color[i * 3 + 2] = color.array[i * 3 + 2] * (gpu_data[i * 4 + 2] - 1) / scale
        }
        
        this.buffers.visible.surface.removeAttribute('color')
        this.buffers.visible.surface.addAttribute('color', new THREE.BufferAttribute(new_color, 3))
    },

    delayed_osao_reset: function (delay) {
        clearTimeout(this.ao_pass.timer)
        const self = this
        this.ao_pass.timer = setTimeout(function () {
            self.reset_osao()
        }, delay)
        this.ao_pass.paused = true
    },

    on_mesh_change: function (mesh) {
        // flush ao cache
        this.ao_cache = {}

        this.buffers.update()
        this.reset_osao()
        this.dirty_geometry = false
        this.dirty_color    = false

        const _aabb_center = mesh.get_aabb_center()
        const aabb_center = new THREE.Vector3(_aabb_center.x(), _aabb_center.y(), _aabb_center.z())
        //this.renderables_node.position.set(-aabb_center.x, -aabb_center.y, -aabb_center.z)
        this.mesh_offset = new THREE.Vector3(-aabb_center.x, -aabb_center.y, -aabb_center.z)
            //new THREE.Matrix4().makeTranslation(-aabb_center.x, -aabb_center.y, -aabb_center.z)
        //this.scene.position.set(-aabb_center.x, -aabb_center.y, -aabb_center.z)
        this.mesh = mesh

        // generate ao sampling dirs
        const aabb_diagonal = mesh.get_aabb_diagonal()
        let views = []
        let cones = []  // 3d objects to indicate position and direction of sample points
        function sample_sphere_surface () {
            let dir = new THREE.Vector3()
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.acos(1 - 2 * Math.random())
            dir.x = Math.sin(phi) * Math.cos(theta)
            dir.y = Math.sin(phi) * Math.sin(theta)
            dir.z = Math.cos(phi)
            return dir
        }
        let samples = []
        // Mitchell's best candidate
        samples[0] = sample_sphere_surface()
        for (let i = 1; i < this.ao_pass.samples; ++i) {
            let p = sample_sphere_surface()
            let d = 9999
            for (let j = 0; j < i; ++j) {
                const _d = p.distanceTo(samples[j])
                if (_d < d) d = _d
            }
            for (let j = 0; j < 49; ++j) {
                let p2 = sample_sphere_surface()
                let d2 = 9999
                for (let j = 0; j < i; ++j) {
                    const _d = p2.distanceTo(samples[j])
                    if (_d < d2) d2 = _d
                }
                if (d2 > d) {
                    p = p2
                    d = d2
                }
            }
            samples[i] = p
        }
        for (let i = 0; i < this.ao_pass.samples; ++i) {
            // sample unit sphere 
            let dir = samples[i]
            // create light camera
            const cam_pos = dir.multiplyScalar(mesh.get_aabb_diagonal())
            views[i] = new THREE.OrthographicCamera(
                -aabb_diagonal * 0.5,
                aabb_diagonal * 0.5,
                aabb_diagonal * 0.5,
                -aabb_diagonal * 0.5,
                0, 1000
            )
            views[i].position.set(cam_pos.x, cam_pos.y, cam_pos.z)
            views[i].up.set(0, 1, 0)
            views[i].lookAt(new THREE.Vector3())
            // create visual 3d object
            // const geometry = new THREE.CylinderGeometry(0, 0.01, 0.03);
            // geometry.rotateX(Math.PI / 2);
            // const material = new THREE.MeshBasicMaterial({color: 0xffff00})
            // cones[i] = new THREE.Mesh(geometry, material)
            // cones[i].up.set(0, 0, 1)
            // cones[i].position.set(cam_pos.x, cam_pos.y, cam_pos.z)
            // cones[i].lookAt(new THREE.Vector3(0, 0, 0))
        }

        // ao pass
        this.ao_pass.views = views
        this.ao_pass.cones = cones
        this.ao_pass.material.uniforms.uDepthBias = { value: 0.02 * mesh.get_aabb_diagonal() }

        // ssao pass
        this.ssao_pass.material.uniforms.uRadius.value = 5 * mesh.avg_edge_len;
        this.blur_pass.material.uniforms.depthThreshold.value = mesh.min_edge_len * 0.5 + mesh.avg_edge_len * 0.5;
    },

    resize: function (width, height) {
        // width and height
        this.width = width
        this.height = height
        this.aspect = width / height
        
        this.scene_camera.aspect = this.aspect
        this.scene_camera.updateProjectionMatrix()

        // passes render targets
        this.normal_pass.target.setSize(width, height)
        this.depth_pass.target.setSize(width, height)
        this.ssao_pass.target.setSize(width, height)

        // passes uniforms
        this.ssao_pass.material.uniforms.uSize.value.set(width, height)
        this.blur_pass.material.uniforms.uSize.value.set(width, height)

        // screen render target
        this.renderer.setSize(width, height)
    },

    // TODO ?
    draw_silhouette: function () {
        // Clear all alpha values to 0
        this.fullscreen_quad.material = this.alpha_pass.material
        this.fullscreen_quad.material.uniforms.uAlpha = { value: 0.0 }
        this.fullscreen_quad.material.depthWrite = false
        this.fullscreen_quad.material.depthTest = false
        this.scene.add(this.fullscreen_quad)
        this.renderer.context.colorMask(false, false, false, true)
        this.renderer.render(this.scene, this.fullscreen_camera)
        this.renderer.context.colorMask(true, true, true, true)

        clear_scene()

        // Set the outer silhouette alpha values
        add_model_surface(models.filtered)
        this.scene.overrideMaterial = this.alpha_pass.material
        this.scene.overrideMaterial.uniforms.uAlpha = { value: models.filtered.surface.material.opacity }
        this.scene.overrideMaterial.depthWrite = false
        this.scene.overrideMaterial.depthTest = true
        this.renderer.context.colorMask(false, false, false, true)
        this.renderer.render(this.scene, main_camera)
        this.renderer.context.colorMask(true, true, true, true)

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
        })
        this.scene.add(this.fullscreen_quad)
        this.renderer.render(this.scene, this.fullscreen_camera)

        clear_scene()

        // Set back all alpha values to 1
        this.fullscreen_quad.material = this.alpha_pass.material
        this.fullscreen_quad.material.uniforms.uAlpha = { value: 1.0 }
        this.fullscreen_quad.material.depthWrite = false
        this.fullscreen_quad.material.depthTest = false
        this.scene.add(this.fullscreen_quad)
        this.renderer.context.colorMask(false, false, false, true)
        this.renderer.render(this.scene, this.fullscreen_camera)
        this.renderer.context.colorMask(true, true, true, true)

        clear_scene()
    },

    on_surface_color_change: function () {
        this.ao_pass.original_color = this.buffers.visible.surface.attributes.color
        this.apply_ao()
    },

    render: function () {
        // -- utility --
        const self = this
        function clear_scene () {
            while (self.scene.children.length > 0) {
                self.scene.remove(self.scene.children[0])
            }
        }
        function clear_rt () {
            self.renderer.setRenderTarget()
            self.renderer.clear()
        }

        if (!this.mesh) return

        // Update buffers
        if (this.dirty_geometry) {
            this.buffers.update()
            // this.models.boundary_creases.update()
            // this.models.boundary_singularity.update()
            this.delayed_osao_reset(400)
        } else if (this.dirty_color) {
            this.buffers.update()
            this.on_surface_color_change()
        }
        this.dirty_geometry = false
        this.dirty_color    = false

        // -- main render sequence --

        // render visible surface
        clear_rt()
        clear_scene()
        this.scene.add(this.renderables.visible.surface)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)
        this.renderer.render(this.scene, this.scene_camera)

        // AO
        if (this.settings.ao == 'screen space') {
            // view norm/depth prepass
            this.scene.overrideMaterial = this.depth_pass.material
            this.renderer.render(this.scene, this.scene_camera, this.depth_pass.target, true)
            this.scene.overrideMaterial = this.normal_pass.material
            this.renderer.render(this.scene, this.scene_camera, this.normal_pass.target, true)
            this.scene.overrideMaterial = null

            clear_scene()

            // ssao
            this.ssao_pass.material.uniforms.uProj    = { value: this.scene_camera.projectionMatrix }
            this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(this.scene_camera.projectionMatrix) }
            this.blur_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(this.scene_camera.projectionMatrix) }
            this.scene.add(this.fullscreen_quad)
            this.scene.position.set(0, 0, 0)

            this.fullscreen_quad.material = this.ssao_pass.material
            this.renderer.render(this.scene, this.fullscreen_camera, this.ssao_pass.target, true)
            this.fullscreen_quad.material = this.blur_pass.material
            this.renderer.render(this.scene, this.fullscreen_camera)

        } else if (this.settings.ao == 'object space') {

            if (this.ao_pass.progress.view_i < this.ao_pass.views.length && !this.ao_pass.paused) {
                // create camera
                const light_cam = this.ao_pass.views[this.ao_pass.progress.view_i]

                // depth (view pos) pass
                this.scene.overrideMaterial = this.viewpos_pass.material
                this.renderer.render(this.scene, light_cam, this.viewpos_pass.target, true)
                this.scene.overrideMaterial = null
                clear_scene()

                // ao accumulation pass
                this.fullscreen_quad.material = this.ao_pass.material
                this.ao_pass.material.uniforms.uModel.value = new THREE.Matrix4().makeTranslation(
                    this.mesh_offset.x, 
                    this.mesh_offset.y, 
                    this.mesh_offset.z
                )
                // this.ao_pass.material.uniforms.uModel.value = this.mesh_xform
                this.ao_pass.material.uniforms.uView.value = light_cam.matrixWorldInverse
                this.ao_pass.material.uniforms.uCamPos.value = light_cam.position
                this.ao_pass.material.uniforms.uProj.value = light_cam.projectionMatrix
                this.ao_pass.material.uniforms.tDepth = { value: this.viewpos_pass.target.texture }
                this.ao_pass.material.uniforms.uInvProj =  { value: new THREE.Matrix4().getInverse(light_cam.projectionMatrix) }

                this.scene.add(this.fullscreen_quad)
                this.scene.position.set(0, 0, 0)
                this.fullscreen_quad.material = this.ao_pass.material
                this.renderer.render(this.scene, this.fullscreen_camera, this.ao_pass.progress.target, this.ao_pass.progress.view_i == 0)
                this.fullscreen_quad.material = null

                this.ao_pass.progress.view_i += 1

                let light = new THREE.Vector3().add(light_cam.position).normalize()
                this.ao_pass.progress.sum += Math.max(0, new THREE.Vector3(0, 1, 0).dot(light))
                if (this.ao_pass.progress.view_i == 128 || 
                    this.ao_pass.progress.view_i == 512 || 
                    this.ao_pass.progress.view_i == this.ao_pass.samples) {
                    // if (this.ao_pass.view_i ==   1 || 
                    //     this.ao_pass.view_i ==  32 || 
                    //     this.ao_pass.view_i == 128 || 
                    //     this.ao_pass.view_i == 512 || 
                    //     this.ao_pass.view_i == this.ao_pass.samples) {
                        const progress = this.ao_pass.progress.view_i / this.ao_pass.samples * 100
                        const postfix = progress == 100 ? "" : "..."
                        Module.print("[AO] " + progress.toFixed(0) + "%" + postfix)
                    // }
                    this.apply_ao()
                }
            }
        }

        clear_scene()

        // render every else geometry
        this.scene.add(this.meshes)
        this.scene_light.position.set(this.scene_camera.position.x - this.scene.position.x, 
            this.scene_camera.position.y - this.scene.position.y, 
            this.scene_camera.position.z - this.scene.position.z)
        this.scene.add(this.scene_light)
        this.scene.add(this.renderables.visible.wireframe)
        this.scene.add(this.renderables.filtered.surface)
        this.scene.add(this.renderables.filtered.wireframe)
        this.scene.add(this.renderables.singularity.surface)
        this.scene.add(this.renderables.singularity.wireframe)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)
        this.renderer.render(this.scene, this.scene_camera)
        this.scene.position.set(0, 0, 0)
        clear_scene()

        // finally render the gizmo hud
        this.scene.add(this.gizmo)
        this.renderer.setViewport(this.width - 150, 10, 100, 100)
        this.hud_camera.setRotationFromMatrix(this.scene_camera.matrixWorld)
        this.renderer.render(this.scene, this.hud_camera)
        this.scene.remove(this.gizmo)
        this.renderer.setViewport(0, 0, this.width, this.height)
        clear_scene()
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

    this.backend = new Module.App()
    HexaLab.app = this

    var width = dom_element.offsetWidth
    var height = dom_element.offsetHeight

    // Viewer
    this.viewer = new HexaLab.Viewer(width, height)

    this.canvas = {
        element: this.viewer.get_element(),
        container: dom_element
    }
    this.canvas.container.appendChild(this.canvas.element)

    this.controls = new THREE.TrackballControls(this.viewer.get_scene_camera(), dom_element)

    // App
    this.default_app_settings = {
        apply_color_map:    false,
        singularity_mode:   0,
        color_map:          'Parula',
        quality_measure:    'Scaled Jacobian',
    }

    // Materials
    this.default_material_settings = {
        visible_default_inside_color:   '#ffff00',
        visible_default_outside_color:  '#ffffff',
        // visible_wireframe_color:        '#000000',
        visible_wireframe_opacity:      0.15,

        filtered_surface_color:         '#d2de0c',
        filtered_surface_opacity:       0.28,
        filtered_wireframe_color:       '#000000',
        filtered_wireframe_opacity:     0,
    }

    // Camera
    this.default_camera_settings = {
        offset:     new THREE.Vector3(0, 0, 0),
        direction:  new THREE.Vector3(0, 0, -1),
        up:         new THREE.Vector3(0, 1, 0),
        distance:   1.5
    }

    // Renderer
    this.default_rendering_settings = {
        background:      '#ffffff',
        occlusion:       'object space',
        antialiasing:    'msaa',
        light_intensity: 1
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

    // Plots ?
    this.plots = []

    // Resize callback
    window.addEventListener('resize', this.resize.bind(this))
};

Object.assign(HexaLab.App.prototype, {

    // Wrappers
    camera:     function () { return this.viewer.scene_camera },
    materials:  function () { return this.viewer.materials },
    queue_geometry_update:  function () { this.viewer.on_geometry_buffers_update() },
    queue_color_update:     function () { this.viewer.on_color_buffers_update() },

    // Settings
    get_camera_settings: function () {
        if (this.mesh) {
            return {
                offset:     new THREE.Vector3().subVectors(this.controls.target, new THREE.Vector3(0, 0, 0)),
                direction:  this.camera().getWorldDirection(),
                up:         this.camera().up.clone(),
                distance:   this.camera().position.distanceTo(this.controls.target) / this.mesh.get_aabb_diagonal(),
            }
        }
        else return this.default_camera_settings;
    },

    get_rendering_settings: function () {
        return {
            background:      this.viewer.get_background_color(),
            light_intensity: this.viewer.get_light_intensity(),
            occlusion:       this.viewer.get_ao_mode(),
            antialiasing:    this.viewer.get_aa_mode(),
        }
    },

    get_material_settings: function () {
        const self = this
        function get_default_inside_color () {
            const c = self.backend.get_default_inside_color()
            return '#' + new THREE.Color(c.x(), c.y(), c.z()).getHexString()
        }
        function get_default_outside_color () {
            const c = self.backend.get_default_outside_color()
            return '#' + new THREE.Color(c.x(), c.y(), c.z()).getHexString()
        }
        return {
            // visible_wireframe_color:                '#' + this.materials().visible_wireframe.color.getHexString(),
            filtered_surface_color:                 '#' + this.materials().filtered_surface.color.getHexString(),
            filtered_wireframe_color:               '#' + this.materials().filtered_wireframe.color.getHexString(),
            visible_surface_default_inside_color:   get_default_inside_color(),
            visible_surface_default_outside_color:  get_default_outside_color(),
            is_quality_color_mapping_enabled:       this.backend.is_quality_color_mapping_enabled(),
            visible_wireframe_opacity:              this.materials().visible_wireframe.opacity,
            filtered_surface_opacity:               this.materials().filtered_surface.opacity,
            filtered_wireframe_opacity:             this.materials().filtered_wireframe.opacity,
            // singularity_mode:                       this.singularity_mode,
            //singularity_surface_opacity: this.singularity_surface_material.opacity,
            //singularity_wireframe_opacity: this.singularity_wireframe_material.opacity,
        }
    },

    get_app_settings: function () {
        const x =  {
            singularity_mode:                       this.singularity_mode,
            quality_measure:                        this.quality_measure,
            apply_color_map:                        this.apply_color_map,
            color_map:                              this.color_map,
        }
        return x
    },

    set_camera_settings: function (settings) {
        var size, center
        if (this.mesh) {
            size    = this.mesh.get_aabb_diagonal()
            center  = new THREE.Vector3(0, 0, 0)
        } else {
            size    = 1
            center  = new THREE.Vector3(0, 0, 0)
        }

        var target      = new THREE.Vector3().addVectors(settings.offset, center)
        var direction   = settings.direction
        var up          = settings.up
        var distance    = settings.distance * size

        this.controls.rotateSpeed = 10
        this.controls.dynamicDampingFactor = 1
        this.controls.target.set(target.x, target.y, target.z)

        this.camera().position.set(target.x, target.y, target.z)
        this.camera().up.set(up.x, up.y, up.z)
        this.camera().lookAt(new THREE.Vector3().addVectors(target, direction))
        this.camera().up.set(up.x, up.y, up.z)
        this.camera().translateZ(distance)
    },

    set_rendering_settings: function (settings) {
        this.set_background_color(settings.background)
        this.set_light_intensity(settings.light_intensity)
        this.set_occlusion(settings.occlusion)
        this.set_antialiasing(settings.antialiasing)
    },

    set_material_settings: function (settings) {
        // this.set_visible_wireframe_color(settings.visible_wireframe_color)
        this.set_visible_wireframe_opacity(settings.visible_wireframe_opacity)
        this.set_filtered_surface_color(settings.filtered_surface_color)
        this.set_filtered_surface_opacity(settings.filtered_surface_opacity)
        this.set_filtered_wireframe_color(settings.filtered_wireframe_color)
        this.set_filtered_wireframe_opacity(settings.filtered_wireframe_opacity)
        this.set_visible_surface_default_outside_color(settings.visible_default_outside_color)
        this.set_visible_surface_default_inside_color(settings.visible_default_inside_color)
        // this.set_singularity_surface_opacity(settings.singularity_surface_opacity)
        // this.set_singularity_wireframe_opacity(settings.singularity_wireframe_opacity)
    },

    set_app_settings: function (settings) {
        this.set_color_map(settings.color_map)
        this.show_visible_quality(settings.apply_color_map)
        this.set_singularity_mode(settings.singularity_mode)
        this.set_quality_measure(settings.quality_measure)
    },

    get_settings: function () {
        var filters_settngs = {}
        for (var k in this.filters) {
            filters_settngs[this.filters[k].name] = this.filters[k].get_settings()
        }
        return {
            app:        this.get_app_settings(),
            camera:     this.get_camera_settings(),
            rendering:  this.get_rendering_settings(),
            materials:  this.get_material_settings(),
            filters:    filters_settngs,
        }
    },

    set_settings: function (settings) {
        this.set_app_settings(settings.app)
        this.set_camera_settings(settings.camera)
        this.set_rendering_settings(settings.rendering)
        this.set_material_settings(settings.materials)
        for (var k in this.filters) {
            var filter = this.filters[k]
            if (settings.filters && settings.filters[filter.name]) {
                filter.set_settings(settings.filters[filter.name])
            }
        }
    },

    // Setters
    resize: function () {
        var width   = this.canvas.container.offsetWidth
        var height  = this.canvas.container.offsetHeight
        this.viewer.resize(width, height)
        log('Frame resized to ' + width + 'x' + height)
    },

    get_canvas_size: function () {
        return {
            width: this.canvas.container.offsetWidth,
            height: this.canvas.container.offsetHeight,
        }
    },

    enable_quality_color_mapping: function () {
        const map = this.color_map
        if      (map == 'Jet')      this.backend.enable_quality_color_mapping(Module.ColorMap.Jet)
        else if (map == 'Parula')   this.backend.enable_quality_color_mapping(Module.ColorMap.Parula)
        else if (map == 'RedGreen') this.backend.enable_quality_color_mapping(Module.ColorMap.RedGreen)
        this.viewer.on_color_buffers_update()
    },

    disable_quality_color_mapping: function () {
        this.backend.disable_quality_color_mapping()
        this.viewer.on_color_buffers_update()
    },

    set_color_map: function (map) {
        this.color_map = map
        if (this.backend.is_quality_color_mapping_enabled()) {
            this.enable_quality_color_mapping()
        }
        HexaLab.UI.on_set_color_map(map)
    },

    set_visible_surface_default_inside_color: function (color) {
        var c = new THREE.Color(color)
        this.backend.set_default_inside_color(c.r, c.g, c.b)
        this.viewer.on_color_buffers_update()
        HexaLab.UI.on_set_visible_surface_default_inside_color(color)
    },
    set_visible_surface_default_outside_color: function (color) {
        var c = new THREE.Color(color)
        this.backend.set_default_outside_color(c.r, c.g, c.b)
        this.viewer.on_color_buffers_update()
        HexaLab.UI.on_set_visible_surface_default_outside_color(color)
    },

    set_quality_measure: function (measure) {
        if      (measure == "Scaled Jacobian")          this.backend.set_quality_measure(Module.QualityMeasure.ScaledJacobian)
        else if (measure == "Edge Ratio")               this.backend.set_quality_measure(Module.QualityMeasure.EdgeRatio)
        else if (measure == "Diagonal")                 this.backend.set_quality_measure(Module.QualityMeasure.Diagonal)
        else if (measure == "Dimension")                this.backend.set_quality_measure(Module.QualityMeasure.Dimension)
        else if (measure == "Distortion")               this.backend.set_quality_measure(Module.QualityMeasure.Distortion)
        else if (measure == "Jacobian")                 this.backend.set_quality_measure(Module.QualityMeasure.Jacobian)
        else if (measure == "Max Edge Ratio")           this.backend.set_quality_measure(Module.QualityMeasure.MaxEdgeRatio)
        else if (measure == "Max Aspect Frobenius")     this.backend.set_quality_measure(Module.QualityMeasure.MaxAspectFrobenius)
        else if (measure == "Mean Aspect Frobenius")    this.backend.set_quality_measure(Module.QualityMeasure.MeanAspectFrobenius)
        else if (measure == "Oddy")                     this.backend.set_quality_measure(Module.QualityMeasure.Oddy)
        else if (measure == "Relative Size Squared")    this.backend.set_quality_measure(Module.QualityMeasure.RelativeSizeSquared)
        else if (measure == "Shape")                    this.backend.set_quality_measure(Module.QualityMeasure.Shape)
        else if (measure == "Shape and Size")           this.backend.set_quality_measure(Module.QualityMeasure.ShapeAndSize)
        else if (measure == "Shear")                    this.backend.set_quality_measure(Module.QualityMeasure.Shear)
        else if (measure == "Shear and Size")           this.backend.set_quality_measure(Module.QualityMeasure.ShearAndSize)
        else if (measure == "Skew")                     this.backend.set_quality_measure(Module.QualityMeasure.Skew)
        else if (measure == "Stretch")                  this.backend.set_quality_measure(Module.QualityMeasure.Stretch)
        else if (measure == "Taper")                    this.backend.set_quality_measure(Module.QualityMeasure.Taper)
        else if (measure == "Volume")                   this.backend.set_quality_measure(Module.QualityMeasure.Volume)
        this.quality_measure = measure
        this.queue_geometry_update()    // TODO update only on real need (needs to query quality filter enabled state)
        HexaLab.UI.on_set_quality_measure(measure)
    },

    show_visible_quality: function (show) {
        if (show) {
            this.enable_quality_color_mapping()
        } else {
            this.disable_quality_color_mapping()
        }
        this.apply_color_map = show
        this.materials().visible_surface.needsUpdate = true
        HexaLab.UI.on_show_visible_quality(show)
    },

    set_singularity_mode: function (mode) {
        if (mode == 0) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(0.0)
            this.set_singularity_wireframe_linewidth(1)
            this.set_singularity_wireframe_depthtest(true)
        } else if (mode == 1) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(1.0)
            this.set_singularity_wireframe_linewidth(1)
            this.set_singularity_wireframe_depthtest(true)
        } else if (mode == 2) {
            this.set_singularity_surface_opacity(0.0)
            this.set_singularity_wireframe_opacity(1.0)
            this.set_singularity_wireframe_linewidth(3)
            this.set_singularity_wireframe_depthtest(true)
        } else if (mode == 3) {
            this.set_singularity_surface_opacity(1.0)
            this.set_singularity_wireframe_opacity(1.0)
            this.set_singularity_wireframe_linewidth(1)
            this.set_singularity_wireframe_depthtest(true)
        } else if (mode == 4) {
            this.set_singularity_surface_opacity(1.0)
            this.set_singularity_wireframe_opacity(1.0)
            this.set_singularity_wireframe_linewidth(1)
            this.set_singularity_wireframe_depthtest(false)
        }
        if (this.singularity_mode == 0 && mode > 0) {
            if (this.materials().filtered_surface.opacity > 0.3) {
                var x = this.materials().filtered_surface.opacity
                this.set_filtered_surface_opacity(0.3)
                this.prev_filtered_surface_opacity = x
            }
            if (this.materials().visible_wireframe.opacity > 0.3) {
                var x = this.materials().visible_wireframe.opacity
                this.set_visible_wireframe_opacity(0.3)
                this.prev_visible_wireframe_opacity = x
            }
        } else if (this.singularity_mode > 0 && mode == 0) {
            if (this.prev_filtered_surface_opacity) {
                this.set_filtered_surface_opacity(this.prev_filtered_surface_opacity)
            }
            if (this.prev_visible_wireframe_opacity) {
                this.set_visible_wireframe_opacity(this.prev_visible_wireframe_opacity)
            }
        }
        if (this.singularity_mode < 3 && mode >= 3) {
            this.backend.show_boundary_singularity(true)
            this.backend.show_boundary_creases(true)
            this.queue_geometry_update()
        } else if (this.singularity_mode >= 3 && mode < 3) {
            this.backend.show_boundary_singularity(false)
            this.backend.show_boundary_creases(false)
            this.queue_geometry_update()
        }
        this.singularity_mode = mode
        HexaLab.UI.on_set_singularity_mode(mode)
    },

    set_visible_wireframe_opacity:      function (opacity) {
        this.materials().visible_wireframe.opacity = opacity
        this.materials().visible_wireframe.visible = opacity != 0
        this.prev_visible_wireframe_opacity = null
        HexaLab.UI.on_set_wireframe_opacity(opacity)
    },
    set_filtered_surface_opacity:       function (opacity) {
        this.materials().filtered_surface.opacity = opacity
        this.materials().filtered_surface.visible = opacity != 0
        this.prev_filtered_surface_opacity = null
        HexaLab.UI.on_set_filtered_surface_opacity(opacity)
    },
    set_filtered_wireframe_opacity:     function (opacity) {
        this.materials().filtered_wireframe.opacity = opacity
        this.materials().filtered_wireframe.visible = opacity != 0
    },
    set_singularity_surface_opacity:    function (opacity) {
        this.materials().singularity_surface.opacity = opacity
        this.materials().singularity_surface.visible = opacity != 0
    },
    set_singularity_wireframe_opacity:  function (opacity) { 
        this.materials().singularity_wireframe.opacity = opacity
        this.materials().singularity_wireframe.visible = opacity != 0
    },

    // set_visible_wireframe_color:            function (color)        { this.materials().visible_wireframe.color.set(color) },
    set_filtered_surface_color:             function (color)        { this.materials().filtered_surface.color.set(color) },
    set_filtered_wireframe_color:           function (color)        { this.materials().filtered_wireframe.color.set(color) },
    
    set_singularity_wireframe_linewidth:    function (linewidth)    { this.materials().singularity_wireframe.linewidth = linewidth },
    set_singularity_wireframe_depthtest:    function (enabled)      { this.materials().singularity_wireframe.depthTest = enabled },

    set_occlusion:                          function (value)        { this.viewer.set_ao_mode(value); HexaLab.UI.on_set_occlusion(value) },
    set_antialiasing:                       function (value)        { this.viewer.set_aa_mode(value) },
    set_background_color:                   function (color)        { this.viewer.set_background_color(color) },
    set_light_intensity:                    function (intensity)    { this.viewer.set_light_intensity(intensity) },

    // Import a new mesh. First invoke the backend for the parser and builder.
    // If everything goes well, reset settings to default and propagate the
    // fact that a new mesh is in use to the entire system. Finally sync
    // the mesh gpu data (vertices, normals, ecc) with that of the backend.
    import_mesh: function (path) {
        // mesh load/parse
        var result = this.backend.import_mesh(path)
        if (!result) {
            HexaLab.UI.on_import_mesh_fail(path)
            return
        }
        this.mesh = this.backend.get_mesh()
        // reset settings
        this.set_settings({
            app:        this.default_app_settings,
            camera:     this.default_camera_settings,
            rendering:  this.default_rendering_settings,
            materials:  this.default_material_settings
        });
        // notify filters
        for (var k in this.filters) {
            this.filters[k].on_mesh_change(this.mesh)
        }
        // notify viewer
        this.viewer.on_mesh_change(this.mesh)
        // update UI
        HexaLab.UI.on_import_mesh(path)
    },

    update_camera: function () {
        this.controls.update()
    },

    // The application main loop. Call this after instancing an App object to start rendering.
    animate: function () {
        this.update_camera()
        this.viewer.render()
        // queue next frame
        requestAnimationFrame(this.animate.bind(this))
    }

});
