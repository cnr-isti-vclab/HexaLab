"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.peeling_enabled = $('#peeling_enabled')
HexaLab.UI.peeling_range_slider = $('#peeling_range_slider').slider({
    range:true
})
HexaLab.UI.peeling_min_number = $('#peeling_min_number')
HexaLab.UI.peeling_max_number = $('#peeling_max_number')

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
    HexaLab.UI.peeling_min_number.change(function () {
        self.set_peeling_threshold_min(parseFloat($(this).val()))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_max_number.change(function () {
        self.set_peeling_threshold_max(parseFloat($(this).val()))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.peeling_range_slider.on('slide', function (e, ui) {
        self.set_peeling_threshold_min(ui.values[0] / 100)
        self.set_peeling_threshold_max(ui.values[1] / 100)
        self.sync()
        HexaLab.app.update()
    })
    

    // State
    this.default_settings = {
        min: 0,
        max: 0.8,        
    }
}

HexaLab.QualityFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            min: this.filter.peeling_threshold_min,
            max: this.filter.peeling_threshold_max,            
        }
    },

    set_settings: function (settings) {
        this.set_peeling_threshold_min(settings.min)
        this.set_peeling_threshold_max(settings.max)
    },

    sync: function () {
        HexaLab.UI.peeling_range_slider.slider('option', 'values', [this.filter.peeling_threshold_min * 100, this.filter.peeling_threshold_max * 100])
        HexaLab.UI.peeling_min_number.val(this.filter.peeling_threshold_min.toFixed(3))
        HexaLab.UI.peeling_max_number.val(this.filter.peeling_threshold_max.toFixed(3))
        HexaLab.UI.peeling_enabled.prop('checked', this.filter.enabled)
    },
    
    on_mesh_change: function (mesh) {
    },

    // State

    set_peeling_threshold_min: function (threshold) {
        this.filter.peeling_threshold_min = threshold
    },

    set_peeling_threshold_max: function (threshold) {
        this.filter.peeling_threshold_max = threshold
    },    
});

HexaLab.filters.push(new HexaLab.PeelingFilter());