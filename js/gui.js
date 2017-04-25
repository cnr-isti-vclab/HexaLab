"use strict";

var HexaLabGui = {}
HexaLabGui.mesh_reader = new FileReader();
HexaLabGui.settings_reader = new FileReader();

// File utility

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

// Menu

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

// Mesh read

HexaLabGui.mesh_reader.onload = function (event) {
    var data = new Int8Array(event.target.result);
    var name = HexaLabGui.mesh_file.name;
    HexaLabGui.make_file(data, name);

    log("Importing...");
    var result = HexaLab.import_mesh(name);
    if (result) {
        HexaLabGui.submit_plane_normal();
        HexaLabGui.submit_plane_offset_range();
        HexaLabGui.sync_all();
        HexaLab.update_scene();
        log("Mesh imported.");
    } else {
        log("Error!");
    }
}

document.getElementById("file_input").onchange = function (event) {
    HexaLabGui.mesh_file = event.target.files[0];
    HexaLabGui.mesh_reader.readAsArrayBuffer(HexaLabGui.mesh_file, "UTF-8");
};

document.getElementById("mesh_pick_button").onclick = function (event) {
    document.getElementById('file_input').value = "";
    document.getElementById('file_input').click();
}

// Settings read/save

HexaLabGui.settings_reader.onload = function (event) {
    var data = event.target.result;
    var settings = JSON.parse(data);
    HexaLab.load_settings(settings);
    HexaLabGui.sync_all();
    HexaLab.update_scene();
}

HexaLabGui.save_settings = function () {
    var settings = JSON.stringify(HexaLab.get_settings(), null, 4);
    var filename = "HexaLab_settings";
    var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename + ".txt");
}

document.getElementById("settings_input").onchange = function (event) {
    HexaLabGui.settings_file = event.target.files[0];
    HexaLabGui.settings_reader.readAsText(HexaLabGui.settings_file, "UTF-8");
};

document.getElementById("settings_pick_button").onclick = function (event) {
    document.getElementById('settings_input').value = "";
    document.getElementById('settings_input').click();
}

document.getElementById("settings_store_button").onclick = function (event) {
    HexaLabGui.save_settings();
}

// Snapshot

HexaLabGui.take_snapshot = function () {
    var canvas = document.getElementById('frame').getElementsByTagName('canvas')[0];
    canvas.toBlob(function (blob) {
        saveAs(blob, "HexaLab_snapshot.png");
    }, "image/png");
}

document.getElementById("snapshot").onclick = function (event) {
    HexaLabGui.take_snapshot();
}


// Settings read
// TODO abstract ? ...
HexaLabGui.sync_all = function () {
    var state = HexaLab.get_state();

    document.getElementById("show_plane").checked = state.plane.material.visible;
    document.getElementById("show_wireframe").checked = state.object.visible_wireframe.material.visible;
    document.getElementById("show_culled_mesh").checked = state.object.culled_surface.material.visible;
    document.getElementById("show_culled_wireframe").checked = state.object.culled_wireframe.material.visible;
    document.getElementById("show_singularity_edges").checked = state.object.singularity_edges.material.visible;

    document.getElementById("show_occlusion").checked = state.settings.show_mesh_occlusion;
    document.getElementById("show_mesh_quality").checked = state.settings.show_mesh_quality;
    document.getElementById("show_bad_hexas_only").checked = state.settings.show_bad_hexas_only;
    document.getElementById("bad_hexa_threshold").checked = state.settings.bad_hexa_threshold;

    document.getElementById("plane_x").value = state.plane.position.x;
    document.getElementById("plane_y").value = state.plane.position.y;
    document.getElementById("plane_z").value = state.plane.position.z;
    document.getElementById("plane_nx").value = state.plane.normal.x;
    document.getElementById("plane_ny").value = state.plane.normal.y;
    document.getElementById("plane_nz").value = state.plane.normal.z;
    document.getElementById("plane_offset_range").value = state.plane.offset * 100;
    document.getElementById("plane_offset_number").value = state.plane.offset;
    document.getElementById("plane_color").value = "#" + state.plane.material.color.getHexString();
    document.getElementById("plane_opacity").value = state.plane.material.opacity * 100;

    document.getElementById("mesh_color").value = "#" + state.object.visible_surface.material.color.getHexString();
    //document.getElementById("mesh_opacity").value = state.object.visible_surface.material.opacity * 100;
    document.getElementById("wireframe_color").value = "#" + state.object.visible_wireframe.material.color.getHexString();
    document.getElementById("wireframe_opacity").value = state.object.visible_wireframe.material.opacity * 100;
    document.getElementById("culled_mesh_color").value = "#" + state.object.culled_surface.material.color.getHexString();
    document.getElementById("culled_mesh_opacity").value = state.object.culled_surface.material.opacity * 100;
    document.getElementById("culled_wireframe_color").value = "#" + state.object.culled_wireframe.material.color.getHexString();
    document.getElementById("culled_wireframe_opacity").value = state.object.culled_wireframe.material.opacity * 100;
    document.getElementById("singularity_edges_opacity").value = state.object.singularity_edges.material.opacity * 100;
}

