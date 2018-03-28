"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.quality_enabled = $('#quality_enabled')
HexaLab.UI.quality_range_slider = $('#quality_range_slider').slider({
    range:true
})
HexaLab.UI.quality_min_number = $('#quality_min_number')
HexaLab.UI.quality_max_number = $('#quality_max_number')
HexaLab.UI.quality_swap_range = $('#quality_swap_range')

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------

HexaLab.QualityFilter = function () {

    // Ctor
    HexaLab.Filter.call(this, new Module.QualityFilter(), 'Quality')

    // Listener
    var self = this;
    HexaLab.UI.quality_enabled.on('click', function() {
        self.filter.enabled = $(this).is(':checked')
        HexaLab.app.update()
    })
    HexaLab.UI.quality_min_number.change(function () {
        self.set_quality_threshold_min(parseFloat($(this).val()))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.quality_max_number.change(function () {
        self.set_quality_threshold_max(parseFloat($(this).val()))
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.quality_range_slider.on('slide', function (e, ui) {
        self.set_quality_threshold_min(ui.values[0] / 100)
        self.set_quality_threshold_max(ui.values[1] / 100)
        self.sync()
        HexaLab.app.update()
    })
    HexaLab.UI.quality_swap_range.on('click', function () {
        if (self.op == 'inside') {
            self.set_operator('outside')
        } else if (self.op == 'outside') {
            self.set_operator('inside')
        }
    })

    // State
    this.default_settings = {
        min: 0,
        max: 0.8,
        op: 'inside'
    }
}

HexaLab.QualityFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            min: this.backend.quality_threshold_min,
            max: this.backend.quality_threshold_max,
            op: this.op
        }
    },

    set_settings: function (settings) {
        this.set_quality_threshold_min(settings.min)
        this.set_quality_threshold_max(settings.max)
        this.set_operator(settings.op)
    },

    sync: function () {
        HexaLab.UI.quality_range_slider.slider('option', 'values', [this.backend.quality_threshold_min * 100, this.backend.quality_threshold_max * 100])
        HexaLab.UI.quality_min_number.val(this.backend.quality_threshold_min.toFixed(3))
        HexaLab.UI.quality_max_number.val(this.backend.quality_threshold_max.toFixed(3))
        HexaLab.UI.quality_enabled.prop('checked', this.backend.enabled)
    },

    on_mesh_change: function (mesh) {
    },

    // State

    set_quality_threshold_min: function (threshold) {
        this.backend.quality_threshold_min = threshold
    },

    set_quality_threshold_max: function (threshold) {
        this.backend.quality_threshold_max = threshold
    },

    set_operator: function (op) {
        this.op = op
        if (op == 'inside') {
            this.backend.operator = Module.QualityFilterOperator.Inside
            HexaLab.UI.quality_range_slider.css('background', '#ffffff')
            HexaLab.UI.quality_range_slider.find('div').css('background', '#e9e9e9')
        } else if (op == 'outside') {
            HexaLab.UI.quality_range_slider.css('background', '#e9e9e9')
            HexaLab.UI.quality_range_slider.find('div').css('background', '#ffffff')
            this.backend.operator = Module.QualityFilterOperator.Outside
        }
        HexaLab.app.update()
    },
});

HexaLab.filters.push(new HexaLab.QualityFilter());
