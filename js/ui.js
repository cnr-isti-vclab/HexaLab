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
    },
    short_path: function(path) {
        if (path.includes("/")) {
            return path.substring(path.lastIndexOf('/') + 1);
        }
        return path
    },

    element: $('<input type="file">'),
    trigger_file_picker: function (callback) {
        this.element.val(null).off('change').change(function () {
            callback(this.files[0])
        })
        this.element.click()
    },

    store_blob: function (blob, filename) {
        saveAs(blob, filename)
    },

    reader: new FileReader(),
    read_json_file: function (file, callback) {
        this.reader.onload = function () {
            const json = JSON.parse(this.result)
            callback(file.name, json)
        }
        this.reader.readAsText(file, "UTF-8")
    },
    read_data_file: function (file, callback) {
        this.reader.onload = function () {
            const data = new Int8Array(this.result)
            callback(file.name, data)
        }
        this.reader.readAsArrayBuffer(file, "UTF-8")
    }
}

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------

HexaLab.UI = {
    // To enable additional event trigger when the first mesh gets loaded in (clean up the page, ...)
    first_mesh: true,

    // body content
    display:                $('#display'),
    // canvas container
    canvas_container:       $('#frame'),
    // side menu
    menu:                   $('#GUI'),

    dragdrop: {
        overlay:            $('#drag_drop_overlay'),
        header:             $('#drag_drop_header'),
        mesh:               $('#mesh_drag_drop_quad'),
        settings:           $('#settings_drag_drop_quad'),
    },

    // Mesh dialog
    mesh: {
        source:             $('#mesh_source'),
        dataset_content:    $('#paper_mesh_picker'),

        infobox_1: {
            element:        $('#mesh_info_1'),
            text:           $('#mesh_info_1 .box_text'),
            buttons: {
                container:  $('#mesh_info_1 .box_buttons'),
                pdf:        $('#source_pdf'),
                web:        $('#source_web'),
                doi:        $('#source_doi'),
            }
        },
        infobox_2: {
            element:        $('#mesh_info_2'),
            text:           $('#mesh_info_2 .box_text'),
        }
    },
    
    // Toolbar
    topbar: {
        load_mesh:          $('#load_mesh'),
        reset_camera:       $('#home'),
        plot:               $('#plot'),
        load_settings:      $('#load_settings'),
        save_settings:      $('#save_settings'),
        github:             $('#github'),
        about:              $('#about'),
        snapshot:           $('#snapshot'),

        on_mesh_import: function () {
            this.reset_camera.prop("disabled", false)
            this.plot.prop("disabled", false)
            this.load_settings.prop("disabled", false)
            this.save_settings.prop("disabled", false)
            this.snapshot.prop("disabled", false)
        },
        on_mesh_import_fail: function () {
            this.reset_camera.prop("disabled", true)
            this.plot.prop("disabled", true)
            this.load_settings.prop("disabled", true)
            this.save_settings.prop("disabled", true)
            this.snapshot.prop("disabled", true)
        },
    },
    
    // Rendering
    settings: {
        color: {
            source:         $('#surface_color_source'),
            quality_map:    $('#color_map'),
            default: {
                wrapper:    $('#visible_color_wrapper'),
                outside:    $('#visible_outside_color'),
                inside:     $('#visible_inside_color'),
            }
        },
        silhouette:         $('#filtered_slider'),
        wireframe:          $('#wireframe_slider'),
        occlusion:          $("#show_occlusion"),
        singularity_mode:   $('#singularity_slider'),
        geometry_mode:      $('#geometry_mode'),
        ao_mode:            $("#ao_mode"),
    },
    
    // Mesh sources
    datasets_index: {},
}

// Copy-paste event listeners.
// On copy, app settings are copied on the user system clipboard.
// On paste, the app reads and imports settings from the user system clipboard. 
document.body.addEventListener('paste', function (e) { 
    var clipboardData, pastedData

    e.stopPropagation()
    e.preventDefault()

    clipboardData = e.clipboardData || window.clipboardData
    pastedData = clipboardData.getData('Text')

    HexaLab.app.set_settings(JSON.parse(pastedData))
})
document.body.addEventListener('copy', function (e) { 
    e.clipboardData.setData("text/plain;charset=utf-8", JSON.stringify(HexaLab.app.get_settings(), null, 4))
    e.stopPropagation()
    e.preventDefault()
})

