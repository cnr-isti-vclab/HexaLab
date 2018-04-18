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
    file_reader: new FileReader(),
    first_mesh: true,

    // --------------------------------------------------------------------------------
    // DOM page bindings
    // --------------------------------------------------------------------------------
    frame: $('#frame'),

    menu: $('#GUI'),

    display: $('#display'),

    dragdrop_overlay: $('#drag_drop_overlay'),
    dragdrop_header: $('#drag_drop_header'),
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
    surface_color_source: $('#surface_color_source'),
    surface_color: $('#surface_color'),
    color_map: $('#color_map'),
    filtered_opacity: $('#filtered_slider'),
    wireframe_opacity: $('#wireframe_slider'),
    quality: $("#show_quality"),
    occlusion: $("#show_occlusion"),
    singularity_mode: $('#singularity_slider'),
    visible_outside_color: $('#visible_outside_color'),
    visible_inside_color: $('#visible_inside_color'),
    visible_color_wrapper: $('#visible_color_wrapper'),

    // Mesh sources
    datasets_index: {},

    // Mesh quality TODO move this somewhere
    quality_type: $('#quality_type')
}

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

$('#mesh_info_2').css('left', (HexaLab.UI.menu.width() + 10).toString().concat('px'))

// HexaLab.UI.quality_type_html = '<div class="menu_row"><div class="menu_row_label" style="font-weight:bold;">Quality measure</div>\
// <div class="menu_row_input">\
//     <div class="menu_row_input_block">\
//         <select id="quality_type" title="Choose Hex Quality measure">\
//             <option value="Scaled Jacobian">Scaled Jacobian</option>\
//             <option value="Diagonal Ratio">Diagonal Ratio</option>\
//             <option value="Edge Ratio">Edge Ratio</option>\
//         </select>\
//     </div>\
// </div></div>'

// --------------------------------------------------------------------------------
// Rendering options
// --------------------------------------------------------------------------------
HexaLab.UI.surface_color_source.on("change", function () {
    var value = this.options[this.selectedIndex].value
    if (value == "Default") {
        HexaLab.app.show_visible_quality(false)
    } else if (value == "ColorMap") {
        HexaLab.app.show_visible_quality(true)
    }
})

