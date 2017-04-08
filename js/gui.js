"use strict";

var HexaLabGui = {}
HexaLabGui.reader = new FileReader();

HexaLabGui.reader.onload = function(event) {
    var data = new Int8Array(event.target.result);
    FS.createDataFile("/", HexaLabGui.file.name, data, true, true);

    log("Importing...\n");
    var result = HexaLab.import_mesh(HexaLabGui.file.name);
    if (result) {
        HexaLab.update_view();
        log("Mesh imported.\n");
    } else {
        log("Error!\n");
    }
}

HexaLabGui.update_plane = function () {
    var nx = parseFloat(document.getElementById("plane_nx").value);
    var ny = parseFloat(document.getElementById("plane_ny").value);
    var nz = parseFloat(document.getElementById("plane_nz").value);
    var s = parseFloat(document.getElementById("plane_d").value) / 100.0;

    HexaLab.set_culling_plane(nx, ny, nz, s);
}

HexaLabGui.pick_file = function () {
    document.getElementById('file_input').click();
}

document.getElementById("file_input").onchange = function(event) {
    HexaLabGui.file = event.target.files[0];
    HexaLabGui.reader.readAsArrayBuffer(HexaLabGui.file, "UTF-8");
};

HexaLabGui.open_nav = function () {
    document.getElementById("sidenav").style.width = "300px";
}

HexaLabGui.close_nav = function () {
    document.getElementById("sidenav").style.width = "0";
}

document.getElementById("plane_nx").onchange = function(event) {
    HexaLabGui.update_plane()
};
document.getElementById("plane_ny").onchange = function(event) {
    HexaLabGui.update_plane()
};
document.getElementById("plane_nz").onchange = function(event) {
    HexaLabGui.update_plane()
};
document.getElementById("plane_d").oninput = function(event) {
    HexaLabGui.update_plane()
};