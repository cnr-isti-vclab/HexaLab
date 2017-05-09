"use strict";

HexaLab.LowQualityView = function () {
    
    // View

    HexaLab.View.call(this, new Module.LowQualityView());

    // Models
    
    this.models = {
        visible: new HexaLab.Model(
            this.view.get_visible_model(),
            new THREE.MeshLambertMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5
            }),
            new THREE.MeshBasicMaterial({
                transparent: true,
            })
        ),
        hidden: new HexaLab.Model(
            this.view.get_hidden_model(),
            new THREE.MeshBasicMaterial({
                polygonOffset: true,
                polygonOffsetFactor: 0.5,
                transparent: true
            }),
            new THREE.MeshBasicMaterial({
                transparent: true
            })
        )
    }

    // Gui

    var self = this;
    this.make_gui_root(this.make_div({
        title: 'View controls'
    }).append(this.make_numeric({
        key: 'threshold',
        label: 'quality threshold',
        callback: function () {
            self.set_quality_threshold(this.get());
            self.update();
        }
    })).newline().append(this.make_checkbox({
        key: 'show_quality',
        label: 'show quality',
        callback: function () {
            self.show_quality(this.get());
        }
    })).newline().append(this.make_color_picker({
        key: 'visible_surface_color',
        label: 'surface color',
        callback: function () {
            self.set_visible_surface_color(this.get());
        }
    })).newline().append(this.make_color_picker({
        key: 'visible_wireframe_color',
        label: 'wireframe_color',
        callback: function () {
            self.set_visible_wireframe_color(this.get());
        }
    })).newline().append(this.make_range({
        key: 'visible_wireframe_opacity',
        label: 'wireframe opacity',
        callback: function () {
            self.set_visible_wireframe_opacity(this.get());
        }
    })).newline().append(this.make_color_picker({
        key: 'hidden_surface_color',
        label: 'culled surface color',
        callback: function () {
            self.set_hidden_surface_color(this.get());
        }
    })).newline().append(this.make_range({
        key: 'hidden_surface_opacity',
        label: 'hidden surface opacity',
        callback: function () {
            self.set_hidden_surface_opacity(this.get());
        }
    })).newline().append(this.make_color_picker({
        key: 'hidden_wireframe_color',
        label: 'hidden wireframe color',
        callback: function () {
            self.set_hidden_wireframe_color(this.get());
        }
    })).newline().append(this.make_range({
        key: 'hidden_wireframe_opacity',
        label: 'hidden wireframe opacity',
        callback: function () {
            self.set_hidden_wireframe_opacity(this.get());
        }
    }))
    )

    this.on_settings_change(this.default_settings); // TODO automate ?
}

HexaLab.LowQualityView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {

    default_settings: {
        threshold: 0,
        show_quality: true,
        visible_surface_color: '#ff0000',
        visible_wireframe_color: '#000000',
        visible_wireframe_opacity: 0.5,
        hidden_surface_color: '#000000',
        hidden_surface_opacity: 0.5,
        hidden_wireframe_color: '#000000',
        hidden_wireframe_opacity: '#000000',
    },

    // interface

    serialize_settings: function () {
        return {
            threshold: view.quality_threshold,
            show_quality: models.visible.surface.material.vertexColors == THREE.VertexColors,
            visible_surface_color: '#' + models.visible.surface.material.color.getHexString(),
            visible_wireframe_color: '#' + models.visible.wireframe.material.color.getHexString(),
            visible_wireframe_opacity: models.visible.wireframe.material.opacity,
            hidden_surface_color: '#' + models.hidden.surface.material.color.getHexString(),
            hidden_surface_opacity: models.hidden.surface.material.opacity,
            hidden_wireframe_color: '#' + models.hidden.material.opacity,
            hidden_wireframe_opacity: models.hidden.material.opacity
        }
    },

    on_settings_change: function (settings) {
        this.set_quality_threshold(settings.threshold);
        this.set_visible_surface_color(settings.visible_surface_color);
        this.set_visible_wireframe_color(settings.visible_wireframe_color);
        this.set_visible_wireframe_opacity(settings.visible_wireframe_opacity);
        this.set_hidden_surface_color(settings.hidden_surface_color);
        this.set_hidden_surface_opacity(settings.hidden_surface_opacity);
        this.set_hidden_wireframe_color(settings.hidden_wireframe_color);
        this.set_hidden_wireframe_opacity(settings.hidden_wireframe_opacity);
        this.show_quality(settings.show_quality);
    },

    on_update: function () {
        this.update_model(this.models.visible);
        this.update_model(this.models.hidden);
    },

    on_mesh_change: function () {

    },

    on_resize: function () {

    },

    // settings

    set_quality_threshold: function (threshold) {
        this.view.quality_threshold = threshold;
        this.gui.threshold.set(threshold);
    },

    show_quality: function (show) {
        if (show) {
            this.models.visible.surface.material.vertexColors = THREE.VertexColors;
            this.surface_color = '#' + this.models.visible.surface.material.color.getHexString();
            this.set_visible_surface_color('#ffffff');
            this.gui.visible_surface_color.hide();
        } else {
            this.models.visible.surface.material.vertexColors = THREE.NoColors;
            if (this.surface_color) this.set_visible_surface_color(this.surface_color);
            this.gui.visible_surface_color.show();
        }
        this.gui.show_quality.set(show);
        this.models.visible.surface.material.needsUpdate = true;
    },

    set_visible_surface_color: function (color) {
        this.models.visible.surface.material.color.set(color);
        this.gui.visible_surface_color.set(color);
    },

    set_visible_wireframe_color: function (color) {
        this.models.visible.wireframe.material.color.set(color);
        this.gui.visible_wireframe_color.set(color);
    },

    set_visible_wireframe_opacity: function (opacity) {
        this.models.visible.wireframe.material.opacity = opacity;
        this.gui.visible_wireframe_opacity.set(opacity);
    },

    set_hidden_surface_color: function (color) {
        this.models.hidden.surface.material.color.set(color);
        this.gui.hidden_surface_color.set(color);
    },

    set_hidden_surface_opacity: function (opacity) {
        this.models.hidden.surface.material.opacity = opacity;
        this.gui.hidden_surface_opacity.set(opacity);
    },

    set_hidden_wireframe_color: function (color) {
        this.models.hidden.wireframe.material.color.set(color);
        this.gui.hidden_wireframe_color.set(color);
    },

    set_hidden_wireframe_opacity: function (opacity) {
        this.models.hidden.wireframe.material.opacity = opacity;
        this.gui.hidden_wireframe_opacity.set(opacity);
    },
});
