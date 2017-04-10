"use strict";

var HexaLabGui = {}
HexaLabGui.mesh_reader = new FileReader();
HexaLabGui.settings_reader = new FileReader();

HexaLabGui.file_exists = function(path) {
    var stat = FS.stat(path);
    if (!stat) return false;
    return FS.isFile(stat.mode);
}

HexaLabGui.make_file = function (data, name) {
    try {
        if (HexaLabGui.file_exists("/" + name)) {
            FS.unlink('/' + name);
        }
    } catch (err) {
    }
    FS.createDataFile("/", name, data, true, true);
}

HexaLabGui.mesh_reader.onload = function (event) {
    var data = new Int8Array(event.target.result);
    var name = HexaLabGui.mesh_file.name;
    HexaLabGui.make_file(data, name);

    log("Importing...\n");
    var result = HexaLab.import_mesh(name);
    if (result) {
        HexaLabGui.update_plane();
        HexaLab.update_scene();
        log("Mesh imported.\n");
    } else {
        log("Error!\n");
    }
}

HexaLabGui.settings_reader.onload = function (event) {
    var data = event.target.result;
    var settings = JSON.parse(data);
    HexaLab.load_settings(settings);
}

HexaLabGui.update_plane = function () {
    var nx = parseFloat(document.getElementById("plane_nx").value);
    var ny = parseFloat(document.getElementById("plane_ny").value);
    var nz = parseFloat(document.getElementById("plane_nz").value);
    var s = parseFloat(document.getElementById("plane_d").value) / 100.0;

    HexaLab.set_culling_plane(nx, ny, nz, s);
}

HexaLabGui.pick_file = function () {
    document.getElementById('file_input').value = "";
    document.getElementById('file_input').click();
}

HexaLabGui.load_settings = function () {
    document.getElementById('settings_input').value = "";
    document.getElementById('settings_input').click();
}

HexaLabGui.save_settings = function () {
    var settings = JSON.stringify(HexaLab.get_settings(), null, 4);
    var filename = "HexaLab_settings";
    var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename + ".txt");
}

document.getElementById("file_input").onchange = function(event) {
    HexaLabGui.mesh_file = event.target.files[0];
    HexaLabGui.mesh_reader.readAsArrayBuffer(HexaLabGui.mesh_file, "UTF-8");
};

document.getElementById("settings_input").onchange = function (event) {
    HexaLabGui.settings_file = event.target.files[0];
    HexaLabGui.settings_reader.readAsText(HexaLabGui.settings_file, "UTF-8");
};

HexaLabGui.open_nav = function () {
    document.getElementById("sidenav").style.width = "300px";
}

HexaLabGui.close_nav = function () {
    document.getElementById("sidenav").style.width = "0";
}

document.getElementById("plane_nx").onchange = function(event) {
    HexaLabGui.update_plane()
    HexaLab.update_scene();
};
document.getElementById("plane_ny").onchange = function(event) {
    HexaLabGui.update_plane()
    HexaLab.update_scene();
};
document.getElementById("plane_nz").onchange = function(event) {
    HexaLabGui.update_plane()
    HexaLab.update_scene();
};
document.getElementById("plane_d").oninput = function(event) {
    HexaLabGui.update_plane()
    HexaLab.update_scene();
};