HexaLab.UI.visible_outside_color.spectrum({
    cancelText: ''
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_outside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.on_set_visible_surface_default_outside_color = function (color) {
    HexaLab.UI.visible_outside_color.spectrum('set', color)
}

HexaLab.UI.visible_inside_color.spectrum({
    cancelText: ''
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_inside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.on_set_visible_surface_default_inside_color = function (color) {
    HexaLab.UI.visible_inside_color.spectrum('set', color)
}

HexaLab.UI.on_show_visible_quality = function (do_show) {
    if (do_show) {
        $("#surface_colormap_input").css('display', 'flex');
        HexaLab.UI.visible_color_wrapper.hide();
        HexaLab.UI.surface_color_source.val("ColorMap")
    } else {
        $("#surface_colormap_input").hide();
        HexaLab.UI.visible_color_wrapper.css('display', 'flex');
        HexaLab.UI.surface_color_source.val("Default")
    }
}

HexaLab.UI.filtered_opacity.slider().on('slide', function (e, ui) {
    HexaLab.app.set_filtered_surface_opacity(ui.value / 100)
})

HexaLab.UI.on_set_filtered_surface_opacity = function (value) {
    HexaLab.UI.filtered_opacity.slider('value', value * 100)
}

HexaLab.UI.wireframe_opacity.slider().on('slide', function (e, ui) {
    HexaLab.app.set_visible_wireframe_opacity(ui.value / 100)
})

HexaLab.UI.on_set_wireframe_opacity = function (value) {
    HexaLab.UI.wireframe_opacity.slider('value', value * 100)
}

HexaLab.UI.singularity_mode.slider({
    value: 0,
    min: 0,
    max: 4,
    step: 1
}).on('slide', function (e, ui) {
    HexaLab.app.set_singularity_mode(ui.value)
})

HexaLab.UI.on_set_singularity_mode = function (mode) {
    HexaLab.UI.singularity_mode.slider('value', mode)
}

HexaLab.UI.occlusion.on('click', function () {
    HexaLab.app.set_occlusion(this.checked ? 'object space' : 'none')
})

HexaLab.UI.on_set_occlusion = function (ao) {
    HexaLab.UI.occlusion.prop('checked', ao == 'object space')
}

HexaLab.UI.color_map.on('change', function () {
    HexaLab.app.set_color_map(this.options[this.selectedIndex].value)
})

HexaLab.UI.on_set_color_map = function (value) {
    HexaLab.UI.color_map.val(value)
    HexaLab.UI.quality_plot_update()
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
HexaLab.UI.on_first_mesh = function () {
    HexaLab.UI.dragdrop_header.html('Drag&Drop mesh or settings files<br/>in the boxes below.')
    HexaLab.UI.dragdrop_overlay.removeClass('first_drag_drop').hide();
    HexaLab.UI.dragdrop_mesh.css('margin-left', '20%');
    HexaLab.UI.dragdrop_settings.show();
}

HexaLab.UI.clean_mesh_info = function () {
    HexaLab.UI.mesh_info_1.hide();
    HexaLab.UI.mesh_info_2.hide()
    HexaLab.UI.paper_mesh_picker.hide()
}

HexaLab.UI.import_mesh = function (byte_array, long_name, ui_callback) {
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

HexaLab.UI.import_local_mesh = function (file) {
    HexaLab.UI.file_reader.onload = function () {
        var data = new Int8Array(this.result)
        HexaLab.UI.import_mesh(data, file.name)
    }
    HexaLab.UI.view_source =  HexaLab.UI.mesh_source[0].selectedIndex
    HexaLab.UI.view_mesh = null
    HexaLab.UI.clean_mesh_info()
    HexaLab.UI.mesh_info_2.show().css('display', 'flex');
    HexaLab.UI.mesh_info_2_text.empty().append('<span>Loading...</span>').show()
    HexaLab.UI.file_reader.readAsArrayBuffer(file, "UTF-8")
}

HexaLab.UI.import_remote_mesh = function (source, name) {
    var request = new XMLHttpRequest();
    request.open('GET', 'datasets/' + source.path + '/' + name, true);
    request.responseType = 'arraybuffer';
    request.onload = function(e) {
        var data = new Uint8Array(this.response)
        HexaLab.UI.import_mesh(data, name)
        HexaLab.UI.setup_paper_mesh_picker()
    }
    request.send();

    HexaLab.UI.clean_mesh_info()
    $.each(HexaLab.UI.mesh_source[0].options, function() {
        if ($(this).text() == source.text) $(this).prop('selected', true);
    })
    HexaLab.UI.view_source =  HexaLab.UI.mesh_source[0].selectedIndex
    HexaLab.UI.view_mesh = HexaLab.UI.paper_mesh_picker[0].selectedIndex
    HexaLab.UI.mesh_info_2_text.text('Loading...')
    HexaLab.UI.paper_mesh_picker.css('font-style', 'normal').show()
    HexaLab.UI.mesh_info_2.show().css('display', 'flex');
}

HexaLab.UI.setup_mesh_stats = function() {
    var mesh = HexaLab.app.backend.get_mesh()
    HexaLab.UI.mesh_info_2.show()
    HexaLab.UI.mesh_info_2_text.empty()
    HexaLab.UI.mesh_info_2_text.append('<div class="menu_row"><div class="menu_row_label" style="font-weight:bold;line-height:100%;padding-bottom:10px;">Geometry</div></div>')
    HexaLab.UI.mesh_info_2_text.append('<div id="mesh_stats_wrapper">' +
        '<div><span class="mesh_stat">vertices: </span>' + mesh.vert_count + '</div>' +
        '<div><span class="mesh_stat">hexas:    </span>' + mesh.hexa_count + '</div>' +
        '</div>'
    )
    HexaLab.UI.mesh_info_2_text.append('<div class="menu_row"><div class="menu_row_label" style="font-weight:bold;">Quality</div>\
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
    HexaLab.UI.mesh_info_2_text.append('<div id="mesh_stats_wrapper">' +
        '<div><span class="mesh_stat">min: </span>' + mesh.quality_min.toFixed(3) + '</div>' +
        '<div><span class="mesh_stat">max: </span>' + mesh.quality_max.toFixed(3) + '</div>' +
        '<div><span class="mesh_stat">avg: </span>' + mesh.quality_avg.toFixed(3) + '</div>' +
        '<div><span class="mesh_stat">var: </span>' + mesh.quality_var.toFixed(3) + '</div>' +
        '</div>'
    )
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

HexaLab.UI.on_import_mesh = function (name) {
    HexaLab.UI.reset_camera.prop("disabled", false)
    HexaLab.UI.plot.prop("disabled", false)
    HexaLab.UI.load_settings.prop("disabled", false)
    HexaLab.UI.save_settings.prop("disabled", false)
    HexaLab.UI.snapshot.prop("disabled", false)
    if (HexaLab.UI.view_source == 2) HexaLab.UI.setup_paper_mesh_picker()
    HexaLab.UI.setup_mesh_stats(name)
    HexaLab.UI.quality_plot_update()
}

HexaLab.UI.on_import_mesh_fail = function (name) {
    HexaLab.UI.reset_camera.prop("disabled", true)
    HexaLab.UI.plot.prop("disabled", true)
    HexaLab.UI.load_settings.prop("disabled", true)
    HexaLab.UI.save_settings.prop("disabled", true)
    HexaLab.UI.snapshot.prop("disabled", true)
    HexaLab.UI.mesh_info_2_text.empty().append('<span>Can\'t parse the file.</span>')
    HexaLab.UI.view_source = null
    HexaLab.UI.view_mesh = null
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

HexaLab.UI.setup_paper_mesh_picker = function () {
    var v = HexaLab.UI.mesh_source[0].options[HexaLab.UI.mesh_source[0].selectedIndex].value
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

    HexaLab.UI.paper_mesh_picker.empty()
    if (HexaLab.UI.view_mesh == null) HexaLab.UI.paper_mesh_picker.css('font-style', 'italic')
    HexaLab.UI.paper_mesh_picker.append($('<option>', {
            value: "-1",
            text : 'Select a mesh',
            style: 'display:none;'
        }));
    $.each(source.data, function (i, name) {
        var s = HexaLab.UI.view_source == HexaLab.UI.mesh_source[0].selectedIndex && HexaLab.UI.view_mesh - 1 == i ? true : false
        if (s) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(name))
        HexaLab.UI.paper_mesh_picker.append($('<option>', {
            value: i,
            text : name,
            style: 'font-style: normal;',
            selected: s
        }));
    });

    HexaLab.UI.paper_mesh_picker.show()
}

HexaLab.UI.mesh_source.on("change", function () {
    HexaLab.UI.mesh_source.css('font-style', 'normal')

    var v = this.options[this.selectedIndex].value
    if (v == "-1") {
        HexaLab.UI.clean_mesh_info()
        if (HexaLab.UI.view_source == 1) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(HexaLab.UI.mesh_long_name))
        HexaLab.UI.mesh_local_load_trigger()
    } else {
        HexaLab.UI.clean_mesh_info()
        HexaLab.UI.setup_paper_mesh_picker()
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
    if (!HexaLab.UI.first_mesh) HexaLab.UI.dragdrop_overlay.hide();
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
    var data = []
    var bins_colors = []  // bin i takes the color that comes remapping bins_colors[i] from cmin-cmax to colormap 0-1
    var colorscale = []

    var quality = HexaLab.app.backend.get_normalized_hexa_quality()
    if (quality != null) {
        var t = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size())
        for (var i = 0; i < quality.size() ; i++) {
            data[i] = t[i]
        }
    }

    var mesh = HexaLab.app.backend.get_mesh()
    var bins = 100
    var base = Math.trunc(mesh.normalized_quality_min * bins)
    for (var i = base; i < bins ; i++) {
        bins_colors[i - base] = i
    }

    for (var i = 0; i <= 10; ++i) {
        var v = i / 10
        var rgb = HexaLab.app.backend.map_value_to_color(v)
        var r = (rgb.x() * 255).toFixed(0)
        var g = (rgb.y() * 255).toFixed(0)
        var b = (rgb.z() * 255).toFixed(0)
        colorscale[i] = [v.toString(), 'rgb(' + r + ',' + g + ',' + b + ')']
    }

    var plot_data = [{
        type: 'histogram',
        histfunc: 'count',
        histnorm: 'probability',
        cauto: false,
        autobinx: false,
        //nbinsx: 100,
        marker: {
            showscale: true,
            cmin: 0,
            cmax: bins - 1,
            color: bins_colors,
            colorscale: colorscale,
            colorbar: {
                thickness: 15,
                showticklabels: false,
                // xanchor: "right",
                // x: -1.3,
                len: 1.03,
                //lenmode: "pixels",
            }
        },
    }]
    plot_data[0][axis] = data
    plot_data[0][axis.concat('bins')] = {
        start: 0,
        end: 1,
        size: 0.01
    }

    var plot_layout = {
        paper_bgcolor: 'rgba(255, 255, 255, 0.2)',
        plot_bgcolor:  'rgba(255, 255, 255, 0.2)',
        autosize: true,
        margin: {
            l: 50,
            r: 10,
            b: 50,
            t: 30,
            pad: 4
        },
    }
    plot_layout[axis.concat('axis')] = {
        autorange: false,
        range: [0, 1],
        type: 'linear',
        ticks:'outside',
        tick0:0,
        dtick:0.25,
        ticklen:2,
        tickwidth:2,
        tickcolor:'#444444'
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
                    Plotly.toImage(container, {
                        format: 'png', 
                        width: 800, 
                        height: 600,
                    }).then(function(_) {
                        // window.open(blob, '_blank');
                        plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 1)'
                        plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 1)'
                        Plotly.newPlot(null, {
                            data: plot_data,
                            layout: plot_layout,
                            config: plot_config
                        })
                        Plotly.toImage(container, {
                            format: 'png', 
                            width: 800, 
                            height: 600,
                        }).then(function(data) {
                            saveAs(dataURItoBlob(data), "HLplot.png")
                        })
                        plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 0.2)'
                        plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 0.2)'
                        Plotly.newPlot(container, {
                            data: plot_data,
                            layout: plot_layout,
                            config: plot_config
                        })
                    })
                }
            }]
        ],
        displaylogo: false,
        displayModeBar: true
    }

    container.axis = axis

    Plotly.newPlot(container, {
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
                HexaLab.UI.plot_overlay.remove()
                delete HexaLab.UI.plot_overlay
                HexaLab.UI.create_plot_panel()
            }
        }  
    }
    if (!HexaLab.UI.menu_resize_timeout) {
        HexaLab.UI.menu_resize_timeout = true
        setTimeout(on_resize_end, delta)
    }

    var width = HexaLab.UI.display.width() - HexaLab.UI.menu.width()
    HexaLab.UI.frame.css('margin-left', HexaLab.UI.menu.width())
    HexaLab.UI.frame.width(width)
    HexaLab.app.resize()

    $('#mesh_info_2').css('left', (HexaLab.UI.menu.width() + 10).toString().concat('px'))
})

