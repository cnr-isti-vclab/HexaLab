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
        HexaLabGui.submit_plane_normal();
        HexaLabGui.submit_plane_offset_range();
        HexaLabGui.sync_all();

        HexaLab.update_scene();
        log("Mesh imported.\n");
    } else {
        log("Error!\n");
    }
}

HexaLabGui.sync_all = function () {
    var state = HexaLab.get_state();

    document.getElementById("plane_x").value = state.plane.position.x;
    document.getElementById("plane_y").value = state.plane.position.y;
    document.getElementById("plane_z").value = state.plane.position.z;

    document.getElementById("plane_nx").value = state.plane.normal.x;
    document.getElementById("plane_ny").value = state.plane.normal.y;
    document.getElementById("plane_nz").value = state.plane.normal.z;

    document.getElementById("plane_offset_range").value = state.plane.offset * 100;
    document.getElementById("plane_offset_number").value = state.plane.offset;

    document.getElementById("show_plane").checked = state.plane.material.visible;
    document.getElementById("show_wireframe").checked = state.object.visible_wireframe.material.visible;
    document.getElementById("show_culled_mesh").checked = state.object.culled_surface.material.visible;
    document.getElementById("show_culled_wireframe").checked = state.object.culled_wireframe.material.visible;

    document.getElementById("plane_color").value = "#" + state.plane.material.color.getHexString();
    document.getElementById("plane_opacity").value = state.plane.material.opacity * 100;
    document.getElementById("mesh_color").value = "#" + state.object.visible_surface.material.color.getHexString();
    document.getElementById("wireframe_color").value = "#" + state.object.visible_wireframe.material.color.getHexString();
    document.getElementById("culled_mesh_color").value = "#" + state.object.culled_surface.material.color.getHexString();
    document.getElementById("culled_mesh_opacity").value = state.object.culled_surface.material.opacity * 100;
    document.getElementById("culled_wireframe_color").value = "#" + state.object.culled_wireframe.material.color.getHexString();
    document.getElementById("culled_wireframe_opacity").value = state.object.culled_wireframe.material.opacity * 100;
}

HexaLabGui.submit_plane_position = function () {
    var x = parseFloat(document.getElementById("plane_x").value);
    var y = parseFloat(document.getElementById("plane_y").value);
    var z = parseFloat(document.getElementById("plane_z").value);
    HexaLab.set_plane_position(x, y, z);
}

HexaLabGui.submit_plane_normal = function () {
    var nx = parseFloat(document.getElementById("plane_nx").value);
    var ny = parseFloat(document.getElementById("plane_ny").value);
    var nz = parseFloat(document.getElementById("plane_nz").value);
    HexaLab.set_plane_normal(nx, ny, nz);
}

HexaLabGui.submit_plane_offset_range = function () {
    var range = parseFloat(document.getElementById("plane_offset_range").value) / 100.0;
    HexaLab.set_plane_offset(range);
}

HexaLabGui.submit_plane_offset_number = function () {
    var range = parseFloat(document.getElementById("plane_offset_number").value);
    HexaLab.set_plane_offset(range);
}

HexaLabGui.submit_materials = function () {
    var state = HexaLab.get_state();

    state.plane.material.color.set(document.getElementById("plane_color").value);
    state.plane.material.opacity = parseFloat(document.getElementById("plane_opacity").value) / 100.0;
    state.object.visible_surface.material.color.set(document.getElementById("mesh_color").value);
    state.object.visible_wireframe.material.color.set(document.getElementById("wireframe_color").value);
    state.object.culled_surface.material.color.set(document.getElementById("culled_mesh_color").value);
    state.object.culled_wireframe.material.color.set(document.getElementById("culled_wireframe_color").value);
    state.object.culled_surface.material.opacity = parseFloat(document.getElementById("culled_mesh_opacity").value) / 100.0;
    state.object.culled_wireframe.material.opacity = parseFloat(document.getElementById("culled_wireframe_opacity").value) / 100.0;

    state.plane.material.visible = document.getElementById("show_plane").checked;
    state.object.visible_wireframe.material.visible = document.getElementById("show_wireframe").checked;
    state.object.culled_surface.material.visible = document.getElementById("show_culled_mesh").checked;
    state.object.culled_wireframe.material.visible = document.getElementById("show_culled_wireframe").checked;
}

