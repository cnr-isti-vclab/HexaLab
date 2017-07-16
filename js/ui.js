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
    snapshot: $('#snapshot'),

    // Rendering
    surface_color: $('#surface_color'),
    filtered_opacity: $('#filtered_slider'),
    quality: $("#show_quality"),
    occlusion: $("#show_occlusion"),
    color_map: $('#color_map'),
    singularity_opacity: $('#singularity_slider')
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
        HexaLab.UI.quality_plot_update()
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

HexaLab.UI.quality_plot_update = function () {
    if (HexaLab.UI.plot_overlay) {
        var axis = HexaLab.UI.plot_overlay[0].axis
        HexaLab.UI.quality_plot(HexaLab.UI.plot_overlay[0], axis)
    }
}

HexaLab.UI.quality_plot = function(container, axis) {
    var x = [];
    var c = [];
    var p = [];

    var quality = HexaLab.app.app.get_hexa_quality();
    var data = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size());
    for (var i = 0; i < quality.size() ; i++) {
        x[i] = data[i]
    }

    var bins = 100
    for (var i = 0; i < bins ; i++) {
        c[i] = i
    }

    for (var i = 0; i <= 10; ++i) {
        var v = i / 10
        var rgb = HexaLab.app.app.map_to_color(v)
        var r = (rgb.x() * 255).toFixed(0)
        var g = (rgb.y() * 255).toFixed(0)
        var b = (rgb.z() * 255).toFixed(0)
        p[i] = [v.toString(), 'rgb(' + r + ',' + g + ',' + b + ')']
    }

    var plot_data = [{
        type: 'histogram',
        histnorm: 'probability',
        marker: {
            cmax: bins - 1,
            cmin: 0, 
            color: c,
            colorscale: p
        },
    }];
    plot_data[0][axis] = x;
    var bk = axis.concat('bins')
    plot_data[0][bk] = {
        size: 1 / bins,
        start: 0,   
        end: 1,
    };

    var layout = { 
        xaxis: {
            fixedrange: true
        },
        yaxis: {
            fixedrange: true
        }
    };

    var options = {
        modeBarButtons: [
            [{
                name: 'Flip axis',
                icon: Plotly.Icons['3d_rotate'],
                click: function() {
                    if (axis == 'x') {
                        HexaLab.UI.quality_plot(container, 'y')
                    } else if (axis == 'y') {
                        HexaLab.UI.quality_plot(container, 'x')
                    }
                }
            }],
            [
              'toImage',
            ]
        ],
        displaylogo: false
    }

    container.axis = axis

    Plotly.newPlot(container, plot_data, layout, options);
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
    if (HexaLab.UI.plot_overlay) {
        HexaLab.UI.plot_overlay.remove()
        delete HexaLab.UI.plot_overlay
    } else {
        HexaLab.UI.plot_overlay = HexaLab.UI.overlay(400, 100, 500, 800, '').appendTo(document.body)
        HexaLab.UI.quality_plot(HexaLab.UI.plot_overlay[0], 'y')
        HexaLab.UI.plot_overlay.on('resize', function () {
            Plotly.Plots.resize(HexaLab.UI.plot_overlay[0]);
        })
    }
    //HexaLab.UI.quality_plot(HexaLab.UI.quality_plot_dialog[0]);
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

HexaLab.UI.overlay = function (x, y, width, height, content) {
    var x = jQuery(
        [
            '<div id="overlay" style="',
            'left:', x, 'px;',
            'top:', y, 'px;',
            'width:', width, 'px;',
            'height:', height, 'px;',
            'position:fixed;',
            ' ">', content, ' </div>'
        ].join(''))
    return x.resizable().draggable({
        cursor: "move"
    });
}

HexaLab.UI.about.on('click', function () {
    if (HexaLab.UI.about_dialog) {
        HexaLab.UI.about_dialog.dialog('close')
        delete HexaLab.UI.about_dialog;
    } else {
        HexaLab.UI.about_dialog = $('<div title="About">\\m/</div>').dialog({
            close: function()
            {
                $(this).dialog('destroy').remove()
            }
        });
    }
    /*if (HexaLab.UI.about_overlay) {
        HexaLab.UI.about_overlay.remove()
        delete HexaLab.UI.about_overlay
    } else {
        HexaLab.UI.about_overlay = HexaLab.UI.overlay(100, 100, 100, 100, '\\m/').appendTo(document.body)
    }*/
})

HexaLab.UI.snapshot.on('click', function () {
    HexaLab.app.canvas.element.toBlob(function (blob) {
        saveAs(blob, "HLsnapshot.png");
    }, "image/png");
})