// --------------------------------------------------------------------------------
// Rendering GUI elements
// --------------------------------------------------------------------------------
// UI -> App events
HexaLab.UI.settings.color.source.on("change", function () {
    var value = this.options[this.selectedIndex].value
    if (value == "Default") {
        HexaLab.app.show_visible_quality(false)
    } else if (value == "ColorMap") {
        HexaLab.app.show_visible_quality(true)
    }
})

HexaLab.UI.settings.color.default.outside.spectrum({
    cancelText: ''
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_outside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.settings.color.default.inside.spectrum({
    cancelText: ''
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_inside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.settings.silhouette.slider().addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_filtered_surface_opacity(ui.value / 100)
})

HexaLab.UI.settings.color.quality_map.on('change', function () {
    HexaLab.app.set_color_map(this.options[this.selectedIndex].value)
})

HexaLab.UI.settings.wireframe.slider().addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_visible_wireframe_opacity(ui.value / 100)
})

HexaLab.UI.settings.singularity_mode.slider({
    value: 0,
    min: 0,
    max: 4,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_singularity_mode(ui.value)
})

HexaLab.UI.settings.ao_mode.on('change', function () {
    HexaLab.app.set_occlusion(this.options[this.selectedIndex].value)
})

HexaLab.UI.settings.occlusion.on('click', function () {
    HexaLab.app.set_occlusion(this.checked ? 'object space' : 'none')
})

HexaLab.UI.settings.geometry_mode.on('change', function () {
    HexaLab.app.set_geometry_mode(this.options[this.selectedIndex].value)
})

// App -> UI events
HexaLab.UI.on_set_visible_surface_default_outside_color = function (color) {
    HexaLab.UI.settings.color.default.outside.spectrum('set', color)
}

HexaLab.UI.on_set_visible_surface_default_inside_color = function (color) {
    HexaLab.UI.settings.color.default.inside.spectrum('set', color)
}

HexaLab.UI.on_show_visible_quality = function (do_show) {
    if (do_show) {
        $("#surface_colormap_input").css('display', 'flex');
        HexaLab.UI.settings.color.default.wrapper.hide();
        HexaLab.UI.settings.color.source.val("ColorMap")
    } else {
        $("#surface_colormap_input").hide();
        HexaLab.UI.settings.color.default.wrapper.css('display', 'flex');
        HexaLab.UI.settings.color.source.val("Default")
    }
}

HexaLab.UI.on_set_wireframe_opacity = function (value) {
    HexaLab.UI.settings.wireframe.slider('value', value * 100)
}

HexaLab.UI.on_set_filtered_surface_opacity = function (value) {
    HexaLab.UI.settings.silhouette.slider('value', value * 100)
}

HexaLab.UI.on_set_singularity_mode = function (mode) {
    HexaLab.UI.settings.singularity_mode.slider('value', mode)
}

HexaLab.UI.on_set_occlusion = function (ao) {
    HexaLab.UI.settings.occlusion.prop('checked', ao == 'object space')
}

HexaLab.UI.on_set_color_map = function (value) {
    HexaLab.UI.settings.color.quality_map_name = value
    HexaLab.UI.settings.color.quality_map.val(value)
    HexaLab.UI.quality_plot_update()
}

// --------------------------------------------------------------------------------
// Mesh/settings file bind and dispatch
// --------------------------------------------------------------------------------
HexaLab.UI.on_first_mesh = function () {
    HexaLab.UI.dragdrop.header.html('Drag&Drop mesh or settings files<br/>in the boxes below.')
    HexaLab.UI.dragdrop.overlay.removeClass('first_drag_drop').hide();
    HexaLab.UI.dragdrop.mesh.css('margin-left', '20%');
    HexaLab.UI.dragdrop.settings.show();
}

HexaLab.UI.clear_mesh_info_keep_source = function () {
    HexaLab.UI.mesh.infobox_2.element.hide()
    HexaLab.UI.mesh.dataset_content.hide()
}

HexaLab.UI.clear_mesh_info = function () {
    HexaLab.UI.mesh.infobox_1.element.hide();
    HexaLab.UI.mesh.infobox_2.element.hide()
    HexaLab.UI.mesh.dataset_content.hide()
}

HexaLab.UI.import_mesh = function (long_name, byte_array) {
    var name = HexaLab.FS.short_path(long_name)
    HexaLab.UI.mesh_long_name = long_name
    HexaLab.FS.make_file(byte_array, name);
    HexaLab.app.import_mesh(name);
    HexaLab.FS.delete_file(name);

    if (HexaLab.UI.first_mesh) {
        HexaLab.UI.on_first_mesh()
        HexaLab.UI.first_mesh = false
    }
}

