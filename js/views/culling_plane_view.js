"use strict";

HexaLab.CullingPlaneView = function (mesh) {

    // View Constructor
    this.mesh = mesh;
    HexaLab.WebGLView.call(this, new Module.CullingPlaneView(mesh), 'Mesh');

    // Models

    this.models.straight = new HexaLab.Model(
        this.view.get_straight_model(),
        new THREE.MeshLambertMaterial({
            polygonOffset: true,
            polygonOffsetFactor: 0.5
        }),
        new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false
        })
    );

    this.models.hidden = new HexaLab.Model(
        this.view.get_hidden_model(),
        new THREE.MeshBasicMaterial({
            polygonOffset: true,
            polygonOffsetFactor: 0.5,
            transparent: true,
            depthWrite: false
        }),
        new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
        })
    );

    this.models.singularity = new HexaLab.Model(
        this.view.get_singularity_model(),
        null,
        new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            vertexColors: THREE.VertexColors
        })
    );

    // Plane 

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

    // Gui

    var self = this;
    var set_plane_normal_from_gui = function () {
        var nx = self.gui.map.plane_nx.get();
        var ny = self.gui.map.plane_ny.get();
        var nz = self.gui.map.plane_nz.get();
        self.set_plane_normal(nx, ny, nz);
    }
    var set_plane_position_from_gui = function () {
        var x = self.gui.map.plane_x.get();
        var y = self.gui.map.plane_y.get();
        var z = self.gui.map.plane_z.get();
        self.set_plane_position(x, y, z);
    }

    this.gui.new_frame({
        title: 'View Settings'
    }).append(this.gui.group({
        title: 'Plane'
    }).append(this.gui.numeric({
        key: 'plane_nx',
        label: 'normal',
        callback: function () {
            set_plane_normal_from_gui();
            self.update();
        }
    })).append(this.gui.numeric({
        key: 'plane_ny',
        callback: function () {
            set_plane_normal_from_gui();
            self.update();
        }
    })).append(this.gui.numeric({
        key: 'plane_nz',
        callback: function () {
            set_plane_normal_from_gui();
            self.update();
        }
    })).newline().append(this.gui.numeric({
        key: 'plane_x',
        label: 'position',
        callback: function () {
            set_plane_position_from_gui();
            self.update();
        }
    })).append(this.gui.numeric({
        key: 'plane_y',
        callback: function () {
            set_plane_position_from_gui();
            self.update();
        }
    })).append(this.gui.numeric({
        key: 'plane_z',
        callback: function () {
            set_plane_position_from_gui();
            self.update();
        }
    })).append(this.gui.range({
        key: 'plane_offset',
        style: 'width:100%; max-width:500px',
        callback: function () {
            self.set_plane_offset(this.get());
            self.update();
        }
    })).newline().append(this.gui.color_picker({
        key: 'plane_color',
        label: 'color',
        callback: function () {
            self.set_plane_color(this.get());
        }
    })).newline().append(this.gui.range({
        key: 'plane_opacity',
        label: 'opacity',
        callback: function () {
            self.set_plane_opacity(this.get());
        }
    }))).append(this.gui.group({
        title: 'Object'
    }).append(this.gui.checkbox({
        key: 'show_quality',
        label: 'show quality',
        callback: function () {
            self.show_quality(this.get());
        }
    })).newline().append(this.gui.color_picker({
        key: 'straight_surface_color',
        label: 'surface color',
        callback: function () {
            self.set_straight_surface_color(this.get());
        }
    })).newline().append(this.gui.color_picker({
        key: 'straight_wireframe_color',
        label: 'wireframe color',
        callback: function () {
            self.set_straight_wireframe_color(this.get());
        }
    })).newline().append(this.gui.range({
        key: 'straight_wireframe_opacity',
        label: 'wireframe opacity',
        callback: function () {
            self.set_straight_wireframe_opacity(this.get());
        }
    })).newline().append(this.gui.color_picker({
        key: 'hidden_surface_color',
        label: 'culled surface color',
        callback: function () {
            self.set_hidden_surface_color(this.get());
        }
    })).newline().append(this.gui.range({
        key: 'hidden_surface_opacity',
        label: 'culled surface opacity',
        callback: function () {
            self.set_hidden_surface_opacity(this.get());
        }
    })).newline().append(this.gui.color_picker({
        key: 'hidden_wireframe_color',
        label: 'culled wireframe color',
        callback: function () {
            self.set_hidden_wireframe_color(this.get());
        }
    })).newline().append(this.gui.range({
        key: 'hidden_wireframe_opacity',
        label: 'culled wireframe opacity',
        callback: function () {
            self.set_hidden_wireframe_opacity(this.get());
        }
    })))

    this.on_settings_change(this.default_settings);
};

