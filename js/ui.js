"use strict";

var HexaLab = {}

HexaLab.UI = {
    // --------------------------------------------------------------------------------
    // Internals
    // --------------------------------------------------------------------------------
    app: null,
    file_reader: new FileReader(),

    // --------------------------------------------------------------------------------
    // DOM page bindings
    // --------------------------------------------------------------------------------
    frame: $('#frame_wrapper'),

    dragdrop_overlay: $('#drag_drop_overlay'),
    dragdrop_mesh: $('#mesh_drag_drop_quad'),
    dragdrop_settings: $('#settings_drag_drop_quad'),

    file_input: $('<input type="file">'),

    // Mesh dialog
    load_mesh_dialog: $('#load_mesh_dialog'),
    load_mesh_dialog_mode: $('#load_mesh_dialog_mode_select'),
    load_mesh_dialog_paper_div: $('#load_mesh_dialog_paper'),
    load_mesh_dialog_paper_select: $('#load_mesh_dialog_paper_select'),
    load_mesh_dialog_paper_mesh_div: $('#load_mesh_dialog_paper_mesh'),
    load_mesh_dialog_paper_mesh_select: $('#load_mesh_dialog_paper_mesh_select'),
    load_mesh_dialog_ok: $('#load_mesh_dialog_load'),

    // Toolbar
    load_mesh: $('#load_mesh'),
    reset_camera: $('#home'),
    plot: $('#plot'),
    load_settings: $('#load_settings'),
    save_settings: $('#save_settings'),
    github: $('#github'),
    about: $('#about'),

    // Rendering
    surface_color: $('#surface_color'),
    filtered_opacity: $('#filtered_slider'),
    quality: $("#show_quality"),
    occlusion: $("#show_occlusion"),
    color_map: $('#color_map')
}

// -------------------------------------------------------------------------------- 
// Mesh/settings load/save trigger functions
// --------------------------------------------------------------------------------
HexaLab.UI.mesh_load_trigger = function () {
    HexaLab.UI.file_input.val(null);
    HexaLab.UI.file_input.off('change').change(function () {
        var file = this.files[0];
        HexaLab.UI.import_mesh(file);
    })
    HexaLab.UI.file_input.click();
}

HexaLab.UI.settings_load_trigger = function () {
    HexaLab.UI.file_input.val(null);
    HexaLab.UI.file_input.off('change').change(function () {
        var file = this.files[0];
        HexaLab.UI.import_settings(file);
    })
    HexaLab.UI.file_input.click();
}

HexaLab.UI.settings_save_trigger = function () {
    var settings = JSON.stringify(HexaLab.app.get_settings(), null, 4);
    var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "HLsettings.txt");
}

// -------------------------------------------------------------------------------- 
// Mesh/settings file bind and dispatch
// --------------------------------------------------------------------------------
HexaLab.UI.import_mesh = function (file) {
    HexaLab.UI.file_reader.onload = function () {
        var data = new Int8Array(this.result);
        HexaLab.FS.make_file(data, file.name);
        HexaLab.app.import_mesh(file.name);
    }
    HexaLab.UI.file_reader.readAsArrayBuffer(file, "UTF-8");
}

HexaLab.UI.import_settings = function (file) {
    HexaLab.UI.file_reader.onload = function () {
        var settings = JSON.parse(this.result);
        HexaLab.app.set_settings(settings);
    }
    HexaLab.UI.file_reader.readAsText(file, "UTF-8");
}

// --------------------------------------------------------------------------------
// Mesh load dialog
// --------------------------------------------------------------------------------

HexaLab.UI.load_mesh_dialog.dialog({
    autoOpen: false,
    modal: true,
    title: 'Mesh Import'
})

HexaLab.UI.load_mesh_dialog_ok.button().on('click', function () {
    HexaLab.UI.mesh_load_trigger();
    HexaLab.UI.load_mesh_dialog.dialog('close');
});
HexaLab.UI.load_mesh_dialog_paper_div.hide();
HexaLab.UI.load_mesh_dialog_paper_mesh_div.hide();