// Settings write

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
document.getElementById("background_color").onchange = function (event) {
    HexaLab.set_background_color(document.getElementById("background_color").value);
};
document.getElementById("show_plane").onclick = function (event) {
    HexaLab.show_plane(document.getElementById("show_plane").checked);
};
document.getElementById("show_wireframe").onclick = function (event) {
    HexaLab.show_wireframe(document.getElementById("show_wireframe").checked);
};
document.getElementById("show_culled_mesh").onclick = function (event) {
    HexaLab.show_culled_mesh(document.getElementById("show_culled_mesh").checked);
};
document.getElementById("show_culled_wireframe").onclick = function (event) {
    HexaLab.show_culled_wireframe(document.getElementById("show_culled_wireframe").checked);
};
document.getElementById("show_singularity_edges").onclick = function (event) {
    HexaLab.show_singularity_edges(document.getElementById("show_singularity_edges").checked);
};
document.getElementById("plane_color").onchange = function (event) {
    HexaLab.set_plane_color(document.getElementById("plane_color").value);
};
document.getElementById("plane_opacity").oninput = function (event) {
    HexaLab.set_plane_opacity(document.getElementById("plane_opacity").value / 100);
};
document.getElementById("mesh_color").onchange = function (event) {
    HexaLab.set_mesh_color(document.getElementById("mesh_color").value);
};
//document.getElementById("mesh_opacity").oninput = function (event) {
//    HexaLab.set_mesh_opacity(document.getElementById("mesh_opacity").value / 100);
//};
document.getElementById("wireframe_color").onchange = function (event) {
    HexaLab.set_wireframe_color(document.getElementById("wireframe_color").value);
};
document.getElementById("wireframe_opacity").oninput = function (event) {
    HexaLab.set_wireframe_opacity(document.getElementById("wireframe_opacity").value / 100);
};
document.getElementById("culled_mesh_color").onchange = function (event) {
    HexaLab.set_culled_mesh_color(document.getElementById("culled_mesh_color").value);
};
document.getElementById("culled_mesh_opacity").oninput = function (event) {
    HexaLab.set_culled_mesh_opacity(document.getElementById("culled_mesh_opacity").value / 100);
};
document.getElementById("culled_wireframe_color").onchange = function (event) {
    HexaLab.set_culled_wireframe_opacity(document.getElementById("culled_wireframe_color").value);
};
document.getElementById("culled_wireframe_opacity").oninput = function (event) {
    HexaLab.set_culled_wireframe_opacity(document.getElementById("culled_wireframe_opacity").value / 100);
};
document.getElementById("singularity_edges_opacity").oninput = function (event) {
    HexaLab.set_singularity_edges_opacity(document.getElementById("singularity_edges_opacity").value / 100);
};
document.getElementById("show_occlusion").onclick = function (event) {
    HexaLab.show_mesh_occlusion(document.getElementById("show_occlusion").checked);
};
