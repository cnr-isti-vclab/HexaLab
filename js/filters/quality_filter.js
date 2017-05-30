"use strict";

HexaLab.QualityFilter = function () {
    
    // View
    HexaLab.Filter.call(this, new Module.QualityFilter(), 'Quality filter');

    this.default_settings = {
        threshold: 0.8,
    }

    // UI
    var self = this;
    HexaLab.UI.quality_threshold.change(function () {
        self.set_quality_threshold(parseFloat($(this).val()));
        HexaLab.UI.app.update();
    })
}

HexaLab.QualityFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    get_settings: function () {
        return {
            threshold: this.filter.quality_threshold,
        }
    },

    set_settings: function (settings) {
        this.set_quality_threshold(settings.threshold);
    },

    set_quality_threshold: function (threshold) {
        this.filter.quality_threshold = threshold;
        HexaLab.UI.quality_threshold.val(threshold);
    },
});

HexaLab.filters.push(new HexaLab.QualityFilter());