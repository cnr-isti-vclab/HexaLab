"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
// TODO use PlaneFilter namespace?
HexaLab.UI.plane_enabled        = $('#plane_enabled')
HexaLab.UI.plane_offset_slider  = $('#plane_offset_slider').slider()
HexaLab.UI.plane_offset_number  = $('#plane_offset_number')
HexaLab.UI.plane_nx             = $('#plane_nx')
HexaLab.UI.plane_ny             = $('#plane_ny')
HexaLab.UI.plane_nz             = $('#plane_nz')
HexaLab.UI.plane_snap_nx        = $('#plane_snap_nx')
HexaLab.UI.plane_snap_ny        = $('#plane_snap_ny')
HexaLab.UI.plane_snap_nz        = $('#plane_snap_nz')
HexaLab.UI.plane_swap           = $('#plane_swap_sign')
HexaLab.UI.plane_snap_camera    = $('#plane_snap_camera')

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------
HexaLab.PlaneFilter = function () {

    // Ctor
    HexaLab.Filter.call(this, new Module.PlaneFilter(), 'Plane');

    // Listener
    var self = this;
    HexaLab.UI.plane_enabled.change(function () {
        self.enable($(this).is(':checked'))
    })
    HexaLab.UI.plane_nx.change(function () {
        self.set_plane_normal(parseFloat(this.value), self.plane.normal.y, self.plane.normal.z)
    })
    HexaLab.UI.plane_ny.change(function () {
        self.set_plane_normal(self.plane.normal.x, parseFloat(this.value), self.plane.normal.z)
    })
    HexaLab.UI.plane_nz.change(function () {
        self.set_plane_normal(self.plane.normal.x, self.plane.normal.y, parseFloat(this.value))
    })
    HexaLab.UI.plane_offset_number.change(function () {
        self.set_plane_offset(parseFloat(this.value))
    })
    HexaLab.UI.plane_offset_slider.slider({
        min: 0,
        max: 1000
    }).on('slide', function (e, ui) {
        self.set_plane_offset(ui.value / 1000)
    }).on('slidestart', function(e, ui) {
        self.visible_color = true
        self.visible_edge = true
        self.update_visibility()
    }).on('slidestop', function(e, ui) {
        self.visible_color = false
        self.visible_edge = false
        self.update_visibility()
    })
    HexaLab.UI.plane_snap_nx.on('click', function () {
        self.set_plane_normal(1, 0, 0)
    })
    HexaLab.UI.plane_snap_ny.on('click', function () {
        self.set_plane_normal(0, 1, 0)
    })
    HexaLab.UI.plane_snap_nz.on('click', function () {
        self.set_plane_normal(0, 0, 1)
    })
    HexaLab.UI.plane_swap.on('click', function () {
        var n = self.plane.normal.clone().negate();
        self.set_plane_offset(1 - self.plane.offset)
        self.set_plane_normal(n.x, n.y, n.z)
    })
    HexaLab.UI.plane_snap_camera.on('click', function () {
        var camera_dir = HexaLab.app.camera.getWorldDirection()
        self.set_plane_normal(camera_dir.x, camera_dir.y, camera_dir.z)
    })

    /*HexaLab.UI.plane_color.change(function () {
        self.set_plane_color($(this).val());
    })
    HexaLab.UI.plane_opacity.slider().on('slide', function (e, ui) {
        self.set_plane_opacity(ui.value / 100);
    })*/

    // State
    this.plane = {
        material: new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        }),
        offset: 0,
        world_offset: 0,
        position: null,
        normal: null,
        mesh: new THREE.Mesh(),
        edges: new THREE.LineSegments()
    };

    self.visible_color = false
    self.visible_edge = false

    this.default_settings = {
        enabled: true,
        normal: new THREE.Vector3(1, 0, 0),
        offset: 0,
        opacity: 0.3,
        color: "#56bbbb"
    }
};

