"use strict";

HexaLab.StatsView = function (mesh) {
    HexaLab.HTMLView.call(this, new Module.StatsView(mesh), 'Stats');

    this.content.new_frame({
        key: 'quality',
        title: 'Jacobian Quality',
        style: 'text-align:center;'
    }).append(this.content.group({
        key: 'quality_plot',
        style: "width: 100%; text-align:center;"
    }).append(this.content.text({
        text: 'Select a mesh first.'
    })))
}

HexaLab.StatsView.prototype = Object.assign(Object.create(HexaLab.HTMLView.prototype), {
    // interface
    on_update: function () {
    },

    on_settings_change: function () {
    },

    on_mesh_change: function () {
        var x = [];

        while (this.content.map.quality_plot.firstChild) {
            this.content.map.quality_plot.removeChild(this.content.map.quality_plot.firstChild);
        }
        var quality = this.view.get_hexa_quality();
        var data = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size());
        for (var i = 0; i < quality.size(); i++) {
            x[i] = data[i];
        }
        var plot_data = [
          {
              x: x,
              type: 'histogram',
              marker: {
                  color: 'rgba(0,0,0,0.7)',
              },
          }
        ];
        Plotly.newPlot(this.content.map.quality_plot, plot_data);
    },

    on_resize: function () {
        Plotly.Plots.resize(this.content.map.quality_plot);
    },

    serialize_settings: function () {
    },
})