HexaLab.UI.load_mesh_dialog_mode.on('change', function () {
    if ($(this).val() == 'local') {
        HexaLab.UI.load_mesh_dialog_paper_div.hide();
        HexaLab.UI.load_mesh_dialog_paper_mesh_div.hide();
        HexaLab.UI.load_mesh_dialog_ok.show();
    } else if ($(this).val() == 'paper') {
        HexaLab.UI.load_mesh_dialog_paper_div.show();
        HexaLab.UI.load_mesh_dialog_paper_mesh_div.hide();
        HexaLab.UI.load_mesh_dialog_ok.hide();
    }
})

// --------------------------------------------------------------------------------
// Drag n Drop logic
// --------------------------------------------------------------------------------
HexaLab.UI.dragdrop_overlay.hide();

HexaLab.UI.frame.on('dragbetterenter', function (event) {
    HexaLab.UI.dragdrop_overlay.show();
})
HexaLab.UI.frame.on('dragover', function (event) {
    event.preventDefault();
})
HexaLab.UI.frame.on('drop', function (event) {
    event.preventDefault();
})
HexaLab.UI.frame.on('dragbetterleave', function (event) {
    HexaLab.UI.dragdrop_overlay.hide();
})

HexaLab.UI.dragdrop_mesh.on('dragbetterenter', function (event) {
    $(this).removeClass('drag_drop_quad_off').addClass('drag_drop_quad_on');
})
HexaLab.UI.dragdrop_mesh.on('dragover', function (event) {
    event.preventDefault()
})
HexaLab.UI.dragdrop_mesh.on('drop', function (event) {
    event.preventDefault()
    var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files
    HexaLab.UI.import_mesh(files[0])
})
HexaLab.UI.dragdrop_mesh.on('dragbetterleave', function (event) {
    $(this).removeClass('drag_drop_quad_on').addClass('drag_drop_quad_off');
})

HexaLab.UI.dragdrop_settings.on('dragbetterenter', function (event) {
    $(this).removeClass('drag_drop_quad_off').addClass('drag_drop_quad_on');
})
HexaLab.UI.dragdrop_settings.on('dragover', function (event) {
    event.preventDefault()
})
HexaLab.UI.dragdrop_settings.on('drop', function (event) {
    event.preventDefault()
    var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files
    HexaLab.UI.import_settings(files[0])
})
HexaLab.UI.dragdrop_settings.on('dragbetterleave', function (event) {
    $(this).removeClass('drag_drop_quad_on').addClass('drag_drop_quad_off');
})

// --------------------------------------------------------------------------------
// Plot
// --------------------------------------------------------------------------------

HexaLab.UI.quality_plot_dialog = $('<div></div>')

HexaLab.UI.quality_plot = function(container) {
    var x = [];
    HexaLab.UI.quality_plot_dialog.dialog({
        resize: function () {
            Plotly.Plots.resize(container);
        },
        title: 'Jacobian Quality',
        width: 800,
        height: 500
    });
    var quality = HexaLab.app.app.get_hexa_quality();
    var data = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size());
    for (var i = 0; i < quality.size() ; i++) {
        x[i] = data[i];
    }
    var plot_data = [{
        x: x,
        type: 'histogram',
        marker: {
            color: 'rgba(0,0,0,0.7)',
        },
    }];
    Plotly.newPlot(container, plot_data);
}

// --------------------------------------------------------------------------------
// Toolbar listeners
// --------------------------------------------------------------------------------

HexaLab.UI.load_mesh.on('click', function () {
    //HexaLab.UI.load_mesh_dialog.dialog('open')
    HexaLab.UI.mesh_load_trigger();
})

HexaLab.UI.reset_camera.on('click', function () {
    HexaLab.app.set_camera_settings(HexaLab.app.default_camera_settings)
})

HexaLab.UI.plot.on('click', function () {
    HexaLab.UI.quality_plot(HexaLab.UI.quality_plot_dialog[0]);
})

HexaLab.UI.load_settings.on('click', function () {
    HexaLab.UI.settings_load_trigger();
})

HexaLab.UI.save_settings.on('click', function () {
    HexaLab.UI.settings_save_trigger();
})

HexaLab.UI.github.on('click', function () {
    window.open('https://github.com/cnr-isti-vclab/HexaLab', '_blank');
})

HexaLab.UI.about.on('click', function () {
    $('<div title="About">\\m/</div>').dialog();
})