HexaLab.CullingPlaneView.prototype = Object.assign(Object.create(HexaLab.WebGLView.prototype), {

    // Default settings

    default_settings: {
        straight_surface_color: "#ffee9f",
        show_quality: false,
        straight_wireframe_color: "#000000",
        straight_wireframe_opacity: 1,
        hidden_surface_color: "#d2de0c",
        hidden_surface_opacity: 0.28,
        hidden_wireframe_color: "#000000",
        hidden_wireframe_opacity: 0.3,
        plane_normal: new THREE.Vector3(1, 0, 0),
        plane_offset: 0.39,
        plane_opacity: 0.3,
        plane_color: "#56bbbb",
        show_singularity: true
    },

    // Api

    serialize_settings: function () {
        return {
            straight_surface_color: '#' + this.models.straight.surface.material.color.getHexString(),
            show_quality: this.models.straight.surface.material.vertexColors == THREE.VertexColors,
            straight_wireframe_color: '#' + this.models.straight.wireframe.material.color.getHexString(),
            straight_wireframe_opacity: this.models.straight.wireframe.material.opacity,
            hidden_surface_color: '#' + this.models.hidden.surface.material.color.getHexString(),
            hidden_surface_opacity: this.models.hidden.surface.material.opacity,
            hidden_wireframe_color: '#' + this.models.hidden.wireframe.material.color.getHexString(),
            hidden_wireframe_opacity: this.models.hidden.wireframe.material.opacity,
            plane_normal: this.plane.normal,
            plane_offset: this.plane.offset,
            plane_opacity: this.plane.material.opacity,
            plane_color: '#' + this.plane.material.color.getHexString()
        };
    },

    on_settings_change: function (settings) {
        this.set_straight_surface_color(settings.straight_surface_color);
        this.surface_color = settings.straight_surface_color;
        this.show_quality(settings.show_quality);
        this.set_straight_wireframe_color(settings.straight_wireframe_color);
        this.set_straight_wireframe_opacity(settings.straight_wireframe_opacity);
        this.set_hidden_surface_color(settings.hidden_surface_color);
        this.set_hidden_surface_opacity(settings.hidden_surface_opacity);
        this.set_hidden_wireframe_color(settings.hidden_wireframe_color);
        this.set_hidden_wireframe_opacity(settings.hidden_wireframe_opacity);
        this.set_plane_normal(settings.plane_normal.x, settings.plane_normal.y, settings.plane_normal.z);
        this.set_plane_offset(settings.plane_offset);
        this.set_plane_opacity(settings.plane_opacity);
        this.set_plane_color(settings.plane_color);
    },

    on_mesh_change: function (mesh) {
        var plane_geometry = new THREE.PlaneGeometry(this.mesh.get_size(), this.mesh.get_size());
        this.plane.mesh = new THREE.Mesh(plane_geometry, this.plane.material);
        this.on_settings_change(this.default_settings);
    },

    on_update: function () {
        this.models.straight.update();
        this.models.hidden.update();
        this.models.singularity.update();

        if (this.plane.mesh) {
            var pos = this.mesh.get_center();
            this.plane.mesh.position.set(pos.x, pos.y, pos.z);
            var dir = new THREE.Vector3().addVectors(pos, this.plane.normal);
            this.plane.mesh.lookAt(dir);
            this.plane.mesh.translateZ(-this.plane.world_offset);
        }
    },

    // Setters

    show_quality: function (show) {
        if (show) {
            this.models.straight.surface.material.vertexColors = THREE.VertexColors;
            this.surface_color = '#' + this.models.straight.surface.material.color.getHexString();
            this.set_straight_surface_color('#ffffff');
            this.gui.map.straight_surface_color.hide();
        } else {
            this.models.straight.surface.material.vertexColors = THREE.NoColors;
            if (this.surface_color) this.set_straight_surface_color(this.surface_color);
            this.gui.map.straight_surface_color.show();
        }
        this.gui.map.show_quality.set(show);
        this.models.straight.surface.material.needsUpdate = true;
    },

    set_straight_surface_color: function (color) {
        this.models.straight.surface.material.color.set(color);
        this.gui.map.straight_surface_color.set(color);
    },

    set_straight_wireframe_color: function (color) {
        this.models.straight.wireframe.material.color.set(color);
        this.gui.map.straight_wireframe_color.set(color);
    },

    set_straight_wireframe_opacity: function (opacity) {
        this.models.straight.wireframe.material.opacity = opacity;
        this.gui.map.straight_wireframe_opacity.set(opacity);
    },

    set_hidden_surface_color: function (color) {
        this.models.hidden.surface.material.color.set(color);
        this.gui.map.hidden_surface_color.set(color);
    },

    set_hidden_surface_opacity: function (opacity) {
        this.models.hidden.surface.material.opacity = opacity;
        this.gui.map.hidden_surface_opacity.set(opacity);
    },

    set_hidden_wireframe_color: function (color) {
        this.models.hidden.wireframe.material.color.set(color);
        this.gui.map.hidden_wireframe_color.set(color);
    },

    set_hidden_wireframe_opacity: function (opacity) {
        this.models.hidden.wireframe.material.opacity = opacity;
        this.gui.map.hidden_wireframe_opacity.set(opacity);
    },

    set_plane_position: function (x, y, z) {
        this.view.set_plane_position(x, y, z);
        this.plane.position = new THREE.Vector3(x, y, z);
        this.plane.offset = this.view.get_plane_offset();
        this.plane.world_offset = this.view.get_plane_world_offset();

        this.gui.map.plane_offset.set(this.plane.offset);
        this.gui.map.plane_x.set(this.plane.position.x);
        this.gui.map.plane_y.set(this.plane.position.y);
        this.gui.map.plane_z.set(this.plane.position.z);
    },

    set_plane_normal: function (nx, ny, nz) {
        this.view.set_plane_normal(nx, ny, nz);
        var n = this.view.get_plane_normal();
        this.plane.normal = new THREE.Vector3(n.x(), n.y(), n.z());
        n.delete(); // TODO don't allocate at all, just read memory?

        this.gui.map.plane_nx.set(this.plane.normal.x);
        this.gui.map.plane_ny.set(this.plane.normal.y);
        this.gui.map.plane_nz.set(this.plane.normal.z);
    },

    set_plane_offset: function (offset) {
        this.view.set_plane_offset(offset);
        this.plane.offset = offset;
        this.plane.world_offset = this.view.get_plane_world_offset();
        var p = this.view.get_plane_position();
        this.plane.position = new THREE.Vector3(p.x(), p.y(), p.z());
        p.delete();

        this.gui.map.plane_offset.set(this.plane.offset);
        this.gui.map.plane_x.set(this.plane.position.x);
        this.gui.map.plane_y.set(this.plane.position.y);
        this.gui.map.plane_z.set(this.plane.position.z);
    },

    set_plane_opacity: function (opacity) {
        this.plane.material.opacity = opacity;
        this.gui.map.plane_opacity.set(opacity);
    },

    set_plane_color: function (color) {
        this.plane.material.color.set(color);
        this.gui.map.plane_color.set(color);
    }
});

//HexaLab.register_view(new HexaLab.CullingPlaneView())