HexaLab.PlaneFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            enabled: this.backend.enabled,
            normal: this.plane.normal,
            offset: this.plane.offset,
            opacity: this.plane.material.opacity,
            color: '#' + this.plane.material.color.getHexString()
        };
    },

    set_settings: function (settings) {
        this.enable(settings.enabled)
        this.set_plane_normal(settings.normal.x, settings.normal.y, settings.normal.z);
        this.set_plane_offset(settings.offset);
        this.set_plane_opacity(settings.opacity);
        this.set_plane_color(settings.color);
    },

    read_normal_from_backend: function () {
        const n = this.backend.get_plane_normal()
        const v = new THREE.Vector3(n.x(), n.y(), n.z())
        n.delete();
        return v;
    },

    on_mesh_change: function (mesh) {
        this.mesh = mesh;

        this.scene.remove(this.plane.mesh);
        this.scene.remove(this.plane.edges);

        var geometry = new THREE.PlaneGeometry(this.mesh.get_aabb_diagonal(), this.mesh.get_aabb_diagonal());
        var edges = new THREE.EdgesGeometry(geometry)
        this.plane.mesh = new THREE.Mesh(geometry, this.plane.material);
        this.plane.edges = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: this.plane.material.color,
            transparent: true,
            opacity: 1.0 // TODO differentiate between filter scene objects meshes and wireframe, draw meshes pre-ssao, wireframe post-ssao
        }))

        this.scene.add(this.plane.mesh)
        this.scene.add(this.plane.edges)
        this.update_visibility()

        this.set_plane_opacity(this.default_settings.opacity)
        this.set_plane_color(this.default_settings.color)

        this.on_enabled_set(this.backend.enabled)
        this.on_plane_normal_set(this.read_normal_from_backend())
        this.on_plane_offset_set(this.backend.get_plane_offset())

        this.update_mesh();
    },

    // system -> UI

    on_enabled_set: function (bool) {
        HexaLab.UI.plane_enabled.prop('checked', bool)
    },

    on_plane_normal_set: function (normal) {
        HexaLab.UI.plane_nx.val(normal.x.toFixed(3));
        HexaLab.UI.plane_ny.val(normal.y.toFixed(3));
        HexaLab.UI.plane_nz.val(normal.z.toFixed(3));
    },

    on_plane_offset_set: function (offset) {
        HexaLab.UI.plane_offset_slider.slider('value', offset * 1000)
        HexaLab.UI.plane_offset_number.val(offset);
    },

    // State

    enable: function (enabled) {
        this.backend.enabled = enabled
        this.update_visibility()
        this.on_enabled_set(enabled)
        HexaLab.app.queue_models_update(true, true)
    },

    set_plane_normal: function (nx, ny, nz) {
        this.backend.set_plane_normal(nx, ny, nz);
        var n = this.backend.get_plane_normal();
        this.plane.normal = new THREE.Vector3(nx, ny, nz);
        n.delete(); // TODO don't allocate at all, just read memory?
        this.on_plane_normal_set(this.plane.normal)
        this.update_mesh();
        HexaLab.app.queue_models_update(true, true)
    },

    set_plane_offset: function (offset) {
        this.backend.set_plane_offset(offset);
        this.plane.offset = offset;
        this.plane.world_offset = this.backend.get_plane_world_offset();
        this.on_plane_offset_set(offset)
        this.update_mesh();
        HexaLab.app.queue_models_update(true, true)
    },

    set_plane_opacity: function (opacity) {
        this.plane.material.opacity = opacity
    },

    set_plane_color: function (color) {
        this.plane.material.color.set(color);
    },

    update_visibility: function () {
        if (this.backend.enabled) {
            if (this.visible_color) {
                this.plane.mesh.visible = true
            } else {
                this.plane.mesh.visible = false
            }
            if (this.visible_edge) {
                this.plane.edges.visible = true
            } else {
                this.plane.edges.visible = false
            }
        } else {
            if (this.plane.mesh) this.plane.mesh.visible = false
            if (this.plane.edges) this.plane.edges.visible = false
        }
    },

    update_mesh: function () {
        if (this.mesh) {
            for (var x of [this.plane.mesh, this.plane.edges]) {
                var pos = this.mesh.get_aabb_center();
                x.position.set(pos.x(), pos.y(), pos.z());
                x.position.set(0, 0, 0);
                var dir = new THREE.Vector3().addVectors(x.position, this.plane.normal);
                x.lookAt(dir);
                x.translateZ(-this.plane.world_offset);
            }
        }
    }
});

HexaLab.filters.push(new HexaLab.PlaneFilter());
