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
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_depth_number.change(function () {
        var value = parseFloat($(this).val())
        var max = HexaLab.UI.peeling_depth_slider.slider('option', 'max')
        var min = HexaLab.UI.peeling_depth_slider.slider('option', 'min')
        if (value >  max) value = max
        if (value <  min) value = min
        self.set_peeling_depth(value)
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_depth_slider.on('slide', function (e, ui) {
        self.set_peeling_depth(ui.value)
        self.sync()
        HexaLab.app.update()
    })

    // State
    this.default_settings = {
        enabled: false,
        depth: 0
    }
}

HexaLab.PeelingFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
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

    sync: function () {
        HexaLab.UI.peeling_depth_slider.slider('value', this.backend.peeling_depth)
        HexaLab.UI.peeling_depth_number.val(this.backend.peeling_depth)
        HexaLab.UI.peeling_enabled.prop('checked', this.backend.enabled)
    },

    on_mesh_change: function (mesh) {
        HexaLab.UI.peeling_depth_slider.slider('option', 'max', this.backend.max_depth)
        this.sync()
    },

    // State

    enable: function (enabled) {
        this.backend.enabled = enabled
    },

    set_peeling_depth: function (depth) {
        this.backend.peeling_depth = depth
    },
});

HexaLab.filters.push(new HexaLab.PeelingFilter());