HexaLabGui.sync_plane_position = function () {
    var plane = HexaLab.get_plane_state();
    document.getElementById("plane_x").value = plane.x;
    document.getElementById("plane_y").value = plane.y;
    document.getElementById("plane_z").value = plane.z;
}

HexaLabGui.sync_plane_normal = function () {
    var plane = HexaLab.get_plane_state();
    document.getElementById("plane_nx").value = plane.nx;
    document.getElementById("plane_ny").value = plane.ny;
    document.getElementById("plane_nz").value = plane.nz;
}

HexaLabGui.sync_plane_offset = function () {
    var range = HexaLab.get_plane_state().range;
    document.getElementById("plane_offset_range").value = range * 100;
    document.getElementById("plane_offset_number").value = range;
}

HexaLabGui.settings_reader.onload = function (event) {
    var data = event.target.result;
    var settings = JSON.parse(data);
    HexaLab.load_settings(settings);
    HexaLabGui.sync_all();
    HexaLab.update_scene();
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
    document.getElementById("sidenav").style.width = "20%";
    document.getElementById("frame").style.width = "80%";
    document.getElementById("frame").style.marginLeft = "20%";
    HexaLab.on_resize();
}

HexaLabGui.close_nav = function () {
    document.getElementById("sidenav").style.width = "0";
    document.getElementById("frame").style.width = "100%";
    document.getElementById("frame").style.marginLeft = "0";
    HexaLab.on_resize();
}

// Interface callbacks

document.getElementById("plane_nx").onchange = function (event) {
    HexaLabGui.submit_plane_normal();
    HexaLab.update_scene();
};
document.getElementById("plane_ny").onchange = function (event) {
    HexaLabGui.submit_plane_normal();
    HexaLab.update_scene();
};
document.getElementById("plane_nz").onchange = function (event) {
    HexaLabGui.submit_plane_normal();
    HexaLab.update_scene();
};
document.getElementById("plane_offset_range").oninput = function (event) {
    HexaLabGui.submit_plane_offset_range();
    HexaLabGui.sync_all();
    HexaLab.update_scene();
};
document.getElementById("plane_offset_number").onchange = function (event) {
    HexaLabGui.submit_plane_offset_number();
    HexaLabGui.sync_all();
    HexaLab.update_scene();
};
document.getElementById("plane_x").onchange = function (event) {
    HexaLabGui.submit_plane_position();
    HexaLabGui.sync_all();
    HexaLab.update_scene();
};
document.getElementById("plane_y").onchange = function (event) {
    HexaLabGui.submit_plane_position();
    HexaLabGui.sync_all();
    HexaLab.update_scene();
};
document.getElementById("plane_z").onchange = function (event) {
    HexaLabGui.submit_plane_position();
    HexaLabGui.sync_all();
    HexaLab.update_scene();
};
document.getElementById("show_plane").onclick = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("show_wireframe").onclick = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("show_culled_mesh").onclick = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("show_culled_wireframe").onclick = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("plane_color").onchange = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("plane_opacity").oninput = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("mesh_color").onchange = function (event) {
    HexaLabGui.submit_materials();
}
document.getElementById("wireframe_color").onchange = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("culled_mesh_color").onchange = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("culled_mesh_opacity").oninput = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("culled_wireframe_color").onchange = function (event) {
    HexaLabGui.submit_materials();
};
document.getElementById("culled_wireframe_opacity").oninput = function (event) {
    HexaLabGui.submit_materials();
};

