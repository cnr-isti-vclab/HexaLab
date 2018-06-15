"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.quality_enabled      = $('#quality_enabled')
HexaLab.UI.quality_range_slider = $('#quality_range_slider').slider()
// HexaLab.UI.quality_min_number   = $('#quality_min_number')
HexaLab.UI.quality_max_number   = $('#quality_max_number')
// HexaLab.UI.quality_swap_range   = $('#quality_swap_range')
HexaLab.UI.quality_menu_content   = $('#quality_menu *')

HexaLab.UI.quality_menu_content.prop('disabled', true)
HexaLab.UI.quality_range_slider.slider('disable')

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------

HexaLab.QualityFilter = function () {

    // Ctor
    HexaLab.Filter.call(this, new Module.QualityFilter(), 'Quality')

    // Listener
    var self = this;
    HexaLab.UI.quality_enabled.on('click', function() {
        self.enable($(this).is(':checked'))
    })
    // HexaLab.UI.quality_min_number.change(function () {
    //     self.set_quality_threshold_min(parseFloat($(this).val()))
    // })
    HexaLab.UI.quality_max_number.change(function () {
        const mesh = HexaLab.app.backend.get_mesh()
        if (!mesh) return
        const q = parseFloat($(this).val())
        const t = (q - mesh.quality_min) / (mesh.quality_max - mesh.quality_min)
        self.set_quality_threshold_max(t)
        //nsole.log("mesh.quality_max: "+ mesh.quality_max+" mesh.quality_min: "+mesh.quality_min )
        //nsole.log("quality change " + q + " t " + t)
    })
    HexaLab.UI.quality_range_slider.on('slide', function (e, ui) {
        self.set_quality_threshold_min(0)
        self.set_quality_threshold_max(1 - (ui.value / 100))
        //nsole.log("ui.value " + ui.value)
    })
    // HexaLab.UI.quality_swap_range.on('click', function () {
    //     if (self.op == 'inside') {
    //         self.set_operator('outside')
    //     } else if (self.op == 'outside') {
    //         self.set_operator('inside')
    //     }
    // })

    // State
    this.default_settings = {
        enabled: false,
        min: 0,
        max: 1,
        op: 'inside'
    }

    HexaLab.UI.mesh.quality_type.listeners.push(function () {
        self.on_quality_threshold_max_set((100 - HexaLab.UI.quality_range_slider.slider('value')) / 100)
    })
}

HexaLab.QualityFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            enabled: this.backend.enabled,
            min: this.backend.quality_threshold_min,
            max: this.backend.quality_threshold_max,
            op: this.op
        }
    },

    set_settings: function (settings) {
        this.set_quality_threshold_min(settings.min)
        this.set_quality_threshold_max(settings.max)
        this.set_operator(settings.op)
        this.enable(settings.enabled)
    },

    on_mesh_change: function (mesh) {
        this.on_enabled_set(this.backend.enabled)
        this.on_quality_threshold_min_set(this.backend.quality_threshold_min)
        this.on_quality_threshold_max_set(this.backend.quality_threshold_max)
        this.on_operator_set(this.backend.operator)

        HexaLab.UI.quality_menu_content.prop('disabled', false)
        HexaLab.UI.quality_range_slider.slider('enable')
    },

    // system -> UI

    on_enabled_set: function (bool) {
        HexaLab.UI.quality_enabled.prop('checked', bool)
    },

    on_quality_threshold_min_set: function (min) {
        // HexaLab.UI.quality_min_number.val(min.toFixed(3))
        // HexaLab.UI.quality_range_slider.slider('option', 'values', [min * 100, this.backend.quality_threshold_max * 100])
    },
    // t is the normalized threshold always in the 0.1 range. 
    on_quality_threshold_max_set: function (normalized_thr) {
        const mesh = HexaLab.app.backend.get_mesh()
        // const t = (q - mesh.quality_min) / (mesh.quality_max - mesh.quality_min)
        //const q = mesh.quality_min * (1 - t) + mesh.quality_max * t        

        const denormalized_quality = HexaLab.app.backend.denormalize_quality(normalized_thr)
              //denormalize_quality_measure ( measureId, normalized_thr, curStats.quality_min, curStats.quality_max );
    
        HexaLab.UI.quality_max_number.val(denormalized_quality.toFixed(3))
        // HexaLab.UI.quality_range_slider.slider('option', 'values', [this.backend.quality_threshold_min * 100, max * 100])
        HexaLab.UI.quality_range_slider.slider('value', (1 - normalized_thr) * 100)
    },

    on_operator_set: function (op) {
        if (op == 'inside') {
            this.backend.operator = Module.QualityFilterOperator.Inside
            HexaLab.UI.quality_range_slider.css('background', '#ffffff')
            HexaLab.UI.quality_range_slider.find('div').css('background', '#e9e9e9')
        } else if (op == 'outside') {
            HexaLab.UI.quality_range_slider.css('background', '#e9e9e9')
            HexaLab.UI.quality_range_slider.find('div').css('background', '#ffffff')
            this.backend.operator = Module.QualityFilterOperator.Outside
        }
    },

    // State

    enable: function (enabled) {
        this.backend.enabled = enabled
        this.on_enabled_set(enabled)
        HexaLab.app.queue_buffers_update()
    },

    set_quality_threshold_min: function (threshold) {
        this.backend.quality_threshold_min = threshold
        this.on_quality_threshold_min_set(threshold)
        HexaLab.app.queue_buffers_update()
        //nsole.log("set_quality_threshold_min " + threshold)
    },

    set_quality_threshold_max: function (threshold) {
        this.backend.quality_threshold_max = threshold
        this.on_quality_threshold_max_set(threshold)
        HexaLab.app.queue_buffers_update()
        //nsole.log("set_quality_threshold_max " + threshold)
    },

    set_operator: function (op) {
        this.op = op
        this.on_operator_set(op)
        HexaLab.app.queue_buffers_update()
    },
});

HexaLab.filters.push(new HexaLab.QualityFilter());