HexaLab.UI.show_mesh_name = function (name) {
    HexaLab.UI.mesh.infobox_1.text.empty().append(name)
    HexaLab.UI.mesh.infobox_1.element.show().css('display', 'flex')
    HexaLab.UI.mesh.infobox_1.buttons.container.hide()
}

HexaLab.UI.import_local_mesh = function (file) {
    HexaLab.UI.view_source =  HexaLab.UI.mesh.source[0].selectedIndex
    HexaLab.UI.view_mesh = null
    HexaLab.UI.clear_mesh_info()
    HexaLab.UI.mesh.infobox_2.element.show().css('display', 'flex');
    HexaLab.UI.mesh.infobox_2.text.empty().append('<span>Loading...</span>').show()
    HexaLab.FS.read_data_file(file, HexaLab.UI.import_mesh)
}

HexaLab.UI.import_remote_mesh = function (source, name) {
    var request = new XMLHttpRequest();
    request.open('GET', 'datasets/' + source.path + '/' + name, true);
    request.responseType = 'arraybuffer';
    request.onload = function(e) {
        var data = new Uint8Array(this.response)
        HexaLab.UI.import_mesh(name, data)
        HexaLab.UI.setup_dataset_content()
    }
    request.send();

    HexaLab.UI.clear_mesh_info_keep_source()
    $.each(HexaLab.UI.mesh.source[0].options, function() {
        if ($(this).text() == source.text) $(this).prop('selected', true);
    })
    HexaLab.UI.view_source =  HexaLab.UI.mesh.source[0].selectedIndex
    HexaLab.UI.view_mesh = HexaLab.UI.mesh.dataset_content[0].selectedIndex
    HexaLab.UI.mesh.infobox_2.text.text('Loading...')
    HexaLab.UI.mesh.dataset_content.css('font-style', 'normal').show()
    HexaLab.UI.mesh.infobox_2.element.show().css('display', 'flex');
}

HexaLab.UI.setup_mesh_stats = function(name) {
    var mesh = HexaLab.app.backend.get_mesh()
    HexaLab.UI.mesh.infobox_2.element.show()
    HexaLab.UI.mesh.infobox_2.text.empty()
    const name_html = HexaLab.UI.view_source == 1 ? '<div class="menu_row_label" style="line-height: 100%; padding-bottom: 10px;">' + name + '</div>' : ''
    HexaLab.UI.mesh.infobox_2.text.append('<div class="menu_row">' + name_html +
            '<div class="menu_row_input simple-font" style="line-height: 100%; padding-bottom: 10px;">' +
                mesh.vert_count + ' vertices, ' + mesh.hexa_count + ' hexas' +
            '</div>' +
        '</div>')
    // HexaLab.UI.mesh.infobox_2.text.append('<div id="mesh_stats_wrapper">' +
    //     '<div><span class="mesh_stat">vertices: </span><span class="simple-font">' + mesh.vert_count + '</span></div>' +
    //     '<div><span class="mesh_stat">hexas:    </span><span class="simple-font">' + mesh.hexa_count + '</span></div>' +
    //     '</div>'
    // )
    HexaLab.UI.mesh.infobox_2.text.append('<div class="menu_row"><div class="menu_row_label">Quality</div>\
    <div class="menu_row_input">\
        <div class="menu_row_input_block">\
            <select id="quality_type" title="Choose Hex Quality measure">\
                <option value="Scaled Jacobian">Scaled Jacobian</option>\
                <option value="Edge Ratio">Edge Ratio</option>\
                <option value="Diagonal">Diagonal</option>\
                <option value="Dimension">Dimension</option>\
                <option value="Distortion">Distortion</option>\
                <option value="Jacobian">Jacobian</option>\
                <option value="Max Edge Ratio">Max Edge Ratio</option>\
                <option value="Max Aspect Frobenius">Max Aspect Frobenius</option>\
                <option value="Mean Aspect Frobenius">Mean Aspect Frobenius</option>\
                <option value="Oddy">Oddy</option>\
                <option value="Relative Size Squared">Relative Size Squared</option>\
                <option value="Shape">Shape</option>\
                <option value="Shape and Size">Shape and Size</option>\
                <option value="Shear">Shear</option>\
                <option value="Shear and Size">Shear and Size</option>\
                <option value="Skew">Skew</option>\
                <option value="Stretch">Stretch</option>\
                <option value="Taper">Taper</option>\
                <option value="Volume">Volume</option>\
            </select>\
        </div>\
    </div></div>')
    if (HexaLab.UI.view_quality_measure) $('#quality_type').val(HexaLab.UI.view_quality_measure)
    let min = mesh.quality_min.toFixed(3)
    let max = mesh.quality_max.toFixed(3)
    let avg = mesh.quality_avg.toFixed(3)
    let vri = mesh.quality_var.toFixed(3)
    if (min == 0) min = mesh.quality_min.toExponential(2)
    if (max == 0) max = mesh.quality_max.toExponential(2)
    if (avg == 0) avg = mesh.quality_avg.toExponential(2)
    if (vri == 0) vri = mesh.quality_var.toExponential(2)
    HexaLab.UI.mesh.infobox_2.text.append('<table style="width:100%;">' +
        // '<tr> <th>Min</th> <th>Max</th> <th>Avg</th> <th>Var</th> </tr>' +
        '<tr> <td align="center"><span class="simple-font">Min: </span> <span class="simple-font">' + min + '</span></td>' +
            ' <td align="center"><span class="simple-font">Max: </span> <span class="simple-font">' + max + '</span></td>' +
            ' <td align="center"><span class="simple-font">Avg: </span> <span class="simple-font">' + avg + '</span></td>' + 
            ' <td align="center"><span class="simple-font">Var: </span> <span class="simple-font">' + vri + '</span></td> </tr>' +
        '</table>'
    )
    // HexaLab.UI.mesh.infobox_2.text.append('<div id="mesh_stats_wrapper">' +
    //     '<div><span class="mesh_stat">min: </span>' + min + '</div>' +
    //     '<div><span class="mesh_stat">max: </span>' + max + '</div>' +
    //     '<div><span class="mesh_stat">avg: </span>' + avg + '</div>' +
    //     '<div><span class="mesh_stat">var: </span>' + vri + '</div>' +
    //     '</div>'
    // )
    $('#quality_type').on('change', function () {
        var v = this.options[this.selectedIndex].value
        HexaLab.app.set_quality_measure(v);
    })
}

