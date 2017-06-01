"use strict";

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.quality_enabled = $('#quality_enabled')
HexaLab.UI.quality_range_slider = $('#quality_range_slider').slider({
    range:true,
    values: [0, 80]
})
HexaLab.UI.quality_min_number = $('#quality_min_number')
HexaLab.UI.quality_max_number = $('#quality_max_number')

// --------------------------------------------------------------------------------
// Logic
// --------------------------------------------------------------------------------

HexaLab.QualityFilter = function () {
    
    // Ctor
    HexaLab.Filter.call(this, new Module.QualityFilter(), 'Quality')

    // Listener
    var self = this;
    HexaLab.UI.quality_min_number.change(function () {
        self.set_quality_threshold(parseFloat($(this).val()))
        HexaLab.app.update()
    })

    // State
    this.default_settings = {
        threshold: 0.8,
        //min: 0
        //max: 0.8
    }
}

HexaLab.QualityFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            threshold: this.filter.quality_threshold,
            //min: this.filter.quality_min,
            //max: this.filter.quality_max,
        }
    },

    set_settings: function (settings) {
        this.set_quality_threshold(settings.threshold)
        //this.set_quality_min(settings.min)
        //this.set_quality_max(settings.max)
    },

    sync: function () {
        //HexaLab.UI.quality_range_slider.slider('values, this.filter.quality_min, this.filter.quality_max')
        //HexaLab.UI.quality_min_number.value = this.filter.quality_min.toFixed(3)
        //HexaLab.UI.quality_max_number.value = this.filter.quality_max.toFixed(3)
    },

    // State
    set_quality_threshold: function (threshold) {
        this.filter.quality_threshold = threshold
        //HexaLab.UI.quality_threshold.val(threshold);
    },
});

HexaLab.filters.push(new HexaLab.QualityFilter());