// --------------------------------------------------------------------------------
// Toolbar
// --------------------------------------------------------------------------------

HexaLab.UI.load_mesh.on('click', function () {
    HexaLab.UI.mesh_source.val('-1')
    HexaLab.UI.clean_mesh_info()
    if (HexaLab.UI.view_source == 1) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(HexaLab.UI.mesh_long_name))
    HexaLab.UI.mesh_local_load_trigger()
})

HexaLab.UI.reset_camera.on('click', function () {
    HexaLab.app.set_camera_settings(HexaLab.app.default_camera_settings)
}).prop("disabled", true);

HexaLab.UI.create_plot_panel = function () {
    var size = HexaLab.app.get_canvas_size()
    var x = HexaLab.UI.menu.width()
    var y = 0
    var width = size.width / 4
    var height = size.height - 2
    HexaLab.UI.plot_overlay = HexaLab.UI.overlay(x, y, width, height, '').appendTo(document.body)
    HexaLab.UI.quality_plot(HexaLab.UI.plot_overlay[0], 'y')
    HexaLab.UI.plot_overlay.on('resize', function () {
        HexaLab.UI.resize_plot()
    })
}

window.addEventListener('resize', function () {
    if (HexaLab.UI.plot_overlay) {
        HexaLab.UI.plot_overlay.remove()
        delete HexaLab.UI.plot_overlay
        HexaLab.UI.create_plot_panel()
    }
})

HexaLab.UI.plot.on('click', function () {
    if (HexaLab.UI.plot_overlay) {
        HexaLab.UI.plot_overlay.remove()
        delete HexaLab.UI.plot_overlay
    } else {
        HexaLab.UI.create_plot_panel()
    }
}).prop("disabled", true);

HexaLab.UI.load_settings.on('click', function () {
    HexaLab.UI.settings_load_trigger();
}).prop("disabled", true);

HexaLab.UI.save_settings.on('click', function () {
    HexaLab.UI.settings_save_trigger();
}).prop("disabled", true);

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
            'border: 1px solid rgba(64, 64, 64, .25);',
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
}).prop("disabled", true);