HexaLab.UI.on_set_quality_measure = function (measure) {
    HexaLab.UI.view_quality_measure = measure
    HexaLab.UI.setup_mesh_stats()
    HexaLab.UI.quality_plot_update()
}

HexaLab.UI.on_set_geometry_mode = function (mode) {
    HexaLab.UI.settings.geometry_mode.val(mode)
}

HexaLab.UI.on_import_mesh = function (name) {
    HexaLab.UI.topbar.on_mesh_import()
    // if (HexaLab.UI.view_source == 1) HexaLab.UI.show_mesh_name(name)
    if (HexaLab.UI.view_source == 2) HexaLab.UI.setup_dataset_content()
    HexaLab.UI.setup_mesh_stats(name)
    HexaLab.UI.quality_plot_update()
}

HexaLab.UI.on_import_mesh_fail = function (name) {
    HexaLab.UI.topbar.on_mesh_import_fail()
    HexaLab.UI.mesh.infobox_2.text.empty().append('<span>Can\'t parse the file.</span>')
    HexaLab.UI.view_source = null
    HexaLab.UI.view_mesh = null
}

HexaLab.UI.import_settings = function (file) {
    HexaLab.FS.read_json_file(file, function (file, json) {
        HexaLab.app.set_settings(json)
    })
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
        HexaLab.UI.mesh.source.append($('<option>', {
            value: i,
            text : source.label
        }));
    });
})

