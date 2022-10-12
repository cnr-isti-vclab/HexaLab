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
        this.surface.deleteAttribute('position')
        const x = this.backend.surface_pos().size()
        if (this.backend.surface_pos().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_pos().data(), this.backend.surface_pos().size() * 3)
            this.surface.setAttribute('position', new THREE.BufferAttribute(buffer, 3))
        }
        this.surface.deleteAttribute('normal')
        if (this.backend.surface_norm().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_norm().data(), this.backend.surface_norm().size() * 3)
            this.surface.setAttribute('normal', new THREE.BufferAttribute(buffer, 3))
        } else {
            this.surface.computeVertexNormals()
        }
        this.surface.deleteAttribute('color')
        if (this.backend.surface_color().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.surface_color().data(), this.backend.surface_color().size() * 3)
            this.surface.setAttribute('color', new THREE.BufferAttribute(buffer, 3))
        }
        this.surface.setIndex(null)     // TODO ?
        if (this.backend.surface_ibuffer().size() != 0) {
            let buffer = []
            const data = this.backend.surface_ibuffer().data()
            const size = this.backend.surface_ibuffer().size()
            const t = new Int32Array(Module.HEAPU8.buffer, data, size)
            for (let i = 0; i < size; ++i) {  // TODO no copy
                buffer[i] = t[i]
            } 
            this.surface.setIndex(buffer)
        }

        this.wireframe.deleteAttribute('position')
        if (this.backend.wireframe_pos().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_pos().data(), this.backend.wireframe_pos().size() * 3)
            this.wireframe.setAttribute('position', new THREE.BufferAttribute(buffer, 3))
        }
        this.wireframe.deleteAttribute('color')
        if (this.backend.wireframe_color().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_color().data(), this.backend.wireframe_color().size() * 3)
            this.wireframe.setAttribute('color', new THREE.BufferAttribute(buffer, 3))
        }
        this.wireframe.deleteAttribute('alpha')
        if (this.backend.wireframe_alpha().size() != 0) {
            const buffer = new Float32Array(Module.HEAPU8.buffer, this.backend.wireframe_alpha().data(), this.backend.wireframe_alpha().size())
            this.wireframe.setAttribute('alpha', new THREE.BufferAttribute(buffer, 1))
        }
    },
})

// --------------------------------------------------------------------------------
// Filter Interface
// --------------------------------------------------------------------------------

HexaLab.Filter = function (filter_backend, name) {
    this.backend = filter_backend
    this.name = name;
    this.scene = {
        objects: [],
        add: function (obj) {
            this.objects.push(obj)
        },
        remove: function (obj) {
            var i = this.objects.indexOf(obj)
            if (i != -1) {
                this.objects.splice(i, 1)
            }
        }
    };
};

