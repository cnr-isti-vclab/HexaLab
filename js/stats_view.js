"use strict";

HexaLab.StatsView = function () {

    HexaLab.View.call(this, new Module.StatsView());

    this.webGL = false;
    this.html = document.createElement('div');
}

HexaLab.StatsView.prototype = Object.assign(Object.create(HexaLab.View.prototype), {
    // interface
    on_update: function () {
    },

    on_settings_change: function () {
    },

    on_mesh_change: function () {
        var x = [];
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
        Plotly.newPlot(this.html, plot_data);
    },

    on_resize: function () {
    },

    serialize_settings: function () {
    },
})