HexaLab.UI.setup_dataset_content = function () {
    var v = HexaLab.UI.mesh.source[0].options[HexaLab.UI.mesh.source[0].selectedIndex].value
    var i = parseInt(v)
    var source = HexaLab.UI.datasets_index.sources[i]

    HexaLab.UI.mesh.infobox_1.text.empty().append('<span class="paper-title">' + source.paper.title + '</span>' + '<br />' +
        '<span class="paper-authors">' + source.paper.authors + '</span>' + ' - ' +
        '<span class="paper-venue">' + source.paper.venue + ' (' + source.paper.year + ') ' + '</span>')
    HexaLab.UI.mesh.infobox_1.element.show().css('display', 'flex');
    HexaLab.UI.mesh.infobox_1.buttons.container.show().css('display', 'flex');

    if (source.paper.PDF) {
        HexaLab.UI.mesh.infobox_1.buttons.pdf.removeClass('inactive').off('click').on('click', function() { window.open(source.paper.PDF) })
    } else {
        HexaLab.UI.mesh.infobox_1.buttons.pdf.addClass('inactive')
    }

    if (source.paper.web) {
        HexaLab.UI.mesh.infobox_1.buttons.web.removeClass('inactive').off('click').on('click', function() { window.open(source.paper.web) })
    } else {
        HexaLab.UI.mesh.infobox_1.buttons.web.addClass('inactive')
    }

    if (source.paper.DOI) {
        HexaLab.UI.mesh.infobox_1.buttons.doi.removeClass('inactive').off('click').on('click', function() { window.open('http://doi.org/' + source.paper.DOI) })
    } else {
        HexaLab.UI.mesh.infobox_1.buttons.doi.addClass('inactive')
    }

    HexaLab.UI.mesh.dataset_content.empty()
    if (HexaLab.UI.view_mesh == null) HexaLab.UI.mesh.dataset_content.css('font-style', 'italic')
    HexaLab.UI.mesh.dataset_content.append($('<option>', {
            value: "-1",
            text : 'Select a mesh',
            style: 'display:none;'
        }));
    $.each(source.data, function (i, name) {
        var s = HexaLab.UI.view_source == HexaLab.UI.mesh.source[0].selectedIndex && HexaLab.UI.view_mesh - 1 == i ? true : false
        if (s) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(name))
        HexaLab.UI.mesh.dataset_content.append($('<option>', {
            value: i,
            text : name,
            style: 'font-style: normal;',
            selected: s
        }));
    });

    HexaLab.UI.mesh.dataset_content.show()
}

// HexaLab.UI.mesh.source.on("click", function () {
//     if (HexaLab.UI.mesh.source.select_focus_file_flag) {
//         HexaLab.UI.mesh.source.select_focus_file_flag = 0
//         return
//     }
//     this.selectedIndex = -1
// })

HexaLab.UI.mesh.source.on("click", function () {
    if (HexaLab.UI.mesh.source.select_click_flag) {
        HexaLab.UI.mesh.source.select_click_flag = 0
        return
    }
    this.selectedIndex = -1
})

HexaLab.UI.mesh.source.on("change", function () {
    HexaLab.UI.mesh.source.css('font-style', 'normal')
    
    HexaLab.UI.mesh.source.select_click_flag = 1

    var v = this.options[this.selectedIndex].value
    if (v == "-1") {
        // HexaLab.UI.mesh.source.select_focus_file_flag = 1
        HexaLab.UI.clear_mesh_info()
        if (HexaLab.UI.view_source == 1) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(HexaLab.UI.mesh_long_name))
        HexaLab.FS.trigger_file_picker(HexaLab.UI.import_local_mesh)
    } else {
        HexaLab.UI.clear_mesh_info()
        HexaLab.UI.setup_dataset_content()
    }
})

HexaLab.UI.mesh.dataset_content.on("click", function () {
    // TODO Do we want this?
    // if (HexaLab.UI.mesh.dataset_content.select_click_flag) {
    //     HexaLab.UI.mesh.dataset_content.select_click_flag = 0
    // }
    // this.selectedIndex = -1
})

HexaLab.UI.mesh.dataset_content.on("change", function () {
    HexaLab.UI.mesh.dataset_content.select_click_flag = 1
    var v = this.options[this.selectedIndex].value
    var i = parseInt(v)
    var j = parseInt(HexaLab.UI.mesh.source[0].options[HexaLab.UI.mesh.source[0].selectedIndex].value)
    var source = HexaLab.UI.datasets_index.sources[j]
    var mesh = source.data[i]

    HexaLab.UI.import_remote_mesh(source, mesh)
})

// --------------------------------------------------------------------------------
// Drag n Drop logic
// --------------------------------------------------------------------------------
HexaLab.UI.canvas_container.on('dragbetterenter', function (event) {
    HexaLab.UI.dragdrop.overlay.show();
})
HexaLab.UI.canvas_container.on('dragover', function (event) {
    event.preventDefault();
})
HexaLab.UI.canvas_container.on('drop', function (event) {
    event.preventDefault();
})
HexaLab.UI.canvas_container.on('dragbetterleave', function (event) {
    if (!HexaLab.UI.first_mesh) HexaLab.UI.dragdrop.overlay.hide();
})

