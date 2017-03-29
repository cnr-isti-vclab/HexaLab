"use strict";

var g_reader = new FileReader();
var g_file;

g_reader.onload = function(event) {
    var data = new Int8Array(event.target.result);
    FS.createDataFile("/", g_file.name, data, true, true);

    var result = Module.Importer.import(g_file.name, g_visualizer);
    if (result == Module.Result.Success) {
        log("Adding to scene...\n");
        g_visualizer.update_vbuffer();
        g_visualizer.update_ibuffer();
        renderer_update_vbuffer();
        renderer_update_ibuffer();
        renderer_update_mesh();
        log("Done!\n");
    } else {
        log("Error!\n");
    }
}

// Load from file
document.getElementById("file_input").onchange = function(event) {
    g_file = event.target.files[0];
    g_reader.readAsArrayBuffer(g_file, "UTF-8");
};

document.getElementById("plane_nx").onchange = function(event) {
    update_plane()
};
document.getElementById("plane_ny").onchange = function(event) {
    update_plane()
};
document.getElementById("plane_nz").onchange = function(event) {
    update_plane()
};
document.getElementById("plane_d").oninput = function(event) {
    update_plane()
};

function open_nav() {
    document.getElementById("sidenav").style.width = "300px";
    console.log("open");
}

function close_nav() {
    document.getElementById("sidenav").style.width = "0";
    console.log("close");
}

function pick_file() {
    document.getElementById('file_input').click();
}

function update_plane() {
    if (g_mesh) {
        var nx = parseFloat(document.getElementById("plane_nx").value);
        var ny = parseFloat(document.getElementById("plane_ny").value);
        var nz = parseFloat(document.getElementById("plane_nz").value);
        var s  = parseFloat(document.getElementById("plane_d").value) / 100.0;

        g_visualizer.set_culling_plane(nx, ny, nz, s);
        g_visualizer.update_ibuffer();
        renderer_update_ibuffer();
        renderer_update_mesh();
    }
}