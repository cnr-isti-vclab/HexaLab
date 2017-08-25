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
        self.filter.enabled = $(this).is(':checked')
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_depth_number.change(function () {
        self.set_peeling_depth(parseFloat($(this).val()))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_depth_slider.on('slide', function (e, ui) {
        self.set_peeling_depth(ui.values[0] / 100)
        self.sync()
        HexaLab.app.update()
    })
    
    // State
    this.default_settings = {
        depth: 0
    }
}

HexaLab.PeelingFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            depth: this.filter.peeling_depth,
        }
    },

    set_settings: function (settings) {
        this.set_peeling_depth(settings.depth)
    },

    sync: function () {
        HexaLab.UI.peeling_depth_slider.slider('option', 'value', this.filter.peeling_depth)
        HexaLab.UI.peeling_depth_number.val(this.filter.peeling_depth)
        HexaLab.UI.peeling_enabled.prop('checked', this.filter.enabled)
    },
    
    on_mesh_change: function (mesh) {
    },

    // State

    set_peeling_depth: function (depth) {
        this.filter.peeling_depth = depth
    },
});

HexaLab.filters.push(new HexaLab.PeelingFilter());