HexaLab.UI.dragdrop.mesh.on('dragbetterenter', function (event) {
    $(this).removeClass('drag_drop_quad_off').addClass('drag_drop_quad_on');
})
HexaLab.UI.dragdrop.mesh.on('dragover', function (event) {
    event.preventDefault()
})
HexaLab.UI.dragdrop.mesh.on('drop', function (event) {
    event.preventDefault()
    var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files
    HexaLab.UI.import_local_mesh(files[0])
})
HexaLab.UI.dragdrop.mesh.on('dragbetterleave', function (event) {
    $(this).removeClass('drag_drop_quad_on').addClass('drag_drop_quad_off');
})

HexaLab.UI.dragdrop.settings.on('dragbetterenter', function (event) {
    $(this).removeClass('drag_drop_quad_off').addClass('drag_drop_quad_on');
})
HexaLab.UI.dragdrop.settings.on('dragover', function (event) {
    event.preventDefault()
})
HexaLab.UI.dragdrop.settings.on('drop', function (event) {
    event.preventDefault()
    var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files
    HexaLab.UI.import_settings(files[0])
})
HexaLab.UI.dragdrop.settings.on('dragbetterleave', function (event) {
    $(this).removeClass('drag_drop_quad_on').addClass('drag_drop_quad_off');
})

// --------------------------------------------------------------------------------
// Plot
// --------------------------------------------------------------------------------

HexaLab.UI.quality_plot_dialog = $('<div></div>')

HexaLab.UI.quality_plot_update = function () {
    if (HexaLab.UI.plot_overlay) {
        var axis = HexaLab.UI.plot_overlay.axis
        HexaLab.UI.quality_plot(HexaLab.UI.plot_overlay, axis)
    }
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}

