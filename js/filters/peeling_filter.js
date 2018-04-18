"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.peeling_enabled = $('#peeling_enabled')
HexaLab.UI.peeling_depth_number = $('#peeling_depth_number')
HexaLab.UI.peeling_depth_slider = $('#peeling_depth_slider').slider({
    value: 0,
    min: 0,
    max: 10,
    step: 1
})

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------

HexaLab.PeelingFilter = function () {

    // Ctor
    HexaLab.Filter.call(this, new Module.PeelingFilter(), 'Peeling')

    // Listener
    var self = this;
    HexaLab.UI.peeling_enabled.on('click', function() {
        self.enable($(this).is(':checked'))
        HexaLab.app.queue_geometry_update()
    })
    HexaLab.UI.peeling_depth_number.change(function () {
        var value = parseFloat($(this).val())
        var max = HexaLab.UI.peeling_depth_slider.slider('option', 'max')
        var min = HexaLab.UI.peeling_depth_slider.slider('option', 'min')
        if (value >  max) value = max
        if (value <  min) value = min
        self.set_peeling_depth(value)
        HexaLab.app.queue_geometry_update()
    })
    HexaLab.UI.peeling_depth_slider.on('slide', function (e, ui) {
        self.set_peeling_depth(ui.value)
        HexaLab.app.queue_geometry_update()
    })

    // State
    this.default_settings = {
        enabled: true,
        depth: 0
    }
}

HexaLab.PeelingFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // base class filter interface
    get_settings: function () {
        return {
            enabled: this.backend.enabled,
            depth: this.backend.peeling_depth,
        }
    },

    set_settings: function (settings) {
        this.set_peeling_depth(settings.depth)
        this.enable(settings.enabled)
    },

    on_mesh_change: function (mesh_stats) {
        this.on_peeling_depth_set(this.backend.peeling_depth)
        this.on_max_depth_set(this.backend.max_depth)
        this.on_enabled_set(this.backend.enabled)
    },

    // callback events: system -> UI

    on_peeling_depth_set: function (value) {
        HexaLab.UI.peeling_depth_slider.slider('value', value)
        HexaLab.UI.peeling_depth_number.val(value)
    },

    on_enabled_set: function (bool) {
        HexaLab.UI.peeling_enabled.prop('checked', bool)
    },

    on_max_depth_set: function (max) {
        HexaLab.UI.peeling_depth_slider.slider('option', 'max', max)
    },

    // system state changers

    enable: function (enabled) {
        this.backend.enabled = enabled
        HexaLab.app.queue_geometry_update()
        this.on_enabled_set(enabled)
    },

    set_peeling_depth: function (depth) {
        this.backend.peeling_depth = depth
        HexaLab.app.queue_geometry_update()
        this.on_peeling_depth_set(depth)
    },
});

HexaLab.filters.push(new HexaLab.PeelingFilter());
