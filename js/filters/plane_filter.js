"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.plane_enabled = $('#plane_enabled')
HexaLab.UI.plane_offset_slider = $('#plane_offset_slider').slider()
HexaLab.UI.plane_offset_number = $('#plane_offset_number')
HexaLab.UI.plane_nx = $('#plane_nx')
HexaLab.UI.plane_ny = $('#plane_ny')
HexaLab.UI.plane_nz = $('#plane_nz')
HexaLab.UI.plane_snap_nx = $('#plane_snap_nx')
HexaLab.UI.plane_snap_ny = $('#plane_snap_ny')
HexaLab.UI.plane_snap_nz = $('#plane_snap_nz')
HexaLab.UI.plane_swap = $('#plane_swap_sign')
HexaLab.UI.plane_snap_camera = $('#plane_snap_camera')

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------
HexaLab.PlaneFilter = function () {

    // Ctor
    HexaLab.Filter.call(this, new Module.PlaneFilter(), 'Plane');

    // Listener
    var self = this;
    HexaLab.UI.plane_nx.change(function () {
        self.set_plane_normal(parseFloat(this.value), self.plane.normal.y, self.plane.normal.z)
        HexaLab.app.update()
    })
    HexaLab.UI.plane_ny.change(function () {
        self.set_plane_normal(self.plane.normal.x, parseFloat(this.value), self.plane.normal.z)
        HexaLab.app.update()
    })
    HexaLab.UI.plane_nz.change(function () {
        self.set_plane_normal(self.plane.normal.x, self.plane.normal.y, parseFloat(this.value))
        HexaLab.app.update()
    })
    HexaLab.UI.plane_offset_number.change(function () {
        self.set_plane_offset(parseFloat(this.value))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.plane_offset_slider.slider({
        min: 0,
        max: 1000
    }).on('slide', function (e, ui) {
        self.set_plane_offset(ui.value / 1000);
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.plane_snap_nx.on('click', function () {
        self.set_plane_normal(1, 0, 0)
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.plane_snap_ny.on('click', function () {
        self.set_plane_normal(0, 1, 0)
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.plane_snap_nz.on('click', function () {
        self.set_plane_normal(0, 0, 1)
        self.sync()
        HexaLab.app.update();
    })
    HexaLab.UI.plane_swap.on('click', function () {
        var n = self.plane.normal.clone().negate();
        self.set_plane_offset(1 - self.plane.offset)
        self.set_plane_normal(n.x, n.y, n.z)
        self.sync()
        HexaLab.app.update();
    })
    HexaLab.UI.plane_snap_camera.on('click', function () {
        var camera_dir = HexaLab.app.camera.getWorldDirection()
        self.set_plane_normal(camera_dir.x, camera_dir.y, camera_dir.z)
        self.sync()
        HexaLab.app.update()
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
        normal: null
    };

    this.default_settings = {
        plane_normal: new THREE.Vector3(1, 0, 0),
        plane_offset: 0.39,
        plane_opacity: 0.3,
        plane_color: "#56bbbb"
    }
};

HexaLab.PlaneFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            plane_normal: this.plane.normal,
            plane_offset: this.plane.offset,
            plane_opacity: this.plane.material.opacity,
            plane_color: '#' + this.plane.material.color.getHexString()
        };
    },

    set_settings: function (settings) {
        this.set_plane_normal(settings.plane_normal.x, settings.plane_normal.y, settings.plane_normal.z);
        this.set_plane_offset(settings.plane_offset);
        this.set_plane_opacity(settings.plane_opacity);
        this.set_plane_color(settings.plane_color);
    },

    on_mesh_change: function (mesh) {
        this.mesh = mesh;
        this.filter.on_mesh_set(mesh);

        this.scene.remove(this.plane.mesh);
        var geometry = new THREE.PlaneGeometry(this.mesh.get_size(), this.mesh.get_size());
        this.plane.mesh = new THREE.Mesh(geometry, this.plane.material);
        this.scene.add(this.plane.mesh);
        this.set_settings(this.get_settings());
        this.update_mesh();
    },

    sync: function () {
        HexaLab.UI.plane_offset_slider.slider('value', this.plane.offset * 1000)
        HexaLab.UI.plane_offset_number.val(this.plane.offset);

        HexaLab.UI.plane_nx.val(this.plane.normal.x.toFixed(3));
        HexaLab.UI.plane_ny.val(this.plane.normal.y.toFixed(3));
        HexaLab.UI.plane_nz.val(this.plane.normal.z.toFixed(3));

        //HexaLab.UI.plane_opacity.slider('value', opacity * 100);
        //HexaLab.UI.plane_color.val(color);
    },

    // State

    set_plane_normal: function (nx, ny, nz) {
        this.filter.set_plane_normal(nx, ny, nz);
        var n = this.filter.get_plane_normal();
        this.plane.normal = new THREE.Vector3(nx, ny, nz);
        n.delete(); // TODO don't allocate at all, just read memory?

        this.update_mesh();
    },

    set_plane_offset: function (offset) {
        this.filter.set_plane_offset(offset);
        this.plane.offset = offset;
        this.plane.world_offset = this.filter.get_plane_world_offset();

        this.update_mesh();
    },

    set_plane_opacity: function (opacity) {
        this.plane.material.opacity = opacity;
    },

    set_plane_color: function (color) {
        this.plane.material.color.set(color);
    },

    update_mesh: function () {
        if (this.plane.mesh) {
            var pos = this.mesh.get_center();
            this.plane.mesh.position.set(pos.x(), pos.y(), pos.z());
            var dir = new THREE.Vector3().addVectors(this.plane.mesh.position, this.plane.normal);
            this.plane.mesh.lookAt(dir);
            this.plane.mesh.translateZ(-this.plane.world_offset);
        }
    }
});

HexaLab.filters.push(new HexaLab.PlaneFilter());