HexaLab.UI.quality_plot = function(container, axis) {
    if (HexaLab.UI.settings.color.quality_map_name == 'Parula') {
        HexaLab.UI.settings.color.quality_map_bar_filename = axis == 'x' ? 'img/parula-h.png' : 'img/parula-v.png'
    } else if (HexaLab.UI.settings.color.quality_map_name == 'Jet') {
        HexaLab.UI.settings.color.quality_map_bar_filename = axis == 'x' ? 'img/jet-h.png' : 'img/jet-v.png'
    } else if (HexaLab.UI.settings.color.quality_map_name == 'RedBlue') {
        HexaLab.UI.settings.color.quality_map_bar_filename = axis ==  'x' ? 'img/redblue-h.png' : 'img/redblue-v.png'
    }
    if (axis == 'x') {
        container.find('#bar_img').attr('src', HexaLab.UI.settings.color.quality_map_bar_filename).
            height('16px')
            .width(container.width() - 60 - 30)
            .css('padding', '5px')
            .css('padding-left', '60px')
        container.find("#plot_div")
            .height(container.height() - 16 - 10)
            .width(container.width())
        container.find("#plot_container")[0].style.flexDirection = "column-reverse"//.css('flex-direction', 'column-reverse;')
    } else {
        container.find('#bar_img').attr('src', HexaLab.UI.settings.color.quality_map_bar_filename).
            height(container.height() - 30 - 50)
            .width('16px')
            .css('padding', '5px')
            .css('padding-top', '30px')
        container.find("#plot_div").height(container.height()).width(container.width() - 16 - 10)
        container.find("#plot_container")[0].style.flexDirection = "row"
    }

    // https://community.plot.ly/t/using-colorscale-with-histograms/150
    let data = []
    let bins_colors = []
    let colorscale = []

    let range_min = HexaLab.app.backend.get_lower_quality_range_bound()
    let range_max = HexaLab.app.backend.get_upper_quality_range_bound()
    let reversed = false

    let min = range_min < range_max ? range_min : range_max 
    let max = range_min < range_max ? range_max : range_min 

    let quality = HexaLab.app.backend.get_hexa_quality()
    if (quality != null) {
        let t = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size())
        for (let i = 0; i < quality.size() ; i++) {
            data[i] = t[i]
        }
    }

    // problem: plotly does not map the color to the range, it maps the color to the bins.
    //          the first color is given to the first non-empty bin, the others follow.
    //          following non-empty bins are correctly counted and their color is skipped.
    // solution: skip the first n color ticks, where n is the number of empty bins at the start.
    let mesh = HexaLab.app.backend.get_mesh()
    let bins = 100
    let bin_size = (max - min) / bins
    let base = Math.trunc((mesh.quality_min - min) / bin_size)
    for (let i = base; i < bins ; i++) {
        bins_colors[i - base] = 100 - i
    }

    for (let i = 0; i <= 10; ++i) {
        let v = i / 10
        let v2 = range_min < range_max ? 1 - v : v
        let rgb = HexaLab.app.backend.map_value_to_color(v2)
        let r = (rgb.x() * 255).toFixed(0)
        let g = (rgb.y() * 255).toFixed(0)
        let b = (rgb.z() * 255).toFixed(0)
        colorscale[i] = [v.toString(), 'rgb(' + r + ',' + g + ',' + b + ')']
    }

    var plot_data = [{
        type:       'histogram',
        histfunc:   'count',
        histnorm:   'probability',
        cauto:      false,
        autobinx:   false,
        //nbinsx: 100,
        marker: {
            // showscale: true,
            cmin:   0,
            cmax:   bins - 1,
            color:  bins_colors,
            colorscale: colorscale,
            // colorbar: {
            //     thickness: 15,
            //     showticklabels: false,
            //     // xanchor: "right",
            //     // x: -1.3,
            //     len: 1,
            //     //lenmode: "pixels",
            // }
        },
    }]
    plot_data[0][axis] = data
    plot_data[0][axis.concat('bins')] = {
        start:  min,
        end:    max,
        size:   bin_size
    }

    var plot_layout = {
        paper_bgcolor: 'rgba(255, 255, 255, 0.2)',
        plot_bgcolor:  'rgba(255, 255, 255, 0.2)',
        autosize:       true,
        margin: {
            l:  60,
            r:  30,
            b:  50,
            t:  30,
            pad: 4
        },
    }
    plot_layout[axis.concat('axis')] = {
        autorange:  false,
        range:      [range_max, range_min],
        type:       'linear',
        ticks:      'outside',
        tick0:      0,
        dtick:      (range_max - range_min) / 8, //0.25,
        ticklen:    2,
        tickwidth:  2,
        tickcolor:  '#444444'
    }

    var plot_config = {
        modeBarButtons: [
            [{
                name: 'Flip',
                icon: Plotly.Icons['3d_rotate'],
                click: function() {
                    if (axis == 'x') {
                        HexaLab.UI.quality_plot(container, 'y')
                    } else if (axis == 'y') {
                        HexaLab.UI.quality_plot(container, 'x')
                    }
                }
            }],
            [{
                name: 'Save',
                icon: Plotly.Icons['camera'],
                click: function() {
                    plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 1)'
                    plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 1)'
                    Plotly.newPlot($("<div></div>")[0], {
                        data: plot_data,
                        layout: plot_layout,
                        config: plot_config
                    })
                    Plotly.toImage(container.find('#plot_div')[0], {
                        format: 'png', 
                        width: container.find('#plot_div').width(), 
                        height: container.find('#plot_div').height(),
                    }).then(function(data) {
                        let canvas_width, canvas_height
                        if (axis == 'x') {
                            canvas_width  = container.find('#plot_div').width()
                            canvas_height = container.find('#plot_div').height() + 16 + 10
                        } else {
                            canvas_width  = container.find('#plot_div').width()  + 16 + 10
                            canvas_height = container.find('#plot_div').height()
                        }
                        let c = $('<canvas width="' + canvas_width
                                     + '" height="' + canvas_height
                                     + '"></canvas>')[0]
                        let ctx = c.getContext("2d")
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, canvas_width, canvas_height);

                        let plot_img = new Image()
                        let bar_img  = new Image()
                        
                        plot_img.src = data
                        plot_img.onload = function() {
                            bar_img.src = HexaLab.UI.settings.color.quality_map_bar_filename
                            bar_img.onload = function() {
                                if (axis == 'x') {
                                    ctx.drawImage(plot_img, 0, 0)
                                    ctx.drawImage(bar_img, 60, canvas_height - 16 - 5, canvas_width - 60 - 30, 16)
                                } else {
                                    ctx.drawImage(bar_img, 5, 30, 16, canvas_height - 30 - 50)
                                    ctx.drawImage(plot_img, 5 + 16, 0)
                                }
                                let img = c.toDataURL("image/png")
                                saveAs(dataURItoBlob(img), "HLplot.png")
                            }
                        }
                    })
                    plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 0.2)'
                    plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 0.2)'
                    Plotly.newPlot(container.find('#plot_div')[0], {
                        data: plot_data,
                        layout: plot_layout,
                        config: plot_config
                    })
                }
            }]
        ],
        displaylogo: false,
        displayModeBar: true
    }

    container.axis = axis

    Plotly.newPlot(container.find('#plot_div')[0], {
        data: plot_data,
        layout: plot_layout,
        config: plot_config
    });
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
    HexaLab.UI.menu_resize_time = new Date()
    const delta = 200
    function on_resize_end () {
        if (new Date() - HexaLab.UI.menu_resize_time < delta) {
            setTimeout(on_resize_end, delta)
        } else {
            HexaLab.UI.menu_resize_timeout = false
            if (HexaLab.UI.plot_overlay) {
                // TODO move?
                // HexaLab.UI.plot_overlay.remove()
                // delete HexaLab.UI.plot_overlay
                // HexaLab.UI.create_plot_panel()
            }
        }  
    }
    if (!HexaLab.UI.menu_resize_timeout) {
        HexaLab.UI.menu_resize_timeout = true
        setTimeout(on_resize_end, delta)
    }

    var width = HexaLab.UI.display.width() - HexaLab.UI.menu.width()
    HexaLab.UI.canvas_container.css('margin-left', HexaLab.UI.menu.width())
    HexaLab.UI.canvas_container.width(width)
    HexaLab.app.resize()

    $('#mesh_info_2').css('left', (HexaLab.UI.menu.width() + 10).toString().concat('px'))
})

