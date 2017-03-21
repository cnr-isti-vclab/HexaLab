"use strict";

var g_stdout = document.getElementById("text_output");

document.getElementById("file_input").onchange = function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        var data = new Int8Array(event.target.result);
        FS.createDataFile("/", file.name, data, true, true);

        log("Processing...\n");
        var HLmesh = new Module.Mesh();
        var result = HLmesh.load(file.name);
        if (result == Module.Result.Success) {
            log("Adding to scene...\n");
            renderer_set_mesh(HLmesh);
            log("Done!\n");
        } else {
            log("Error!\n");
        }
    }
    log("Loading " + file.name + '...\n');
    reader.readAsArrayBuffer(file, "UTF-8");
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

function log(string) {
    g_stdout.value += string;
    g_stdout.scrollTop = g_stdout.scrollHeight;
}

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
        var s = parseFloat(document.getElementById("plane_d").value) / 100.0;

        renderer_update_plane(nx, ny, nz, s);
        renderer_update_mesh();
    }
}