Object.assign(HexaLab.Filter.prototype, {
    // Implementation Api

    on_mesh_change: function (mesh) {   // cpp MeshStats data structure
        console.warn('Function "on_mesh_change" not implemented for filter ' + this.name + '.')
    },

    set_settings: function (settings) { // whatever was read from the settings json
        console.warn('Function "set_settings" not implemented for filter ' + this.name + '.')
    },

    get_settings: function () {         // whatever the filter wants to write to the settings json
        console.warn('Function "get_settings" not implemented for filter ' + this.name + '.')
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
    }

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
            z: new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, size, 0x0000aa),
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
    this.scene_light = new THREE.DirectionalLight()
    //this.scene_world = new THREE.Matrix4()

    // Materials
    this.materials = []
    this.materials.visible_surface      = new THREE.MeshBasicMaterial({
        vertexColors:                   true,
        polygonOffset:                  true,
        polygonOffsetFactor:            0.5,
    })
    this.materials.visible_surface_diffuse      = new THREE.MeshLambertMaterial({
        vertexColors:                   true,
        polygonOffset:                  true,
        polygonOffsetFactor:            0.5,
        emissive:                       new THREE.Color( 0x303030 ),
    })
    this.materials.visible_wireframe    = new THREE.ShaderMaterial({
        vertexShader:                   THREE.AlphaWireframeMaterial.vertexShader,
        fragmentShader:                 THREE.AlphaWireframeMaterial.fragmentShader,
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
        uniforms: {
            uAlpha:     null,
            uMixAlpha:  null
        }
        // polygonOffset:                  true,
        // polygonOffsetFactor:            -1.5,
    })
    this.materials.filtered_surface     = new THREE.MeshBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.filtered_wireframe   = new THREE.LineBasicMaterial({
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.singularity_surface  = new THREE.MeshBasicMaterial({
        vertexColors:                   true,
        // transparent:                    true,
        polygonOffset:                  true,
        polygonOffsetFactor:            1.5,
		depthTest:                      true,
        side:                           THREE.DoubleSide,
    })
    this.materials.singularity_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
        // polygonOffset:                  true,
        // polygonOffsetFactor:            -1.5,
    })
    this.materials.singularity_line_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.singularity_spined_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
    })
    this.materials.singularity_hidden_surface  = new THREE.MeshBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        //polygonOffset:                  true,
        //polygonOffsetFactor:            -1.0,
        side:                           THREE.DoubleSide,
        depthTest:                      false,
    })
    this.materials.singularity_hidden_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
        depthTest:                      false,
    })
    this.materials.singularity_hidden_line_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
        depthTest:                      false,
    })
    this.materials.singularity_hidden_spined_wireframe = new THREE.LineBasicMaterial({
        vertexColors:                   true,
        transparent:                    true,
        depthWrite:                     false,
        depthTest:                      false,
    })
    this.materials.full                 = new THREE.MeshBasicMaterial() 

    // BufferGeometry instances
    this.buffers = []
    this.buffers.visible                = new HexaLab.BufferGeometry(HexaLab.app.backend.get_visible_model())
    this.buffers.filtered               = new HexaLab.BufferGeometry(HexaLab.app.backend.get_filtered_model())
    this.buffers.line_singularity       = new HexaLab.BufferGeometry(HexaLab.app.backend.get_line_singularity_model())
    this.buffers.spined_singularity     = new HexaLab.BufferGeometry(HexaLab.app.backend.get_spined_singularity_model())
    this.buffers.full_singularity       = new HexaLab.BufferGeometry(HexaLab.app.backend.get_full_singularity_model())
    this.buffers.full                   = new HexaLab.BufferGeometry(HexaLab.app.backend.get_full_model())
    // this.buffers.boundary_singularity   = new HexaLab.BufferGeometry(HexaLab.app.backend.get_boundary_singularity_model())
    // this.buffers.boundary_creases       = new HexaLab.BufferGeometry(HexaLab.app.backend.get_boundary_creases_model())
    this.buffers.update = function () {
        const x = HexaLab.app.backend.update_models()
        this.visible.update()
        this.filtered.update()
        // TODO don't always update these
        this.line_singularity.update()
        this.spined_singularity.update()
        this.full_singularity.update()
        this.full.update()
    }

    // THREE.js renderables
    this.renderables = []
    function make_renderable_surface (material, name, buffer_name) {
        buffer_name = buffer_name || name
        self.renderables[name] = self.renderables[name] || {}
        self.renderables[name].surface = new THREE.Mesh(self.buffers[buffer_name].surface, material)
        self.renderables[name].surface.frustumCulled = false  // TODO ?
    }
    function make_renderable_wireframe (material, name, buffer_name) {
        buffer_name = buffer_name || name
        self.renderables[name] = self.renderables[name] || {}
        self.renderables[name].wireframe = new THREE.LineSegments(self.buffers[buffer_name].wireframe, material)
        self.renderables[name].wireframe.frustumCulled = false  // TODO ?
    }

    make_renderable_surface     (this.materials.visible_surface,                    'visible')
    make_renderable_surface     (this.materials.visible_surface_diffuse,            'visible_diffuse', 'visible')
    make_renderable_surface     (this.materials.filtered_surface,                   'filtered')
    make_renderable_surface     (this.materials.singularity_hidden_surface,         'hidden_full_singularity', 'full_singularity')
    make_renderable_surface     (this.materials.singularity_surface,                'full_singularity')
    make_renderable_surface     (this.materials.full,                               'full')
    
    make_renderable_wireframe   (this.materials.visible_wireframe,                  'visible')
    make_renderable_wireframe   (this.materials.filtered_wireframe,                 'filtered')
    make_renderable_wireframe   (this.materials.singularity_line_wireframe,         'line_singularity')
    make_renderable_wireframe   (this.materials.singularity_hidden_line_wireframe,  'hidden_line_singularity', 'line_singularity')
    make_renderable_wireframe   (this.materials.singularity_spined_wireframe,       'spined_singularity')
    make_renderable_wireframe   (this.materials.singularity_hidden_spined_wireframe,'hidden_spined_singularity', 'spined_singularity')
    make_renderable_wireframe   (this.materials.singularity_wireframe,              'full_singularity')
    make_renderable_wireframe   (this.materials.singularity_hidden_wireframe,       'hidden_full_singularity', 'full_singularity')
    // make_wireframe_renderable('boundary_singularity', this.visible_wireframe_material)
    // make_wireframe_renderable('boundary_creases', this.visible_wireframe_material)

    // additional meshes
    this.meshes = new THREE.Group() // TODO add_mesh api

    // RENDER PASSES/MATERIALS SETUP

    this.fullscreen_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.fullscreen_quad   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)

    // Used for silhouette drawing
    this.silhouette_alpha_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.AlphaPass.vertexShader,
            fragmentShader: THREE.AlphaPass.fragmentShader,
            uniforms: {
                uAlpha: { value: 1.0 }
            },
            polygonOffsetFactor: 1.5,
        }),
    }

    this.silhouette_color_pass = new THREE.MeshBasicMaterial({
        color: '#d7d7f0',   // (215, 215, 240)
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstAlphaFactor,
        blendDst: THREE.OneMinusDstAlphaFactor,
        transparent: true,
        depthTest: true,
        depthWrite: false
    })

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
    var n = new THREE.Vector3(0, 0, 1)
    for (var i = 0; i < num_samples * 3; i += 3) {
        var v
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
    var noise_size = 4
    var noise = new Float32Array(noise_size * noise_size * 3)
    for (var i = 0; i < noise_size * noise_size * 3; i += 3) {
        var v = new THREE.Vector3(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            0
        ).normalize()
        noise[i + 0] = v.x
        noise[i + 1] = v.y
        noise[i + 2] = v.z
    }
    var noise_tex = new THREE.DataTexture(noise, noise_size, noise_size, THREE.RGBAFormat, THREE.FloatType,
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
    this.normal_pass.target.depthTexture = new THREE.DepthTexture()
    this.normal_pass.target.depthTexture.type = THREE.UnsignedShortType

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
                tNoise: { value: noise_tex },
                tNormals: { value: this.normal_pass.target.texture },
                uKernel: { value: kernel },
                uRadius: { value: 0.1 },
                uSize: { value: new THREE.Vector2(this.width, this.height) },
                uProj: { value: new THREE.Matrix4() },
                uInvProj: { value: new THREE.Matrix4() }
            },
            defines: {
                numSamples: 16,
            }
        }),
        target: new THREE.WebGLRenderTarget(this.width, this.height, {
            format: THREE.RGBAFormat,
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
                depthThreshold: { value: 0.001 },
                uProj: { value: new THREE.Matrix4() },
                uInvProj: { value: new THREE.Matrix4() }
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
        target: new THREE.WebGLRenderTarget(256, 256, {
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
		dirs: [],
        progress: null,
        timer: null,
        paused: false,
    }
    this.ao_cache = {}

    // Fresnel transparency
    this.fresnel_transparency_pass = {
        material: new THREE.ShaderMaterial({
            vertexShader: THREE.FresnelTransparency.vertexShader,
            fragmentShader: THREE.FresnelTransparency.fragmentShader,
            uniforms: {
                uColor: { value: new THREE.Vector3(0.85, 0.85, 0.95) },
                uAlpha: { value: 1 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    }
	

}

Object.assign(HexaLab.Viewer.prototype, {

    setup_renderer: function() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.settings.aa == 'msaa',
            preserveDrawingBuffer: true,    // disable hidden/automatic clear of the rendertarget
            alpha: true,                    // to have an alpha on the rendertarget? (needed for setClearAlpha to work)
        })
        this.renderer.getContext().getExtension("EXT_frag_depth")
        this.renderer.setSize(this.width, this.height)
        this.renderer.autoClear = false
        this.renderer.setClearColor(this.settings.background, 1.0)
        this.renderer.clear()
    },

    get_element: function () { return this.renderer.domElement },
    get_scene_camera: function () { return this.scene_camera },
    get_models_transform: function () { return new THREE.Matrix4().makeTranslation(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z) },

    // Settings
    set_background_color:   function (color) { this.settings.background = color },
    set_light_intensity:    function (intensity) { this.scene_light.intensity = intensity },
    set_aa_mode:            function (value) { this.settings.aa = value; /*this.init_backend()*/ },
    set_lighting_mode:      function (value) { this.settings.lighting = value; this.update_osao_buffers(); this.dirty_canvas = true },
    get_background_color:   function () { return this.settings.background },
    get_light_intensity:    function () { return this.scene_light.intensity },
    get_aa_mode:            function () { return this.settings.aa },
    get_lighting_mode:      function () { return this.settings.lighting },


    on_buffers_change:      function () { this.dirty_buffers = true; HexaLab.app.backend.flag_models_as_dirty() },
    on_scene_change:        function () { this.dirty_canvas = true },

    add_mesh:               function (mesh) { this.meshes.add(mesh) },
    remove_mesh:            function (mesh) { this.meshes.remove(mesh) },

    show_axes:              function (do_show) { this.do_show_axes = do_show },


    set_silhouette_opacity: function (opacity) { this.settings.silhouette_alpha = opacity; this.dirty_canvas = true },
    get_silhouette_opacity: function () { return this.settings.silhouette_alpha },
    set_silhouette_color:   function (color_string) { 
        const c = new THREE.Color(color_string)
        this.silhouette_alpha_pass.material.uniforms.uColor = { value: new THREE.Vector3(c.r, c.g, c.b) }
        this.dirty_canvas = true
    },
    get_silhouette_color: function () { 
        const c = this.silhouette_alpha_pass.material.uniforms.uColor
        return new THREE.Color(c.x, c.y, c.z)
    },

    reset_osao: function () {
        // determine ao textures size
        const pos_attrib    = this.buffers.visible.surface.attributes.position
        if (!pos_attrib) return
        const norm_attrib   = this.buffers.visible.surface.attributes.normal
        const color_attrib  = this.buffers.visible.surface.attributes.color
        const index_attrib  = this.buffers.visible.surface.getIndex()
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
        for (let i = 0; i < index_attrib.count / 6; ++i) {
            a.set(pos_attrib.array[index_attrib.array[i * 6 + 0] * 3 + 0], pos_attrib.array[index_attrib.array[i * 6 + 0] * 3 + 1], pos_attrib.array[index_attrib.array[i * 6 + 0] * 3 + 2])
            b.set(pos_attrib.array[index_attrib.array[i * 6 + 1] * 3 + 0], pos_attrib.array[index_attrib.array[i * 6 + 1] * 3 + 1], pos_attrib.array[index_attrib.array[i * 6 + 1] * 3 + 2])
            c.set(pos_attrib.array[index_attrib.array[i * 6 + 2] * 3 + 0], pos_attrib.array[index_attrib.array[i * 6 + 2] * 3 + 1], pos_attrib.array[index_attrib.array[i * 6 + 2] * 3 + 2])
            // skip the first vertex of the second face since it's the same as the last of the first face
            d.set(pos_attrib.array[index_attrib.array[i * 6 + 4] * 3 + 0], pos_attrib.array[index_attrib.array[i * 6 + 4] * 3 + 1], pos_attrib.array[index_attrib.array[i * 6 + 4] * 3 + 2])
            // skip the last vertex of the second face since it's the same as the first of the first face
            const offset = 0.0
            let center = new THREE.Vector3().add(a).add(b).add(c).add(d).multiplyScalar(0.25 * offset)    // average
            
            let v
            v = a.clone()
            v = v.multiplyScalar(1 - offset).add(center)
            pos_tex_data[index_attrib.array[i * 6 + 0] * 4 + 0] = v.x
            pos_tex_data[index_attrib.array[i * 6 + 0] * 4 + 1] = v.y
            pos_tex_data[index_attrib.array[i * 6 + 0] * 4 + 2] = v.z
            pos_tex_data[index_attrib.array[i * 6 + 0] * 4 + 3] = 0

            v = b.clone()
            v = v.multiplyScalar(1 - offset).add(center)
            pos_tex_data[index_attrib.array[i * 6 + 1] * 4 + 0] = v.x
            pos_tex_data[index_attrib.array[i * 6 + 1] * 4 + 1] = v.y
            pos_tex_data[index_attrib.array[i * 6 + 1] * 4 + 2] = v.z
            pos_tex_data[index_attrib.array[i * 6 + 1] * 4 + 3] = 0

            v = c.clone()
            v = v.multiplyScalar(1 - offset).add(center)
            pos_tex_data[index_attrib.array[i * 6 + 2] * 4 + 0] = v.x
            pos_tex_data[index_attrib.array[i * 6 + 2] * 4 + 1] = v.y
            pos_tex_data[index_attrib.array[i * 6 + 2] * 4 + 2] = v.z
            pos_tex_data[index_attrib.array[i * 6 + 2] * 4 + 3] = 0

            // v = c.clone()
            //v = v.multiplyScalar(1 - offset).add(new THREE.Vector3().add(center).multiplyScalar(offset))
            // //v.add(new THREE.Vector3().add(center).sub(c).normalize().multiplyScalar(offset))
            // pos_tex_data[index_attrib.array[i * 6 + 3] * 4 + 0] = v.x
            // pos_tex_data[index_attrib.array[i * 6 + 3] * 4 + 1] = v.y
            // pos_tex_data[index_attrib.array[i * 6 + 3] * 4 + 2] = v.z
            // pos_tex_data[index_attrib.array[i * 6 + 3] * 4 + 3] = 0

            v = d.clone()
            v = v.multiplyScalar(1 - offset).add(center)
            pos_tex_data[index_attrib.array[i * 6 + 4] * 4 + 0] = v.x
            pos_tex_data[index_attrib.array[i * 6 + 4] * 4 + 1] = v.y
            pos_tex_data[index_attrib.array[i * 6 + 4] * 4 + 2] = v.z
            pos_tex_data[index_attrib.array[i * 6 + 4] * 4 + 3] = 0

            // v = a.clone()
            // v = v.multiplyScalar(1 - offset).add(new THREE.Vector3().add(center).multiplyScalar(offset))
            // //v.add(new THREE.Vector3().add(center).sub(a).normalize().multiplyScalar(offset))
            // pos_tex_data[index_attrib.array[i * 6 + 5] * 4 + 0] = v.x
            // pos_tex_data[index_attrib.array[i * 6 + 5] * 4 + 1] = v.y
            // pos_tex_data[index_attrib.array[i * 6 + 5] * 4 + 2] = v.z
            // pos_tex_data[index_attrib.array[i * 6 + 5] * 4 + 3] = 0
        }
        for (let i = 0; i < t_size * t_size; ++i) {
            if (i < norm_attrib.count) {
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
        //const prev_clear_color = this.renderer.getClearColor().clone()
        let prev_clear_color = new THREE.Color()
        this.renderer.getClearColor(prev_clear_color)
        const prev_clear_alpha = this.renderer.getClearAlpha()
        this.renderer.setClearColor(0x000000, 1.0)
        this.renderer.setRenderTarget(tTarget)
        this.renderer.clear(true, true, true)
        //this.renderer.clearTarget(tTarget, true, true, true)     // TODO this is not working ?
        this.renderer.setClearColor(prev_clear_color, prev_clear_alpha)

        // ao pass
        this.ao_pass.material.uniforms.tVert.value = tVert
        this.ao_pass.material.uniforms.tNorm.value = tNorm
        this.ao_pass.original_color = color_attrib
        this.ao_pass.paused = false

        // ao cache
        const settings = HexaLab.app.get_settings()
        var relevant_settings = {
            app:        settings.app,
            filters:    settings.filters,
            // materials:  settings.materials,
            rendering:  settings.rendering
        }
        // cut off a few irrelevant settings from the app
        relevant_settings.app.singularity_mode = null
        relevant_settings.app.apply_color_map = null
	
		// Lines (aka "FlatLines") and (ugh) "DynamicLines" (aka "Lines") have same AO
		if (relevant_settings.app.geometry_mode == "Lines") relevant_settings.app.geometry_mode = "DynamicLines"

        // Dirty hack for not resetting on quality change if quality filtering is disabled
        if (!relevant_settings.filters["Quality"].enabled || 
            (relevant_settings.filters["Quality"].min == 0 && relevant_settings.filters["Quality"].max == 1)) {
            relevant_settings.app.quality_measure = null
        }
        // cut off disabled filters
        for (const key in relevant_settings.filters) {
            if (relevant_settings.filters[key].enabled == false)
                relevant_settings.filters[key] = null
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
                done:       false,
            }
            cached = false
        }
        this.ao_pass.progress = this.ao_cache[hash]
        if (cached && this.ao_pass.progress.view_i > 32) {
            const progress = this.ao_pass.progress.view_i / this.ao_pass.samples * 100
            Module.print("[AO] Cached at " + progress.toFixed(0) + "%")
            this.update_osao_buffers()
        } else {
            //Module.print("[AO] Starting...")
        }
    },

	
	generate_osao_dirs: function(){
		

		if(this.ao_pass.dirs && this.ao_pass.dirs.length) return; // don't recompuite light dirs!
		
		console.log("computing AO dirs")
		
        function sample_sphere_surface () {
            let dir = new THREE.Vector3()
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.acos(1 - 2 * Math.random())
            dir.x = Math.sin(phi) * Math.cos(theta)
            dir.y = Math.sin(phi) * Math.sin(theta)
            dir.z = Math.cos(phi)
            return dir
        }
		
        this.ao_pass.dirs = []
        // Mitchell's best candidate
		
        this.ao_pass.dirs[0] = new THREE.Vector3(10, 10, 1).normalize()
		
        //this.ao_pass.dirs[0] = sample_sphere_surface()
		
        for (let i = 1; i < this.ao_pass.samples; ++i) {
            let p = sample_sphere_surface()
            let d = 9999
            for (let j = 0; j < i; ++j) {
                const _d = p.distanceTo(this.ao_pass.dirs[j])
                if (_d < d) d = _d
            }
            for (let j = 0; j < 49; ++j) {
                let p2 = sample_sphere_surface()
                let d2 = 9999
                for (let j = 0; j < i; ++j) {
                    const _d = p2.distanceTo(this.ao_pass.dirs[j])
                    if (_d < d2) d2 = _d
                }
                if (d2 > d) {
                    p = p2
                    d = d2
                }
            }
            this.ao_pass.dirs[i] = p
        }

		// shift dirs from above
		var bias = new THREE.Vector3(0, 0.1, 0)
		for (let i = 0; i < this.ao_pass.samples; ++i) {
			this.ao_pass.dirs[i] = this.ao_pass.dirs[i].add(bias).normalize()
		}
		
	},
	
    generate_osao_povs: function () {
		
		console.log("computing AO povs")
		this.generate_osao_dirs()
		
		let views = []
		
        const aabb_diagonal = this.mesh.get_aabb_diagonal()
		
        for (let i = 0; i < this.ao_pass.samples; ++i) {
            // sample unit sphere 
            var cam_pos = new THREE.Vector3();
			cam_pos.copy( this.ao_pass.dirs[i] );
            // create light camera
            cam_pos.multiplyScalar(this.mesh.get_aabb_diagonal())
            views[i] = new THREE.OrthographicCamera(
                -aabb_diagonal * 0.5,
                aabb_diagonal * 0.5,
                aabb_diagonal * 0.5,
                -aabb_diagonal * 0.5,
                0, 2 * aabb_diagonal
            )
            views[i].position.set(cam_pos.x, cam_pos.y, cam_pos.z)
            views[i].up.set(0, 1, 0)
            views[i].lookAt(new THREE.Vector3())
            
        }
   
   		this.ao_pass.views = views

    },


    on_mesh_change: function (mesh) {
        // empty ao cache
        this.ao_cache = {}

        this.buffers.update()
        this.dirty_buffers = false
        this.dirty_canvas  = true

        const _aabb_center  = mesh.get_aabb_center()
        const aabb_center   = new THREE.Vector3(_aabb_center.x(), _aabb_center.y(), _aabb_center.z())
        this.mesh_offset    = new THREE.Vector3(-aabb_center.x, -aabb_center.y, -aabb_center.z)
        this.mesh           = mesh

        // ao pass
        this.generate_osao_povs()
        this.ao_pass.material.uniforms.uDepthBias = { value: 0.01 * mesh.get_aabb_diagonal() }
        // this.ao_pass.material.uniforms.uDepthBias = { value: 0.0025 }
        this.reset_osao()

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

        controls.handleResize();
    },

    // TODO ?
    draw_silhouette: function () {
        this.clear_scene()
        this.scene.add(this.fullscreen_quad)

        // Clear all alpha values on the canvas render target to 0
        this.silhouette_alpha_pass.material.uniforms.uAlpha = { value: 0.0 }
        this.silhouette_alpha_pass.material.depthWrite = false
        this.silhouette_alpha_pass.material.depthTest = false
        this.fullscreen_quad.material = this.silhouette_alpha_pass.material

        this.renderer.setRenderTarget(null)
        this.renderer.getContext().colorMask(false, false, false, true)
        this.renderer.render(this.scene, this.fullscreen_camera)
        this.renderer.getContext().colorMask(true, true, true, true)

        this.clear_scene()
        this.scene.add(this.renderables.full.surface)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        // Set the silhouette alpha values
        this.silhouette_alpha_pass.material.uniforms.uAlpha = { value: this.settings.silhouette_alpha }
        this.silhouette_alpha_pass.material.depthWrite = false
        this.silhouette_alpha_pass.material.depthTest = true
        this.silhouette_alpha_pass.material.polygonOffset = true
        this.scene.overrideMaterial = this.silhouette_alpha_pass.material
        
        this.renderer.setRenderTarget(null)
        this.renderer.getContext().colorMask(false, false, false, true)
        this.renderer.render(this.scene, this.scene_camera)
        this.renderer.getContext().colorMask(true, true, true, true)

        this.silhouette_alpha_pass.material.polygonOffset = false

        this.clear_scene()
        this.scene.add(this.fullscreen_quad)

        // Do a fullscreen pass, coloring the pixels with set alpha values only
        this.fullscreen_quad.material = this.silhouette_color_pass

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.fullscreen_camera)

        this.clear_scene()
        this.scene.add(this.fullscreen_quad)

        // Set back all alpha values to 1
        this.silhouette_alpha_pass.material.uniforms.uAlpha = { value: 1.0 }
        this.silhouette_alpha_pass.material.depthWrite = false
        this.silhouette_alpha_pass.material.depthTest = false
        this.fullscreen_quad.material = this.silhouette_alpha_pass.material

        this.renderer.setRenderTarget(null)
        this.renderer.getContext().colorMask(false, false, false, true)
        this.renderer.render(this.scene, this.fullscreen_camera)
        this.renderer.getContext().colorMask(true, true, true, true)

        this.clear_scene()
    },

    on_surface_color_change: function () {
        this.ao_pass.original_color = this.buffers.visible.surface.attributes.color
        this.update_osao_buffers()
    },

    clear_scene: function () {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0])
        }
        this.scene.overrideMaterial = null
        this.scene.position.set(0, 0, 0)
    },

    clear_canvas: function () {
        this.renderer.setRenderTarget()
        this.renderer.clear()
    },

    draw_main_model: function () {
        // mesh
        this.clear_scene()
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)
        if (this.settings.lighting == 'Direct') {
            this.scene.add(this.renderables.visible_diffuse.surface)
            const light_pos = new THREE.Vector3().subVectors(this.scene_camera.position, this.scene.position)
            this.scene_light.position.set(light_pos.x, light_pos.y, light_pos.z)
            //this.scene_light.position.copy(this.scene_camera.position)
            this.scene.add(this.scene_light)
        } else {
            this.scene.add(this.renderables.visible.surface)
        }

        // draw
        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.scene_camera)

        if (this.settings.lighting == 'Direct') {
            this.scene_camera.remove(this.scene_light)
        }
    },

    prepare_ssao: function () {
        // mesh view norm/depth
        this.clear_scene()
        this.scene.add(this.renderables.visible.surface)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        // bind material, draw
        this.scene.overrideMaterial = this.depth_pass.material
        this.renderer.setRenderTarget(this.depth_pass.target)
        this.renderer.clear()
        this.renderer.render(this.scene, this.scene_camera)
        //this.renderer.render(this.scene, this.scene_camera, this.depth_pass.target, true)
        
        // bind material, draw
        this.scene.overrideMaterial = this.normal_pass.material
        this.renderer.setRenderTarget(this.normal_pass.target)
        this.renderer.clear()
        this.renderer.render(this.scene, this.scene_camera)
        //this.renderer.render(this.scene, this.scene_camera, this.normal_pass.target, true)
    },

    compute_ssao: function () {
        // quad
        this.clear_scene()
        this.scene.add(this.fullscreen_quad)
        this.scene.position.set(0, 0, 0)

        // update uniforms, bind material
        this.ssao_pass.material.uniforms.uProj    = { value: new THREE.Matrix4().copy(this.scene_camera.projectionMatrix ) }
        this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().copy(this.scene_camera.projectionMatrix).invert() }
        this.blur_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().copy(this.scene_camera.projectionMatrix).invert() }
        //this.ssao_pass.material.uniforms.uProj    = { value: this.scene_camera.projectionMatrix }
        //this.ssao_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(this.scene_camera.projectionMatrix) }
        //this.blur_pass.material.uniforms.uInvProj = { value: new THREE.Matrix4().getInverse(this.scene_camera.projectionMatrix) }
        this.fullscreen_quad.material             = this.ssao_pass.material
        
        // draw
        this.renderer.setRenderTarget(this.ssao_pass.target)
        this.renderer.clear()
        this.renderer.render(this.scene, this.fullscreen_camera)
        //this.renderer.render(this.scene, this.fullscreen_camera, this.ssao_pass.target, true)
    },

    blend_in_ssao: function () {
        // quad
        this.renderer.setRenderTarget(null)
        this.clear_scene()
        this.scene.add(this.fullscreen_quad)
        this.scene.position.set(0, 0, 0)

        this.fullscreen_quad.material = this.blur_pass.material
        this.renderer.render(this.scene, this.fullscreen_camera)
    },

    prepare_osao_step: function () {
        // depth (view pos) pass
        // TODO share this between SSAO and OSAO
        this.clear_scene()
        this.scene.add(this.renderables.visible.surface)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        // clear target to max depth
        let prev_clear_color = new THREE.Color()
        this.renderer.getClearColor(prev_clear_color)
        const prev_clear_alpha = this.renderer.getClearAlpha()
        this.renderer.setClearColor(new THREE.Color(0, 0, -100000), 1.0)
        this.renderer.setRenderTarget(this.viewpos_pass.target)
        this.renderer.clear(true, true, true)
        //this.renderer.clearTarget(this.viewpos_pass.target, true, true, true)
        this.renderer.setClearColor(prev_clear_color, prev_clear_alpha)

        // bind material, fetch camera, draw
        this.scene.overrideMaterial = this.viewpos_pass.material
        const light_cam             = this.ao_pass.views[this.ao_pass.progress.view_i]
        this.renderer.setRenderTarget(this.viewpos_pass.target)
        this.renderer.render(this.scene, light_cam)
        //this.renderer.render(this.scene, light_cam, this.viewpos_pass.target, false)
    },

    compute_osao_step: function () {
        // quad
        this.clear_scene()
        this.scene.add(this.fullscreen_quad)
        this.scene.position.set(0, 0, 0)
        
        // fetch cam
        const light_cam = this.ao_pass.views[this.ao_pass.progress.view_i]
        
        // update uniforms, bind material
        this.ao_pass.material.uniforms.uView.value      = light_cam.matrixWorldInverse
        this.ao_pass.material.uniforms.uCamPos.value    = light_cam.position
        this.ao_pass.material.uniforms.uProj.value      = light_cam.projectionMatrix
        this.ao_pass.material.uniforms.tDepth           = { value: this.viewpos_pass.target.texture }
        this.ao_pass.material.uniforms.uInvProj         = new THREE.Matrix4().copy(light_cam.projectionMatrix).invert()
        //this.ao_pass.material.uniforms.uInvProj         =  { value: new THREE.Matrix4().getInverse(light_cam.projectionMatrix) }
        this.ao_pass.material.uniforms.uModel.value     = new THREE.Matrix4().makeTranslation(
            this.mesh_offset.x, 
            this.mesh_offset.y, 
            this.mesh_offset.z
        )
        this.fullscreen_quad.material = this.ao_pass.material

        // draw
        this.renderer.setRenderTarget(this.ao_pass.progress.target)
        if(this.ao_pass.progress.view_i == 0) this.renderer.clear()
        this.renderer.render(this.scene, this.fullscreen_camera)
        //this.renderer.render(this.scene, this.fullscreen_camera, this.ao_pass.progress.target, this.ao_pass.progress.view_i == 0)

        // progress
        this.ao_pass.progress.view_i += 1

        const light = new THREE.Vector3().add(light_cam.position).normalize()
        const first_light = this.ao_pass.views[0].position.clone().normalize()
        this.ao_pass.progress.sum += Math.max(0, first_light.dot(light))
    },

    draw_transparent: function () {
        this.clear_scene()
        this.scene.add(this.renderables.filtered.surface)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        const c = this.renderables.filtered.surface.material.color
        // this.fresnel_transparency_pass.material.uniforms.uColor = { value: new THREE.Vector3(c.x, c.y, c.z) }
        this.scene.overrideMaterial = this.fresnel_transparency_pass.material

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.scene_camera)
    },

    draw_wireframe: function () {
        this.clear_scene()
        this.scene.add(this.renderables.visible.wireframe)
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.scene_camera)
    },

    draw_singularity: function (mode) {
        this.clear_scene()
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)

        this.scene.add(this.renderables.hidden_line_singularity.wireframe)
        this.scene.add(this.renderables.hidden_spined_singularity.wireframe)
        this.scene.add(this.renderables.hidden_full_singularity.wireframe)
        this.scene.add(this.renderables.hidden_full_singularity.surface)

        this.scene.add(this.renderables.line_singularity.wireframe)
        this.scene.add(this.renderables.spined_singularity.wireframe)
        this.scene.add(this.renderables.full_singularity.wireframe)
        this.scene.add(this.renderables.full_singularity.surface)


        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.scene_camera)
    },

    draw_extra_meshes: function () {
        this.clear_scene()
        this.scene.position.set(this.mesh_offset.x, this.mesh_offset.y, this.mesh_offset.z)
        this.scene.add(this.meshes)

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.scene_camera)
    },

    draw_hud: function () {
        this.clear_scene()
    
        // axes gizmo        
        if (this.do_show_axes) {
            this.scene.add(this.gizmo)
            this.renderer.setViewport(this.width - 110, this.height - 110, 100, 100)
            this.hud_camera.setRotationFromMatrix(this.scene_camera.matrixWorld)
            this.renderer.setRenderTarget(null)
            this.renderer.render(this.scene, this.hud_camera)
            this.scene.remove(this.gizmo)
            this.renderer.setViewport(0, 0, this.width, this.height)
        }
    },

    update_geometry_buffers: function () {
        if (!this.dirty_buffers) return

        this.buffers.update()
        this.reset_osao()

        this.dirty_canvas  = true
        this.dirty_buffers = false
    },

    update_osao_buffers: function () {
        if (!this.mesh) return

        if (this.settings.lighting == 'AO') {
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
            
            this.buffers.visible.surface.deleteAttribute('color')
            this.buffers.visible.surface.setAttribute('color', new THREE.BufferAttribute(new_color, 3))
        } else {
            this.buffers.visible.surface.deleteAttribute('color')
            this.buffers.visible.surface.setAttribute('color', this.ao_pass.original_color)
        }
    },

    step_osao: function () {
        if (this.ao_pass.progress == null || (this.ao_pass.progress.view_i < this.ao_pass.views.length)) {
            this.prepare_osao_step()
            this.compute_osao_step()   
        }

         if (
            this.ao_pass.progress.view_i == 32  ||
            this.ao_pass.progress.view_i == 64  ||
            this.ao_pass.progress.view_i == 128 ||
            this.ao_pass.progress.view_i == 512 ||
            this.ao_pass.progress.view_i == this.ao_pass.views.length && !this.ao_pass.progress.done
        ) {
            if (this.ao_pass.progress.view_i == this.ao_pass.views.length && !this.ao_pass.progress.done) {
                this.ao_pass.progress.done = true
            }

            this.update_osao_buffers()
            this.dirty_canvas = true
        }
    },

    update_canvas: function () {
       // if (!this.dirty_canvas) return

        this.clear_canvas()

        const silhouette_opacity = this.renderables.filtered.surface.material.opacity
        const silhouette_color = this.renderables.filtered.surface.material.color
        this.draw_silhouette()
        this.draw_main_model()

        if (this.settings.lighting == 'SSAO' || this.settings.lighting == 'AO' && this.ao_pass.progress.view_i < 32) {
            this.prepare_ssao()
            this.compute_ssao()
            this.blend_in_ssao()
        }

        this.draw_wireframe()
        this.draw_singularity()
        this.draw_transparent()
        this.draw_extra_meshes()
        this.draw_hud()

        this.dirty_canvas = false

        // This is needed just to leave a pickable surface in the scene
        this.scene.add(this.renderables.visible.surface)
    },

    update: function () {
        if (!this.mesh) return

        this.update_geometry_buffers()
        this.step_osao()
        this.update_canvas()
    },
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
    const self = this
    this.backend = new Module.App()
    HexaLab.app = this

    var width = dom_element.offsetWidth
    var height = dom_element.offsetHeight

    // Viewer
    this.viewer = new HexaLab.Viewer(width, height)
    this.screen_rendering = true

    this.canvas = {
        element: this.viewer.get_element(),
        container: dom_element
    }
    this.canvas.container.appendChild(this.canvas.element)

    this.dirty_canvas = true
    //this.controls = new THREE.TrackballControls(this.viewer.get_scene_camera(), dom_element)
    this.controls = new THREE.ArcballControls(this.viewer.get_scene_camera(), dom_element, this.viewer.scene)
    this.controls.setMouseAction('PAN',1)
    this.controls.dampingFactor = 50
    this.controls.wMax = 10
    this.controls.activateGizmos(true)
    this.controls.adjustNearFar = true
    this.controls.enableGizmos = true
    this.controls.useClipboard = false

    //this.controls.
    // HexaLab.controls.on_mouse_down = function () {
    //     self.mouse_is_down = true
    // }
    // HexaLab.controls.on_mouse_move = function () {
    //     if (self.mouse_is_down) {
    //         self.viewer.show_axes(true)
    //         self.queue_canvas_update()
	// 		self.filters[0].on_change_view();
    //     }
    // }
    // HexaLab.controls.on_mouse_wheel = function () {
    //     self.queue_canvas_update()
    // }
    // HexaLab.controls.on_mouse_up = function () {
    //     self.mouse_is_down = false
    //     self.viewer.show_axes(false)
	// 	self.queue_canvas_update()
    // }

    // App
    this.default_app_settings = {
        
    }

    // Materials
    this.default_material_settings = {
        visible_surface_default_inside_color:       '#ffff00',
        visible_surface_default_outside_color:      '#ffffff',
        // visible_wireframe_color:                 '#000000',
        visible_wireframe_opacity:                  0.15,

        // filtered_surface_color:                  '#d2de0c',
        filtered_surface_color:                     '#a8c2ea',
        filtered_surface_opacity:                   1,
        filtered_wireframe_color:                   '#000000',
        filtered_wireframe_opacity:                 0,

        silhouette_opacity:                         0,
        silhouette_color:                           '#d7d7f0',   // (215, 215, 240)

        // keep these coherent with default app singularity mode
        singularity_faces_opacity:                  0,
        singularity_simple_lines_opacity:           1,
        singularity_full_lines_opacity:             0,
        singularity_hidden_faces_opacity:           0,
        singularity_hidden_simple_lines_opacity:    0,
        singularity_hidden_full_lines_opacity:      0,
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
        lighting:        'AO',
        antialiasing:    'msaa',
        light_intensity: 1,

        apply_color_map:    false,
        singularity_mode:   1,
        color_map:          'Parula',
        quality_measure:    'ScaledJacobian',
        geometry_mode:      'DynamicLines',
        crack_size:         0.25,
        rounding_radius:    0.25,
        erode_dilate_level: 0
    }

    // Filters
    this.filters = [];
    for (var k in HexaLab.filters) {
        this.filters[k] = HexaLab.filters[k];
        if (this.filters[k].default_settings) {
            //this.filters[k].set_settings(this.filters[k].default_settings);
        }
        this.backend.add_filter(this.filters[k].backend);
    }

    // Plots ?
    this.plots = []

    // Resize callback
    window.addEventListener('resize', this.resize.bind(this))

    // See if the user already requested a mesh via GET params
    HexaLab.UI.process_html_params()
};

