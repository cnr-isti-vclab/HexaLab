"use strict";

HexaLab.gui = {
    mesh_reader: new FileReader(),
    settings_reader: new FileReader(),
    mesh_input: document.getElementById('file_input'),
    load_mesh_button: document.getElementById('mesh_pick_button'),
    settings_input: document.getElementById('settings_input'),
    load_settings_button: document.getElementById('settings_pick_button'),
    store_settings_button: document.getElementById('settings_store_button'),
    snapshot_button: document.getElementById('snapshot'),
    sidenav: document.getElementById('sidenav'),
    sidenav_opener: document.getElementById('nav_opener'),
    sidenav_closer: document.getElementById('nav_closer'),
    frame: HexaLab.context.canvas.container
}
/*
// File utility

HexaLab.gui.file_exists = function(path) {
    var stat = FS.stat(path);
    if (!stat) return false;
    return FS.isFile(stat.mode);
}

HexaLab.gui.make_file = function (data, name) {
    try {
        if (HexaLab.gui.file_exists("/" + name)) {
            FS.unlink('/' + name);
        }
    } catch (err) {
    }
    FS.createDataFile("/", name, data, true, true);
}
*/
// Menu

HexaLab.gui.sidenav_opener.addEventListener('click', function () {
    HexaLab.gui.sidenav.style.width = "20%";
    HexaLab.gui.frame.style.width = "80%";
    HexaLab.gui.frame.style.marginLeft = "20%";
    HexaLab.context.on_resize();
})

HexaLab.gui.sidenav_closer.addEventListener('click', function () {
    HexaLab.gui.sidenav.style.width = "0";
    HexaLab.gui.frame.style.width = "100%";
    HexaLab.gui.frame.style.marginLeft = "0";
    HexaLab.context.on_resize();
})

/*
// Mesh

HexaLab.gui.load_mesh_button.addEventListener('click', function (event) {
    HexaLab.gui.mesh_input.value = "";
    HexaLab.gui.mesh_input.click();
});

HexaLab.gui.mesh_input.addEventListener('change', function () {
    HexaLab.gui.mesh_reader.readAsArrayBuffer(this.files[0], "UTF-8");
});


HexaLab.gui.mesh_reader.onload = function () {
    var data = new Int8Array(this.result);
    HexaLab.gui.make_file(data, this.fileName);

    log("Importing...");
    var result = HexaLab.context.import_mesh(this.fileName);
    if (result) {
        //HexaLabGui.update_plot();
        HexaLab.context.update();
        log("Mesh imported.");
    } else {
        log("Error!");
    }
}

// Settings

HexaLab.gui.store_settings_button.addEventListener('click', function () {
    var settings = JSON.stringify(HexaLab.context.get_settings(), null, 4);
    var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "HLsettings.txt");
});

HexaLab.gui.load_settings_button.addEventListener('click', function () {
    HexaLab.gui.settings_input.value = "";
    HexaLab.gui.settings_input.click();
});

HexaLab.gui.settings_input.addEventListener('change', function () {
    HexaLab.gui.settings_reader.readAsText(this.files[0], "UTF-8");
});

HexaLab.gui.settings_reader.addEventListener('load', function () {
    var settings = JSON.parse(this.result);
    HexaLab.context.load_settings(settings);
    HexaLab.context.update();
});

// Snapshot

HexaLab.gui.snapshot_button.addEventListener('click', function (event) {
    var canvas = HexaLab.gui.frame.getElementsByTagName('canvas')[0];
    canvas.toBlob(function (blob) {
        saveAs(blob, "HexaLab_snapshot.png");
    }, "image/png");
});
*/
// Plot TODO move into a separate view

/*
HexaLab.GUI.update_plot = function() {
    var x = [];
    var quality = HexaLab.Context.get_hexa_quality();
    for (var i = 0; i < quality.count; i++) {
        x[i] = quality.data[i];
    }
    var data = [
      {
          x: x,
          type: 'histogram',
          marker: {
              color: 'rgba(0,0,0,0.7)',
          },
      }
    ];
    Plotly.newPlot('plot_div', data);
},
*/