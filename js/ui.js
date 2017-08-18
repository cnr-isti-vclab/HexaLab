"use strict";

var HexaLab = {}

// --------------------------------------------------------------------------------
// Utility
// --------------------------------------------------------------------------------
// File utility routines

HexaLab.FS = {
    file_exists: function (path) {
        var stat = FS.stat(path);
        if (!stat) return false;
        return FS.isFile(stat.mode);
    },
    make_file: function (data, name) {
        try {
            if (HexaLab.FS.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
        FS.createDataFile("/", name, data, true, true);
    },
    delete_file: function (name) { 
        try {
            if (HexaLab.FS.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }       
    },
    open_dir: function (path) {
        var lookup = FS.lookupPath(path)
        console.log(lookup)
    }
};

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
// User interface building

HexaLab.UI = {
    // --------------------------------------------------------------------------------
    // Internals
    // --------------------------------------------------------------------------------
    app: null,
    file_reader: new FileReader(),

    // --------------------------------------------------------------------------------
    // DOM page bindings
    // --------------------------------------------------------------------------------
    frame: $('#frame'),

    menu: $('#GUI'),

    display: $('#display'),

    dragdrop_overlay: $('#drag_drop_overlay'),
    dragdrop_mesh: $('#mesh_drag_drop_quad'),
    dragdrop_settings: $('#settings_drag_drop_quad'),

    file_input: $('<input type="file">'),

    // Mesh dialog
    mesh_info_1: $('#mesh_info_1'),
    mesh_info_1_text: $('#mesh_info_1 .box_text'),
    mesh_info_1_buttons: $('#mesh_info_1 .box_buttons'),
    mesh_info_2: $('#mesh_info_2'),
    mesh_info_2_text: $('#mesh_info_2 .box_text'),
    mesh_source_pdf_button: $('#source_pdf'),
    mesh_source_web_button: $('#source_web'),
    mesh_source_doi_button: $('#source_doi'),
    mesh_source: $('#mesh_source'),
    paper_mesh_picker: $('#paper_mesh_picker'),

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
    singularity_opacity: $('#singularity_slider'),

    // Mesh sources
    datasets_index: {}
}

// -------------------------------------------------------------------------------- 
// Mesh/settings load/save trigger functions
// --------------------------------------------------------------------------------
HexaLab.UI.mesh_local_load_trigger = function () {
    HexaLab.UI.file_input.val(null).off('change').change(function () {
        HexaLab.UI.import_local_mesh(this.files[0]);
    })
    HexaLab.UI.file_input.click();
}

HexaLab.UI.settings_load_trigger = function () {
    HexaLab.UI.file_input.val(null).off('change').change(function () {
        HexaLab.UI.import_settings(this.files[0]);
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
HexaLab.UI.import_mesh = function (byte_array, longName, ui_callback) {
    var name = longName.substring(longName.lastIndexOf('/') + 1);
    HexaLab.FS.make_file(byte_array, name);
    try {
        HexaLab.app.import_mesh(name);
    } catch(e) {
        ui_callback(false);
        return;
    }
    HexaLab.UI.quality_plot_update();
    HexaLab.FS.delete_file(name);
    ui_callback(true);
}

HexaLab.UI.import_local_mesh = function (file) {
    HexaLab.UI.file_reader.onload = function () {
        var data = new Int8Array(this.result)
        HexaLab.UI.import_mesh(data, file.name, function (result) {
            if (!result){
                HexaLab.UI.mesh_info_1_text.empty().append('<span>Can\'t parse the file.</span>')
                return
            }
            var stats = HexaLab.app.app.get_mesh_stats()

            HexaLab.UI.mesh_info_1_text.empty().append('<span class="mesh-name">' + file.name + '</span>' + '<br/>' + 
                '<span>' + stats.vert_count + ' vertices ' + '</span>' + '<br />' +
                '<span>' + stats.hexa_count + ' hexas ' + '</span>')
        })
    }
    HexaLab.UI.file_reader.readAsArrayBuffer(file, "UTF-8")
    HexaLab.UI.mesh_info_1_text.empty().append('<span>Loading...</span>').show()
    HexaLab.UI.mesh_info_1_buttons.hide()
    HexaLab.UI.mesh_info_1.show().css('display', 'flex');
    HexaLab.UI.paper_mesh_picker.hide()
    HexaLab.UI.mesh_info_2.hide()
}

HexaLab.UI.import_remote_mesh = function (source, name) {
    var request = new XMLHttpRequest();
    request.open('GET', 'datasets/' + source.path + '/' + name, true);
    request.responseType = 'arraybuffer';
    request.onload = function(e) {
        var data = new Uint8Array(this.response); 
        HexaLab.UI.import_mesh(data, name, function (result) {
            if (!result){
                HexaLab.UI.mesh_info_2_text.empty().append('<span>Can\'t parse the file.</span>') 
                return
            }
            var stats = HexaLab.app.app.get_mesh_stats()
            HexaLab.UI.mesh_info_2_text.empty().append(stats.vert_count + ' vertices <br />' +
                stats.hexa_count + ' hexas </span>')
        })
    };
    request.send();

    HexaLab.UI.mesh_info_2_text.text('Loading...')
    HexaLab.UI.paper_mesh_picker.css('font-style', 'normal')
    HexaLab.UI.mesh_info_2.show().css('display', 'flex');
}

HexaLab.UI.import_settings = function (file) {
    HexaLab.UI.file_reader.onload = function () {
        var settings = JSON.parse(this.result)
        HexaLab.app.set_settings(settings)
    }
    HexaLab.UI.file_reader.readAsText(file, "UTF-8")
}

// --------------------------------------------------------------------------------
// Datasets
// --------------------------------------------------------------------------------

$.ajax({
    url: 'datasets/index.json',
    dataType: 'json'
}).done(function(data) {
    HexaLab.UI.datasets_index = data

    $.each(HexaLab.UI.datasets_index.sources, function (i, source) {
        HexaLab.UI.mesh_source.append($('<option>', { 
            value: i,
            text : source.label 
        }));
    });
})

HexaLab.UI.mesh_source.on("change", function () {
    HexaLab.UI.mesh_source.css('font-style', 'normal')

    var v = this.options[this.selectedIndex].value
    if (v == "-1") {
        HexaLab.UI.mesh_local_load_trigger()
    } else {
        var i = parseInt(v)
        var source = HexaLab.UI.datasets_index.sources[i]

        HexaLab.UI.mesh_info_1_text.empty().append('<span class="paper-title">' + source.paper.title + '</span>' + '<br />' +
            '<span class="paper-authors">' + source.paper.authors + '</span>' + ' - ' + 
            '<span class="paper-venue">' + source.paper.venue + ' (' + source.paper.year + ') ' + '</span>')
        HexaLab.UI.mesh_info_1.show().css('display', 'flex');
        HexaLab.UI.mesh_info_1_buttons.show().css('display', 'flex');

        if (source.paper.PDF) {
            HexaLab.UI.mesh_source_pdf_button.removeClass('inactive').off('click').on('click', function() { window.open(source.paper.PDF) })
        } else {
            HexaLab.UI.mesh_source_pdf_button.addClass('inactive')
        }

        if (source.paper.web) {
            HexaLab.UI.mesh_source_web_button.removeClass('inactive').off('click').on('click', function() { window.open(source.paper.web) })
        } else {
            HexaLab.UI.mesh_source_web_button.addClass('inactive')
        }

        if (source.paper.DOI) {
            HexaLab.UI.mesh_source_doi_button.removeClass('inactive').off('click').on('click', function() { window.open('http://doi.org/' + source.paper.DOI) })
        } else {
            HexaLab.UI.mesh_source_doi_button.addClass('inactive')
        }

        HexaLab.UI.paper_mesh_picker.empty().css('font-style', 'italic')
        HexaLab.UI.paper_mesh_picker.append($('<option>', { 
                value: "-1",
                text : 'Select a mesh file',
                style: 'display:none;'
            }));
        $.each(source.data, function (i, name) {
            HexaLab.UI.paper_mesh_picker.append($('<option>', { 
                value: i,
                text : name,
                style: 'font-style: normal;'
            }));
        });
        HexaLab.UI.paper_mesh_picker.show()        
    }
})

HexaLab.UI.paper_mesh_picker.on("change", function () {
    var v = this.options[this.selectedIndex].value
    var i = parseInt(v)
    var j = parseInt(HexaLab.UI.mesh_source[0].options[HexaLab.UI.mesh_source[0].selectedIndex].value)
    var source = HexaLab.UI.datasets_index.sources[j]
    var mesh = source.data[i]

    HexaLab.UI.import_remote_mesh(source, mesh)
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
    HexaLab.UI.import_local_mesh(files[0])
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
        },
        margin: {
            l: 40,
            r: 40,
            b: 40,
            t: 40,
            pad: 4
        },
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
// Side menu resize
// --------------------------------------------------------------------------------
HexaLab.UI.menu.resizable({
    handles: 'e',
    minWidth: 300,
    maxWidth: 600
})

HexaLab.UI.menu.on('resize', function () {
    var width = HexaLab.UI.display.width() - HexaLab.UI.menu.width()
    HexaLab.UI.frame.css('margin-left', HexaLab.UI.menu.width()) 
    HexaLab.UI.frame.width(width)
    HexaLab.app.resize()
})

// --------------------------------------------------------------------------------
// Toolbar
// --------------------------------------------------------------------------------

HexaLab.UI.load_mesh.on('click', function () {
    //HexaLab.UI.load_mesh_dialog.dialog('open')
    HexaLab.UI.mesh_local_load_trigger()
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
        HexaLab.UI.about_dialog = $('<div title="About"><h3><b>HexaLab</b></h3>\n\
A webgl, client based, hexahedral mesh viewer. \n\
Developed by <a href="https://github.com/c4stan">Matteo Bracci</a> as part of his Bachelor Thesis \n\
in Computer Science, under the supervision of <a href="http://vcg.isti.cnr.it/~cignoni">Paolo Cignoni</a> \n\
and <a href="http://vcg.isti.cnr.it/~pietroni">Nico Pietroni</a>.<br><br>  \n\
Copyright (C) 2017  <br>\
<a href="http://vcg.isti.cnr.it">Visual Computing Lab</a>  <br>\
<a href="http://www.isti.cnr.it">ISTI</a> - <a href="http://www.cnr.it">Italian National Research Council</a> <br><br> \n\
<i>All the shown datasets are copyrighted by the referred paper authors</i>.</div>').dialog({
            close: function()
            {
                $(this).dialog('close')
                delete HexaLab.UI.about_dialog;
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