Object.assign(HexaLab.App.prototype, {

    // Wrappers
    camera:     function () { return this.viewer.scene_camera },
    materials:  function () { return this.viewer.materials },
    queue_buffers_update:   function () { this.viewer.on_buffers_change() },
    queue_canvas_update:    function () { this.viewer.on_scene_change() },

    // Settings
    get_camera_settings: function () {
        if (this.mesh) {
            let worldCameraDir = new THREE.Vector3()            
            this.camera().getWorldDirection(worldCameraDir)
            //console.log("worldCameraDir"+worldCameraDir)
            return {
                offset:     new THREE.Vector3().subVectors(this.controls.target, new THREE.Vector3(0, 0, 0)),
                direction:  worldCameraDir,
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
            lighting:        this.viewer.get_lighting_mode(),
            antialiasing:    this.viewer.get_aa_mode(),

            singularity_mode:                       this.singularity_mode,
            quality_measure:                        this.quality_measure,
            apply_color_map:                        this.apply_color_map,
            color_map:                              this.color_map,
            geometry_mode:                          this.geometry_mode,
            crack_size:                             this.crack_size,
            rounding_radius:                        this.rounding_radius,
            erode_dilate_level:                     this.erode_dilate_level
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
            visible_surface_default_inside_color:       get_default_inside_color(),
            visible_surface_default_outside_color:      get_default_outside_color(),
            is_quality_color_mapping_enabled:           this.backend.is_quality_color_mapping_enabled(),
            visible_wireframe_opacity:                  this.materials().visible_wireframe.uniforms.uAlpha.value,
            filtered_surface_opacity:                   this.materials().filtered_surface.opacity,
            filtered_wireframe_opacity:                 this.materials().filtered_wireframe.opacity,
            filtered_surface_color:                     '#' + this.materials().filtered_surface.color.getHexString(),
            filtered_wireframe_color:                   '#' + this.materials().filtered_wireframe.color.getHexString(),
            silhouette_opacity:                         this.viewer.get_silhouette_opacity(),
            silhouette_color:                           '#' + this.viewer.get_silhouette_color().getHexString(),
            singularity_mode:                           this.singularity_mode,
            singularity_simple_lines_opacity:           this.materials().singularity_line_wireframe.opacity,
            singularity_full_lines_opacity:             this.materials().singularity_wireframe.opacity,
            singularity_faces_opacity:                  this.materials().singularity_surface.opacity,
            singularity_hidden_simple_lines_opacity:    this.materials().singularity_hidden_line_wireframe.opacity,
            singularity_hidden_full_lines_opacity:      this.materials().singularity_hidden_wireframe.opacity,
            singularity_hidden_faces_opacity:           this.materials().singularity_hidden_surface.opacity,
        }
    },

    get_app_settings: function () {
        const x =  {
            
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

        this.queue_canvas_update()
    },

    set_rendering_settings: function (settings) {
        this.set_background_color(settings.background)
        this.set_light_intensity(settings.light_intensity)
        this.set_lighting_mode(settings.lighting)
        this.set_antialiasing(settings.antialiasing)

        this.set_color_map(settings.color_map)
        this.show_visible_quality(settings.apply_color_map)
        this.set_singularity_mode(settings.singularity_mode)
        this.set_quality_measure(settings.quality_measure)
        this.set_geometry_mode(settings.geometry_mode)
        this.set_crack_size(settings.crack_size)
        this.set_rounding_radius(settings.rounding_radius)
        this.set_erode_dilate_level(settings.erode_dilate_level)
    },

    set_material_settings: function (settings) {
        // this.set_visible_wireframe_color(settings.visible_wireframe_color)
        this.set_visible_wireframe_opacity(settings.visible_wireframe_opacity)
        this.set_filtered_surface_color(settings.filtered_surface_color)
        this.set_filtered_surface_opacity(settings.filtered_surface_opacity)
        this.set_filtered_wireframe_color(settings.filtered_wireframe_color)
        this.set_filtered_wireframe_opacity(settings.filtered_wireframe_opacity)
        this.viewer.set_silhouette_opacity(settings.silhouette_opacity)
        this.viewer.set_silhouette_color(settings.silhouette_color)
        this.set_visible_surface_default_outside_color(settings.visible_surface_default_outside_color)
        this.set_visible_surface_default_inside_color(settings.visible_surface_default_inside_color)
        this.set_singularity_surface_opacity(settings.singularity_faces_opacity)
        this.set_singularity_wireframe_opacity(settings.singularity_full_lines_opacity)
        this.set_singularity_line_wireframe_opacity(settings.singularity_simple_lines_opacity)
        this.set_singularity_hidden_surface_opacity(settings.singularity_hidden_faces_opacity)
        this.set_singularity_hidden_wireframe_opacity(settings.singularity_hidden_full_lines_opacity)
        this.set_singularity_hidden_line_wireframe_opacity(settings.singularity_hidden_simple_lines_opacity)
    },

    set_app_settings: function (settings) {
        
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
        if (settings.app!=undefined) this.set_app_settings(settings.app)
        if (settings.camera!=undefined) this.set_camera_settings(settings.camera)
        if (settings.rendering!=undefined) this.set_rendering_settings(settings.rendering)
		if (settings.materials!=undefined) this.set_material_settings(settings.materials)
        
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
		this.queue_canvas_update()
        this.controls.handleResize()
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
        else if (map == 'RedBlue') this.backend.enable_quality_color_mapping(Module.ColorMap.RedBlue)
        this.queue_buffers_update()
    },

    disable_quality_color_mapping: function () {
        this.backend.disable_quality_color_mapping()
        this.queue_buffers_update()
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
        this.queue_buffers_update()
        HexaLab.UI.on_set_visible_surface_default_inside_color(color)
    },
    set_visible_surface_default_outside_color: function (color) {
        var c = new THREE.Color(color)
        this.backend.set_default_outside_color(c.r, c.g, c.b)
        this.queue_buffers_update()
        HexaLab.UI.on_set_visible_surface_default_outside_color(color)
    },

    set_quality_measure: function (measure) {
        if      (measure == "ScaledJacobian")           this.backend.set_quality_measure(Module.QualityMeasure.ScaledJacobian)
        else if (measure == "EdgeRatio")                this.backend.set_quality_measure(Module.QualityMeasure.EdgeRatio)
        else if (measure == "Diagonal")                 this.backend.set_quality_measure(Module.QualityMeasure.Diagonal)
        else if (measure == "Dimension")                this.backend.set_quality_measure(Module.QualityMeasure.Dimension)
        else if (measure == "Distortion")               this.backend.set_quality_measure(Module.QualityMeasure.Distortion)
        else if (measure == "Jacobian")                 this.backend.set_quality_measure(Module.QualityMeasure.Jacobian)
        else if (measure == "MaxEdgeRatio")             this.backend.set_quality_measure(Module.QualityMeasure.MaxEdgeRatio)
        else if (measure == "MaxAspectFrobenius")       this.backend.set_quality_measure(Module.QualityMeasure.MaxAspectFrobenius)
        else if (measure == "MeanAspectFrobenius")      this.backend.set_quality_measure(Module.QualityMeasure.MeanAspectFrobenius)
        else if (measure == "Oddy")                     this.backend.set_quality_measure(Module.QualityMeasure.Oddy)
        else if (measure == "RelativeSizeSquared")      this.backend.set_quality_measure(Module.QualityMeasure.RelativeSizeSquared)
        else if (measure == "Shape")                    this.backend.set_quality_measure(Module.QualityMeasure.Shape)
        else if (measure == "ShapeAndSize")             this.backend.set_quality_measure(Module.QualityMeasure.ShapeAndSize)
        else if (measure == "Shear")                    this.backend.set_quality_measure(Module.QualityMeasure.Shear)
        else if (measure == "ShearAndSize")             this.backend.set_quality_measure(Module.QualityMeasure.ShearAndSize)
        else if (measure == "Skew")                     this.backend.set_quality_measure(Module.QualityMeasure.Skew)
        else if (measure == "Stretch")                  this.backend.set_quality_measure(Module.QualityMeasure.Stretch)
        else if (measure == "Taper")                    this.backend.set_quality_measure(Module.QualityMeasure.Taper)
        else if (measure == "Volume")                   this.backend.set_quality_measure(Module.QualityMeasure.Volume)
        this.quality_measure = measure
        this.queue_buffers_update()    // TODO update only on real need (needs to query quality filter enabled state)
        HexaLab.UI.on_set_quality_measure(measure)
    },

    set_geometry_mode: function (mode) {
        if      (mode == 'Lines')           this.backend.set_geometry_mode(Module.GeometryMode.Default)
        else if (mode == 'DynamicLines')    this.backend.set_geometry_mode(Module.GeometryMode.Default)
        else if (mode == 'Cracked')         this.backend.set_geometry_mode(Module.GeometryMode.Cracked)
        else if (mode == 'Smooth')          this.backend.set_geometry_mode(Module.GeometryMode.Smooth)
        if (mode == 'DynamicLines') {
            this.materials().visible_wireframe.uniforms.uMixAlpha = { value: true }
        } else {
            this.materials().visible_wireframe.uniforms.uMixAlpha = { value: false }
        }
        this.geometry_mode = mode
        this.queue_buffers_update()
        HexaLab.UI.on_set_geometry_mode(mode)
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
            this.set_singularity_line_wireframe_opacity(0)
            this.set_singularity_spined_wireframe_opacity(0)
            this.set_singularity_wireframe_opacity(0)
            this.set_singularity_surface_opacity(0)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 1) {
            this.set_singularity_line_wireframe_opacity(1)
            this.set_singularity_spined_wireframe_opacity(0)
            this.set_singularity_wireframe_opacity(0)
            this.set_singularity_surface_opacity(0)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 2) {
            this.set_singularity_line_wireframe_opacity(1)
            this.set_singularity_spined_wireframe_opacity(0)
            this.set_singularity_wireframe_opacity(0)
            this.set_singularity_surface_opacity(0)
            this.set_singularity_hidden_line_wireframe_opacity(0.3)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 3) {
            this.set_singularity_line_wireframe_opacity(0)
            this.set_singularity_spined_wireframe_opacity(1)
            this.set_singularity_wireframe_opacity(0)
            this.set_singularity_surface_opacity(0)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 4) {
            this.set_singularity_line_wireframe_opacity(0)
            this.set_singularity_spined_wireframe_opacity(1)
            this.set_singularity_wireframe_opacity(0)
            this.set_singularity_surface_opacity(0)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0.3)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 5) {
            this.set_singularity_line_wireframe_opacity(0)
            this.set_singularity_spined_wireframe_opacity(0)
            this.set_singularity_wireframe_opacity(1)
            this.set_singularity_surface_opacity(1)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0)
            this.set_singularity_hidden_surface_opacity(0)
        } else if (mode == 6) {
            this.set_singularity_line_wireframe_opacity(0)
            this.set_singularity_spined_wireframe_opacity(0)
            this.set_singularity_wireframe_opacity(1)
            this.set_singularity_surface_opacity(1)
            this.set_singularity_hidden_line_wireframe_opacity(0)
            this.set_singularity_hidden_spined_wireframe_opacity(0)
            this.set_singularity_hidden_wireframe_opacity(0.1)
            this.set_singularity_hidden_surface_opacity(0.3)
        }
        // if (this.singularity_mode == 0 && mode > 0) {
        //     if (this.materials().filtered_surface.opacity > 0.3) {
        //         var x = this.materials().filtered_surface.opacity
        //         this.set_filtered_surface_opacity(0.3)
        //         this.prev_filtered_surface_opacity = x
        //     }
        //     if (this.materials().visible_wireframe.opacity > 0.3) {
        //         var x = this.materials().visible_wireframe.opacity
        //         this.set_visible_wireframe_opacity(0.3)
        //         this.prev_visible_wireframe_opacity = x
        //     }
        // } else if (this.singularity_mode > 0 && mode == 0) {
        //     if (this.prev_filtered_surface_opacity) {
        //         this.set_filtered_surface_opacity(this.prev_filtered_surface_opacity)
        //     }
        //     if (this.prev_visible_wireframe_opacity) {
        //         this.set_visible_wireframe_opacity(this.prev_visible_wireframe_opacity)
        //     }
        // }
        // if (this.singularity_mode < 2 && mode >= 2) {
        //     this.backend.show_boundary_singularity(true)
        //     this.backend.show_boundary_creases(true)
        //     this.queue_buffers_update()
        // } else if (this.singularity_mode >= 2 && mode < 2) {
        //     this.backend.show_boundary_singularity(false)
        //     this.backend.show_boundary_creases(false)
        //     this.queue_buffers_update()
        // }
        this.singularity_mode = mode
        HexaLab.UI.on_set_singularity_mode(mode)
        this.queue_canvas_update()
    },

    set_silhouette_intensity: function (value) {
        if (value < 0.5) {
            this.viewer.set_silhouette_opacity(value * 2)
            this.set_filtered_surface_opacity(0)
        } else {
            this.viewer.set_silhouette_opacity(2 - (value * 2))
            this.set_filtered_surface_opacity((value - 0.5) * 2)
        }
    },

    set_crack_size: function (size) {
        this.backend.set_crack_size(size)
        this.crack_size = size
        this.queue_buffers_update()
        HexaLab.UI.on_set_crack_size(size)
    },
    set_rounding_radius: function (rad) {
        this.backend.set_rounding_radius(rad)
        this.rounding_radius = rad
        this.queue_buffers_update()
        HexaLab.UI.on_set_rounding_radius(rad)
    },

    set_visible_wireframe_opacity:      function (opacity) {
        this.materials().visible_wireframe.uniforms.uAlpha = { value: opacity }
        this.materials().visible_wireframe.visible = opacity != 0
        this.prev_visible_wireframe_opacity = null
        HexaLab.UI.on_set_wireframe_opacity(opacity)
        this.queue_canvas_update()
    },
    
    set_filtered_surface_opacity:       function (opacity) {
        this.viewer.fresnel_transparency_pass.material.uniforms.uAlpha = { value: opacity }
        this.materials().filtered_surface.opacity = opacity
        this.materials().filtered_surface.visible = opacity != 0
        this.prev_filtered_surface_opacity = null
        HexaLab.UI.on_set_filtered_surface_opacity(opacity)
        this.queue_canvas_update()
    },
    set_filtered_wireframe_opacity:     function (opacity) {
        this.materials().filtered_wireframe.opacity = opacity
        this.materials().filtered_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_filtered_surface_color:         function (color) { 
        this.materials().filtered_surface.color.set(color);
        this.queue_canvas_update() 
    },
    set_filtered_wireframe_color:       function (color) { 
        this.materials().filtered_wireframe.color.set(color); 
        this.queue_canvas_update() 
    },

    set_singularity_surface_opacity:    function (opacity) {
        this.materials().singularity_surface.opacity = opacity
        this.materials().singularity_surface.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_wireframe_opacity:  function (opacity) { 
        this.materials().singularity_wireframe.opacity = opacity
        this.materials().singularity_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_line_wireframe_opacity:  function (opacity) { 
        this.materials().singularity_line_wireframe.opacity = opacity
        this.materials().singularity_line_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_spined_wireframe_opacity:  function (opacity) { 
        this.materials().singularity_spined_wireframe.opacity = opacity
        this.materials().singularity_spined_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_hidden_surface_opacity: function (opacity) {
        this.materials().singularity_hidden_surface.opacity = opacity
        this.materials().singularity_hidden_surface.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_hidden_wireframe_opacity: function (opacity) {
        this.materials().singularity_hidden_wireframe.opacity = opacity
        this.materials().singularity_hidden_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_hidden_line_wireframe_opacity: function (opacity) {
        this.materials().singularity_hidden_line_wireframe.opacity = opacity
        this.materials().singularity_hidden_line_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },
    set_singularity_hidden_spined_wireframe_opacity: function (opacity) {
        this.materials().singularity_hidden_spined_wireframe.opacity = opacity
        this.materials().singularity_hidden_spined_wireframe.visible = opacity != 0
        this.queue_canvas_update()
    },

    // set_visible_wireframe_color:            function (color)        { this.materials().visible_wireframe.color.set(color) },

    set_erode_dilate_level: function (value) {
        this.erode_dilate_level = value
        this.backend.set_regularize_str(value)
        HexaLab.UI.on_set_erode_dilate(value)
        this.queue_buffers_update()
    },

    set_lighting_mode: function (value) { 
        this.viewer.set_lighting_mode(value)
        HexaLab.UI.on_set_lighting_mode(value) 
    },
    set_antialiasing: function (value) { 
        this.viewer.set_aa_mode(value) 
    },
    set_background_color: function (color) { 
        this.viewer.set_background_color(color)
        this.queue_canvas_update() 
    },
    set_light_intensity: function (intensity) { 
        this.viewer.set_light_intensity(intensity)
        this.queue_canvas_update() 
    },
	
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
        let first = this.mesh == null
        this.mesh = this.backend.get_mesh()
        // update UI
        HexaLab.UI.on_import_mesh(path)
		
		
        // reset settings: every loaded mesh
        if (first) {
            this.set_settings({
                app:        this.default_app_settings,
                camera:     this.default_camera_settings,
                rendering:  this.default_rendering_settings,
                materials:  this.default_material_settings
            })
        } else {
            this.set_settings({
                app:        this.default_app_settings,
                camera:     this.default_camera_settings,
                //rendering:  this.default_rendering_settings,
                //materials:  this.default_material_settings
            })    
        }
        
		
        // notify filters
        for (var k in this.filters) {
            this.filters[k].on_mesh_change(this.mesh)
        }
        // notify viewer
        this.viewer.on_mesh_change(this.mesh)
    },

    // The application main loop. Call this after instancing an App object to start rendering.
    animate: function () {
        if (this.screen_rendering) {
            // this.controls.update()
            this.viewer.update()
        }

        if (this.on_stable_rendering_callback && (this.get_rendering_settings().lighting != 'AO' || this.viewer.ao_pass.progress.done == true)) {
            this.on_stable_rendering_callback()
            this.on_stable_rendering_callback = null
        }

        // queue next frame
        requestAnimationFrame(this.animate.bind(this))
        this.controls.update()
        this.viewer.update()
    },

    enable_screen_rendering: function (enabled) {
        this.screen_rendering = enabled
    },

    force_canvas_update: function () {
        this.viewer.update()
    },

    on_stable_rendering: function (cb) {
        this.on_stable_rendering_callback = cb
    }

});