// --------------------------------------------------------------------------------
// Top bar
// --------------------------------------------------------------------------------

HexaLab.UI.topbar.load_mesh.on('click', function () {
    HexaLab.UI.mesh.source.val('-1')
    if (HexaLab.UI.view_source == 1) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(HexaLab.UI.mesh_long_name))
    HexaLab.FS.trigger_file_picker(HexaLab.UI.import_local_mesh)
})

HexaLab.UI.topbar.reset_camera.on('click', function () {
    HexaLab.app.set_camera_settings(HexaLab.app.default_camera_settings)
}).prop("disabled", true);

HexaLab.UI.create_plot_panel = function () {
    var size = HexaLab.app.get_canvas_size()
    var x = HexaLab.UI.menu.width()
    var y = 0
    var width = size.width / 4
    var height = size.height - 2
    HexaLab.UI.plot_overlay = HexaLab.UI.overlay(x, y, width, height,
        '<div id="plot_container" style="display:flex;"><div id="bar_div"><img id="bar_img" /></div><div id="plot_div"></div></div>').appendTo(document.body)
    HexaLab.UI.quality_plot(HexaLab.UI.plot_overlay, 'y')
    HexaLab.UI.plot_overlay.on('resize', function () {
        HexaLab.UI.quality_plot_update()
    })
}

// window.addEventListener('resize', function () {
//     if (HexaLab.UI.plot_overlay) {
//         HexaLab.UI.plot_overlay.remove()
//         delete HexaLab.UI.plot_overlay
//         HexaLab.UI.create_plot_panel()
//     }
// })

HexaLab.UI.topbar.plot.on('click', function () {
    if (HexaLab.UI.plot_overlay) {
        HexaLab.UI.plot_overlay.remove()
        delete HexaLab.UI.plot_overlay
    } else {
        HexaLab.UI.create_plot_panel()
    }
}).prop("disabled", true);

HexaLab.UI.topbar.load_settings.on('click', function () {
    HexaLab.FS.trigger_file_picker(HexaLab.UI.import_settings)
}).prop("disabled", true);

HexaLab.UI.topbar.save_settings.on('click', function () {
    const settings = JSON.stringify(HexaLab.app.get_settings(), null, 4)
    const blob = new Blob([settings], { type: "text/plain;charset=utf-8" })
    HexaLab.FS.store_blob(blob, "HLsettings.txt")
}).prop("disabled", true);

HexaLab.UI.topbar.github.on('click', function () {
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
            'border: 1px solid rgba(64, 64, 64, .25);',
            ' ">', content, ' </div>'
        ].join(''))
    return x.resizable().draggable({
        cursor: "move"
    });
}

HexaLab.UI.topbar.about.on('click', function () {
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

HexaLab.UI.topbar.snapshot.on('click', function () {
    HexaLab.app.canvas.element.toBlob(function (blob) {
        saveAs(blob, "HLsnapshot.png");
    }, "image/png");
}).prop("disabled", true);
