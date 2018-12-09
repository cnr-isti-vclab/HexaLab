"use strict";

var HexaLab = {}

// --------------------------------------------------------------------------------
//  ______ _ _       _____           _                 
// |  ____(_) |     / ____|         | |                
// | |__   _| | ___| (___  _   _ ___| |_ ___ _ __ ___  
// |  __| | | |/ _ \\___ \| | | / __| __/ _ \ '_ ` _ \ 
// | |    | | |  __/____) | |_| \__ \ ||  __/ | | | | |
// |_|    |_|_|\___|_____/ \__, |___/\__\___|_| |_| |_|
//                          __/ |                      
//                         |___/                 
// @FileSystem      
// --------------------------------------------------------------------------------
HexaLab.FS = {
        // check if a virtual file has been mapped to the path
    file_exists: function (path) {
        var stat = FS.stat(path);
        if (!stat) return false;
        return FS.isFile(stat.mode);
    },

    // map a byte array to a virtual file
    make_file: function (data, name) {
        // remove (overwrite) the file if already existing
        try {
            if (HexaLab.FS.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
        // create the file
        FS.createDataFile("/", name, data, true, true);
    },
    
    // delete a virtual file
    delete_file: function (name) {
        try {
            if (HexaLab.FS.file_exists("/" + name)) {
                FS.unlink('/' + name);
            }
        } catch (err) {
        }
    },
    
    // parse the file path and return the last token (the file name) TODO rename to get_path_file_name
    short_path: function(path) {
        if (path.includes("/")) {
            return path.substring(path.lastIndexOf('/') + 1);
        }
        return path
    },

    // HTML element that when triggered pops the file picker system UI to pick a file path from the actual physical drive
    element: $('<input type="file">'),
    
    // pop the UI, send the file object picked to the callback (the file object is metadata)
    trigger_file_picker: function (callback) {
		// TODO: accept element.setAttribute("accept",fileType);
		// TODO: set 'title' as the title of File-selector dialog (instead of "Open")
        this.element.val(null).off('change').change(function () {
            callback(this.files[0])
        })
        this.element.click()
    },

    // save a blob (a byte array object) to the physical drive
    store_blob: function (blob, filename) {
        saveAs(blob, filename)
    },

    // Javascript object to read a file from the physical drive
    reader: new FileReader(),
	
    // read file metadata (same thing that trigger_file_picker passes to the callback) from physical drive using the file reader and callback passing the filename and the content
    read_json: function (file, callback) {
        this.reader.onload = function () {
            const json = JSON.parse(this.result)
            callback(file.name, json)
        }
        this.reader.readAsText(file, "UTF-8")
    },
    read_file: function (file, callback) {
        this.reader.onloadend = function () {
            const data = new Int8Array(this.result)
            callback(file.name, data)
			HexaLab.UI.mesh.infobox_2.element.css('background-size', '0% 100%');
        }
		this.reader.onprogress = function(event) {
			if (event.lengthComputable) {
				HexaLab.UI.set_progress_percent(100 * event.loaded / event.total);
			}
		}		
        this.reader.readAsArrayBuffer(file, "UTF-8")
    },

    get_path_file_extension: function (path) {
        let filename = HexaLab.FS.short_path(path)
        let ext = path.substring(path.lastIndexOf('.') + 1)
        return ext
    }
}
// --------------------------------------------------------------------------------
//  _    _ _____ 
// | |  | |_   _|
// | |  | | | |  
// | |  | | | |  
// | |__| |_| |_ 
//  \____/|_____|
// @UI
// --------------------------------------------------------------------------------
// bunch of references to the html ui elements
// --------------------------------------------------------------------------------
HexaLab.UI = {
    // To enable additional event trigger when the first mesh gets loaded in (clean up the page, ...)
    first_mesh: true,

    // body content
    display:                $('body'),
    // canvas container
    canvas_container:       $('#frame'),
    // side menu
    menu:                   $('#GUI'),
	quality_label:          $('quality_label'),

    dragdrop: {
        overlay:            $('#drag_drop_overlay'),
        header:             $('#drag_drop_header'),
        mesh:               $('#mesh_drag_drop_quad'),
        settings:           $('#settings_drag_drop_quad'),
    },

    // Mesh dialog
    mesh: {
        // mesh source dropdown list (local, dataset1, dataset2, ...)
        source:             $('#mesh_source'),
        // mesh dropdown list (mesh1, mesh2, ...)
        dataset_content:    $('#paper_mesh_picker'),

        // when mesh source is a paper, it contains the paper info
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
        // contains selected mesh stats, metadata, ...
        infobox_2: {
            element:        $('#mesh_info_2'),
            text:           $('#mesh_info_2 .box_text'),
        },
        // mesh stats quality measure dropdown list
        quality_type: {
            element:        null,
            listeners:      [],
        },
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
        process_pack:       $('#process_pack'),

        on_mesh_import: function () {
            this.reset_camera.prop("disabled", false)
            this.plot.prop("disabled", false)
            this.load_settings.prop("disabled", false)
            this.save_settings.prop("disabled", false)
            this.snapshot.prop("disabled", false)
            HexaLab.UI.settings.rendering_menu_content.prop('disabled', false)
            HexaLab.UI.settings.silhouette.slider('enable')    
            HexaLab.UI.settings.erode_dilate.slider('enable')    
            HexaLab.UI.settings.singularity_mode.slider('enable')
            HexaLab.UI.settings.wireframe.slider('enable')
            HexaLab.UI.settings.crack_size.slider('enable')
            HexaLab.UI.settings.rounding_radius.slider('enable')
            HexaLab.UI.settings.color.default.outside.spectrum('enable')
            HexaLab.UI.settings.color.default.inside.spectrum('enable')
        },
        on_mesh_import_fail: function () {
            this.reset_camera.prop("disabled", true)
            this.plot.prop("disabled", true)
            this.load_settings.prop("disabled", true)
            this.save_settings.prop("disabled", true)
            this.snapshot.prop("disabled", true)
        },
    },
    
    // Settings
    settings: {
        color: {
            // dropdown list to chose which color to display (custom, quality)
            source:         $('#surface_color_source'),
            // dropdown list to pick the color map to apply on the mesh quality
            // only visible if source is quality
            quality_map:    $('#color_map'),
            // color pickers for the custom mesh color
            // only visible if source is custom
            default: {
                // html/css wrapper div
                wrapper:    $('#visible_color_wrapper'),
                // color picker for mesh 'outside' surfaces
                outside:    $('#visible_outside_color'),
                // color picker for mesh 'inside' surfaces
                inside:     $('#visible_inside_color'),
            }
        },
        // mesh silhouette mode/opacity slider
        silhouette:         $('#filtered_slider'),
        // singularity mode discrete slider (none, lines, ...)
        singularity_mode:   $('#singularity_slider'),
        // --- currently unused ---
        occlusion:          $("#show_occlusion"),
        // geometry mode dropdown list (roundings, cracks, lines, ...)
        geometry_mode:      $('#geometry_mode'),
        // lighting mode dropdown list (OSAB, SSAO, lambert, flat)
        lighting_mode:      $("#lighting_mode"),
        // div containing all the rendering settings
        rendering_menu_content: $('#rendering_menu *'),
        // slider for geometry mode intensity (opacity for lines, size for roundings/cracks)
        wireframe:          $('#wireframe_slider'),
        // --- currently unused ---
        rounding_radius:    $('#rounding_radius'),
        // --- currently unused ---
        crack_size:         $('#crack_size'),
        // erode dilate filter slider
        erode_dilate:       $('#erode_dilate_slider')
    },
    
    // datasets index js file content
    datasets_index: {},
}

// Quality measures dropdown list entries. They never change, might aswell be an actual HTML element?
HexaLab.UI.mesh.quality_type.element = $('<select id="quality_type" title="Choose Hex Quality measure">\
        <option value="ScaledJacobian">Scaled Jacobian</option>\
        <option value="EdgeRatio">Edge Ratio</option>\
        <option value="Diagonal">Diagonal</option>\
        <option value="Distortion">Distortion</option>\
        <option value="Jacobian">Jacobian</option>\
        <option value="MaxEdgeRatio">Max Edge Ratio</option>\
        <option value="MaxAspectFrobenius">Max Aspect Frobenius</option>\
        <option value="MeanAspectFrobenius">Mean Aspect Frobenius</option>\
        <option value="Oddy">Oddy</option>\
        <option value="Relative Size Squared">Relative Size Squared</option>\
        <option value="Shape">Shape</option>\
        <option value="ShapeAndSize">Shape and Size</option>\
        <option value="Shear">Shear</option>\
        <option value="ShearAndSize">Shear and Size</option>\
        <option value="Skew">Skew</option>\
        <option value="Stretch">Stretch</option>\
        <option value="Taper">Taper</option>\
        <option value="Volume">Volume</option>\
    </select>')

// Load the datasets index js file
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
// --------------------------------------------------------------------------------
//   _____      _   _   _                 
//  / ____|    | | | | (_)                
// | (___   ___| |_| |_ _ _ __   __ _ ___ 
//  \___ \ / _ \ __| __| | '_ \ / _` / __|
//  ____) |  __/ |_| |_| | | | | (_| \__ \
// |_____/ \___|\__|\__|_|_| |_|\__, |___/
//                               __/ |    
//                              |___/     
// @Settings
// --------------------------------------------------------------------------------
// User copy-paste event listeners.
// On copy, app settings are copied to the user system clipboard.
// On paste, the app reads and imports settings from the clipboard. 
// --------------------------------------------------------------------------------
document.body.addEventListener('paste', function (e) { 
    var clipboardData, pastedData

    e.stopPropagation()
    e.preventDefault()

    clipboardData = e.clipboardData || window.clipboardData
    pastedData = clipboardData.getData('Text')

    HexaLab.UI.maybe_set_settings(JSON.parse(pastedData))
})
document.body.addEventListener('copy', function (e) { 
    e.clipboardData.setData("text/plain;charset=utf-8", JSON.stringify(HexaLab.app.get_settings(), null, 4))
    e.stopPropagation()
    e.preventDefault()
})

HexaLab.UI.update_cookie = function () {
    if (HexaLab.UI.first_mesh) return
    let settings = {
        rendering: HexaLab.app.get_rendering_settings(),
        materials: HexaLab.app.get_material_settings()
    }
    Cookies.set("HexaLab", settings)
}

// --------------------------------------------------------------------------------
// The following events register to the UI elements and propagate the changes to the HexaLab app
// The HexaLab app upon receiving new settings will often bounce them back again to the UI to make sure it is sync'd with the backend. In this case this is useless but harmless. 
// --------------------------------------------------------------------------------
HexaLab.UI.settings.color.source.on("change", function () {
    var value = this.options[this.selectedIndex].value
    HexaLab.app.show_visible_quality(value == "ColorMap")
})

HexaLab.UI.settings.color.default.outside.spectrum({
    // show the color string in hex format
    preferredFormat: "hex",
    showInput: true,
    // hijack the optional cancel button to reset the color to default
    cancelText: 'reset',
    cancel: function () {
        HexaLab.UI.settings.color.default.outside.spectrum("set", "#ffffff");
        HexaLab.app.set_visible_surface_default_outside_color($(this).spectrum('get').toHexString())
    }
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_outside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.settings.color.default.inside.spectrum({
    // show the color string in hex format
    showInput: true,
    preferredFormat: "hex",
    // hijack the optional cancel button to reset the color to default
    cancelText: 'reset',
    cancel: function () {
        HexaLab.UI.settings.color.default.inside.spectrum("set", "#ffff00");
        HexaLab.app.set_visible_surface_default_inside_color($(this).spectrum('get').toHexString())
    },
}).on('change.spectrum', function (color) {
    HexaLab.app.set_visible_surface_default_inside_color($(this).spectrum('get').toHexString())
})

HexaLab.UI.settings.silhouette.slider({min:0, max:20, step:1}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_silhouette_intensity(ui.value / 20)
})

HexaLab.UI.settings.color.quality_map.on('change', function () {
    HexaLab.app.set_color_map(this.options[this.selectedIndex].value)
})

HexaLab.UI.settings.wireframe.slider({
    min: 0,
    max: 20,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_visible_wireframe_opacity(ui.value / 20)
})

HexaLab.UI.settings.crack_size.slider({
    min: 2,
	value: 6,
    max: 10,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_crack_size(ui.value / 30)
})

HexaLab.UI.settings.rounding_radius.slider({
    min: 2,
	value: 5,
    max: 10,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_rounding_radius(ui.value / 15)
})

HexaLab.UI.settings.erode_dilate.slider({
    value: 0,
    min: 0,
    max: 5,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_erode_dilate_level(ui.value)
})

HexaLab.UI.settings.singularity_mode.slider({
    value: 1,
    min: 0,
    max: 6,
    step: 1
}).addClass('mini-slider').on('slide', function (e, ui) {
    HexaLab.app.set_singularity_mode(ui.value)
})

HexaLab.UI.settings.lighting_mode.on('change', function () {
    HexaLab.app.set_lighting_mode(this.options[this.selectedIndex].value)
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
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_visible_surface_default_inside_color = function (color) {
    HexaLab.UI.settings.color.default.inside.spectrum('set', color)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_show_visible_quality = function (do_show) {
    if (do_show) {
        $("#surface_colormap_input").css('display', 'flex');
        HexaLab.UI.settings.color.default.wrapper.hide();
        HexaLab.UI.settings.color.source.val("ColorMap")
        if (HexaLab.UI.plot_overlay) {
            HexaLab.UI.quality_plot_update()
        } else {
            HexaLab.UI.create_plot_panel()
        }
    } else {
        $("#surface_colormap_input").hide();
        HexaLab.UI.settings.color.default.wrapper.css('display', 'flex');
        HexaLab.UI.settings.color.source.val("Default")
        if (HexaLab.UI.plot_overlay) {
            HexaLab.UI.plot_overlay.remove()
            delete HexaLab.UI.plot_overlay
        }
    }
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_crack_size = function (size) {
    HexaLab.UI.settings.crack_size.slider('value', size * 30)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_rounding_radius = function (rad) {
    HexaLab.UI.settings.rounding_radius.slider('value', rad * 15)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_wireframe_opacity = function (value) {
    HexaLab.UI.settings.wireframe.slider('value', value * 10)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_filtered_surface_opacity = function (value) {
    HexaLab.UI.settings.silhouette.slider('value', value * 20)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_singularity_mode = function (mode) {
    HexaLab.UI.settings.singularity_mode.slider('value', mode)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_lighting_mode = function (v) {
    HexaLab.UI.settings.lighting_mode.val(v)
    //HexaLab.UI.settings.occlusion.prop('checked', ao == 'object space')
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_color_map = function (value) {
    HexaLab.UI.settings.color.quality_map_name = value
    HexaLab.UI.settings.color.quality_map.val(value)
    HexaLab.UI.quality_plot_update()
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_erode_dilate = function (value) {
    HexaLab.UI.settings.erode_dilate.slider('value', value)
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_quality_measure = function (measure) {
    $.each(HexaLab.UI.mesh.quality_type.element[0].options, function(i) {
        if (this.value == measure) {
            $(this).prop('selected', true);
        } else {
            $(this).removeProp('selected');
        }
    })
    HexaLab.UI.view_quality_measure = measure
    if (!HexaLab.UI.is_pack_processing) {
        HexaLab.UI.show_infobox_2()
    }
    HexaLab.UI.quality_plot_update()
    HexaLab.UI.update_cookie()
}

HexaLab.UI.on_set_geometry_mode = function (v) {
    HexaLab.UI.settings.geometry_mode.val(v)
    HexaLab.UI.settings.wireframe.hide()
    HexaLab.UI.settings.crack_size.hide()
    HexaLab.UI.settings.rounding_radius.hide()
    if (v == 'Lines' || v == 'DynamicLines') {
        HexaLab.UI.settings.wireframe.show()
    } else if (v == 'Cracked') {
        HexaLab.UI.settings.crack_size.show()
    } else if (v == 'Smooth') {
        HexaLab.UI.settings.rounding_radius.show()
    }
    HexaLab.UI.update_cookie()
}

// --------------------------------------------------------------------------------
//   _____ _     _        __  __                  
//  / ____(_)   | |      |  \/  |                 
// | (___  _  __| | ___  | \  / | ___ _ __  _   _ 
//  \___ \| |/ _` |/ _ \ | |\/| |/ _ \ '_ \| | | |
//  ____) | | (_| |  __/ | |  | |  __/ | | | |_| |
// |_____/|_|\__,_|\___| |_|  |_|\___|_| |_|\__,_|
// @SideMenu @Menu
// --------------------------------------------------------------------------------
HexaLab.UI.clear_infobox_1 = function () {
    HexaLab.UI.mesh.infobox_1.element.hide()
    HexaLab.UI.mesh.infobox_1.text.empty()
}

HexaLab.UI.clear_infobox_2 = function () {
    HexaLab.UI.mesh.infobox_2.element.hide()
    HexaLab.UI.mesh.infobox_2.text.empty()
}

HexaLab.UI.get_selected_dataset_idx = function () {
    let dataset_id_string = HexaLab.UI.mesh.source[0].options[HexaLab.UI.mesh.source[0].selectedIndex].value
    let dataset_id = parseInt(dataset_id_string)
    // dataset_id is -2 for unselected, -1 for load local, and >=0 for HexaLab datasets.
    // in the latter, the id is also the dataset index in the datasets index js file.
    return dataset_id
}

HexaLab.UI.get_selected_mesh_idx = function () {
    let mesh_idx_string = HexaLab.UI.mesh.dataset_content[0].options[HexaLab.UI.mesh.dataset_content[0].selectedIndex].value
    let mesh_idx = parseInt(mesh_idx_string)
    return mesh_idx
}

HexaLab.UI.get_selected_dataset = function () {
    let dataset_idx = HexaLab.UI.get_selected_dataset_idx()
    if (dataset_idx == null) {
        return null
    }
    return HexaLab.UI.datasets_index.sources[dataset_idx]
}

HexaLab.UI.get_displayed_dataset = function () {
    return HexaLab.UI.displayed_dataset
}

HexaLab.UI.get_displayed_dataset_idx = function () {
    return HexaLab.UI.displayed_dataset_idx
}

HexaLab.UI.set_displayed_dataset_idx = function (idx) {
    HexaLab.UI.displayed_dataset_idx = idx
    if (idx < 0) {
        HexaLab.UI.set_displayed_mesh_idx(HexaLab.UI.MESH_IDX_CUSTOM)
    } else {
        HexaLab.UI.displayed_dataset = HexaLab.UI.datasets_index.sources[idx]        
    }
}

HexaLab.UI.set_displayed_mesh_idx = function (idx) {
    HexaLab.UI.displayed_mesh_idx = idx
}

HexaLab.UI.get_selected_quality_measure_name = function () {
    return HexaLab.UI.selected_quality_measure_name
}

HexaLab.UI.show_infobox_1 = function () {
    let dataset = HexaLab.UI.get_selected_dataset()
    let infobox = HexaLab.UI.mesh.infobox_1

    infobox.text.empty().append('<span class="paper-title">' + dataset.paper.title + '</span>' + '<br />' +
        '<span class="paper-authors">' + dataset.paper.authors + '</span>' + ' - ' +
        '<span class="paper-venue">' + dataset.paper.venue + ' (' + dataset.paper.year + ') ' + '</span>')
    infobox.element.show().css('display', 'flex');
    infobox.buttons.container.show().css('display', 'flex');

    if (dataset.paper.PDF) {
        infobox.buttons.pdf.removeClass('inactive').off('click').on('click', function() { window.open(dataset.paper.PDF) })
    } else {
        infobox.buttons.pdf.addClass('inactive')
    }

    if (dataset.paper.web) {
        infobox.buttons.web.removeClass('inactive').off('click').on('click', function() { window.open(dataset.paper.web) })
    } else {
        infobox.buttons.web.addClass('inactive')
    }

    if (dataset.paper.DOI) {
        infobox.buttons.doi.removeClass('inactive').off('click').on('click', function() { window.open('http://doi.org/' + dataset.paper.DOI) })
    } else {
        infobox.buttons.doi.addClass('inactive')
    }
}

HexaLab.UI.get_displayed_mesh_idx = function () {
    return HexaLab.UI.displayed_mesh_idx
}

HexaLab.UI.show_mesh_dropdown_list = function () {
    let selected_dataset = HexaLab.UI.get_selected_dataset()
    let displayed_dataset = HexaLab.UI.get_displayed_dataset()
    let mesh_list = HexaLab.UI.mesh.dataset_content
    let displayed_mesh_idx = HexaLab.UI.get_displayed_mesh_idx()

    mesh_list.empty()
    if (displayed_mesh_idx == null) {
        mesh_list.css('font-style', 'italic')
    } else {
        mesh_list.css('font-style', 'normal')
    }
    mesh_list.append($('<option>', {
        value: "-1",
        text : 'Select a mesh',
        style: 'display:none;'
    }));
    $.each(selected_dataset.data, function (i, name) {
        //var s = HexaLab.UI.view_source == HexaLab.UI.mesh.source[0].selectedIndex && HexaLab.UI.view_mesh - 1 == i ? true : false
        //if (s) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(name))
        let is_mesh_selected = displayed_mesh_idx == i && selected_dataset == displayed_dataset
        mesh_list.append($('<option>', {
            value: i,
            text : name,
            style: 'font-style: normal;',
            selected: is_mesh_selected
        }));
    });

    mesh_list.show()
}

HexaLab.UI.clear_mesh_dropdown_list = function () {
    HexaLab.UI.mesh.dataset_content.hide().empty()
}

HexaLab.UI.clear_dataset_dropdown_list = function () {
    $.each(HexaLab.UI.mesh.source[0].options, function(i) {
        $(this).removeProp('selected')
    })
    $(HexaLab.UI.mesh.source[0].options[0]).prop('selected', true)
}

HexaLab.UI.show_infobox_2 = function () {
    let mesh = HexaLab.app.backend.get_mesh()
    if (!mesh) return
    let infobox = HexaLab.UI.mesh.infobox_2

    infobox.text.empty()
    var name_html
    if (HexaLab.UI.get_displayed_mesh_idx == HexaLab.UI.MESH_IDX_CUSTOM) {
        name_html = '<div class="menu_row_label" style="line-height: 100%; padding-bottom: 10px;">' + HexaLab.FS.short_path(HexaLab.UI.mesh_long_name) + '</div>'
    } else {
        name_html = ''
    }
    infobox.text.append('<div class="menu_row">' + name_html +
        '<div class="menu_row_input simple-font" style="line-height: 100%; padding-bottom: 10px;">' +
            mesh.vert_count + ' vertices, ' + mesh.hexa_count + ' hexas' +
        '</div>' +
    '</div>')

    infobox.text.append('<div class="menu_row"><div class="menu_row_label">Quality</div>\
        <div class="menu_row_input">\
            <div class="menu_row_input_block">\
            </div>\
        </div>\
    </div>')
    infobox.element.find('.menu_row_input_block').append(HexaLab.UI.mesh.quality_type.element)

    let quality_measure = HexaLab.UI.get_selected_quality_measure_name()
    if (quality_measure) {
        HexaLab.UI.mesh.quality_type.element.val(HexaLab.UI.view_quality_measure)  
    } 

    let min = mesh.quality_min.toFixed(3)
    let max = mesh.quality_max.toFixed(3)
    let avg = mesh.quality_avg.toFixed(3)
    let vri = mesh.quality_var.toFixed(3)
    if (min == 0) min = mesh.quality_min.toExponential(2)
    if (max == 0) max = mesh.quality_max.toExponential(2)
    if (avg == 0) avg = mesh.quality_avg.toExponential(2)
    if (vri == 0) vri = mesh.quality_var.toExponential(2)
    infobox.text.append('<table style="width:100%;">' +
        '<tr> <td align="center"><span class="simple-font">Min: </span> <span class="simple-font">' + min + '</span></td>' +
            ' <td align="center"><span class="simple-font">Max: </span> <span class="simple-font">' + max + '</span></td>' +
            ' <td align="center"><span class="simple-font">Avg: </span> <span class="simple-font">' + avg + '</span></td>' + 
            ' <td align="center"><span class="simple-font">Var: </span> <span class="simple-font">' + vri + '</span></td> </tr>' +
        '</table>'
    )
    infobox.element.show().css('display', 'flex');

    // TODO remove this?
    HexaLab.UI.mesh.quality_type.element.on('change', function () {
        const v = this.options[this.selectedIndex].value
        HexaLab.app.set_quality_measure(v);
        for (let x in HexaLab.UI.mesh.quality_type.listeners) {
            HexaLab.UI.mesh.quality_type.listeners[x]()
        }
    })
}

HexaLab.UI.DATASET_ID_NULL   = -2
HexaLab.UI.DATASET_ID_CUSTOM = -1
HexaLab.UI.MESH_IDX_CUSTOM   = -1

HexaLab.UI.set_selected_dataset_by_idx = function (idx) {
    $.each(HexaLab.UI.mesh.source[0].options, function(i) {
        if (parseInt(this.value) == idx) {
            $(this).prop('selected', true);
        } else {
            $(this).removeProp('selected');
        }
    })
}

HexaLab.UI.set_selected_mesh_by_idx = function (idx) {
    $.each(HexaLab.UI.mesh.dataset_content[0].options, function(i) {
        if (parseInt(this.value) == idx) {
            $(this).prop('selected', true);
        } else {
            $(this).removeProp('selected');
        }
    })   
}

// TODO redo this
HexaLab.UI.on_first_mesh = function () {
    HexaLab.UI.dragdrop.header.html('Drop the file in one of the boxes below.')
    HexaLab.UI.dragdrop.overlay.removeClass('first_drag_drop').hide();
    HexaLab.UI.dragdrop.mesh.css('margin-left', '20%');
    HexaLab.UI.dragdrop.settings.show();
}

/*HexaLab.UI.clear_mesh_info_keep_source = function () {
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()
}*/

/*HexaLab.UI.clear_mesh_info = function () {
    HexaLab.UI.clear_infobox_1()
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()
}*/

/*HexaLab.UI.show_mesh_name = function (name) {
    HexaLab.UI.mesh.infobox_1.text.empty().append(name)
    HexaLab.UI.mesh.infobox_1.element.show().css('display', 'flex')
    HexaLab.UI.mesh.infobox_1.buttons.container.hide()
}*/

HexaLab.UI.menu.resizable({
    handles: 'e',
    minWidth: 300,
    maxWidth: 600,
    // https://stackoverflow.com/questions/27233822/how-to-force-jquery-resizable-to-use-percentage
    start: function(event, ui){
        ui.total_width = ui.originalSize.width + ui.originalElement.next().outerWidth();
    },
    stop: function(event, ui){     
        var cellPercentWidth=100 * ui.originalElement.outerWidth()/ HexaLab.UI.display.innerWidth();
        ui.originalElement.css('width', cellPercentWidth + '%');  
        var nextCell = ui.originalElement.next();
        var nextPercentWidth=100 * nextCell.outerWidth()/HexaLab.UI.display.innerWidth();
        nextCell.css('width', nextPercentWidth + '%');
    },
    resize: function(event, ui){ 
        ui.originalElement.next().width(ui.total_width - ui.size.width);
    }
})

/*
$('.mini-slider').each(function () {
    $(this).width(HexaLab.UI.menu.width() * 0.4)
})
*/

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

    var canvas_width = HexaLab.UI.display.width() - HexaLab.UI.menu.width()
    var perc_canvas_width = canvas_width / HexaLab.UI.display.width() * 100
    var perc_menu_width = HexaLab.UI.menu.width() / HexaLab.UI.display.width() * 100
    HexaLab.UI.canvas_container.css('margin-left', perc_menu_width + '%')
    HexaLab.UI.canvas_container.width(perc_canvas_width + '%')
    HexaLab.app.resize()

    /*
    $('.mini-slider').each(function () {
        $(this).width(HexaLab.UI.menu.width() * 0.4)
    })*/

    $('#mesh_info_2').css('left', (HexaLab.UI.menu.width() + 10).toString().concat('px'))
})
// --------------------------------------------------------------------------------
//
//  __  __           _       _____                            _   
// |  \/  |         | |     |_   _|                          | |  
// | \  / | ___  ___| |__     | |  _ __ ___  _ __   ___  _ __| |_ 
// | |\/| |/ _ \/ __| '_ \    | | | '_ ` _ \| '_ \ / _ \| '__| __|
// | |  | |  __/\__ \ | | |  _| |_| | | | | | |_) | (_) | |  | |_ 
// |_|  |_|\___||___/_| |_| |_____|_| |_| |_| .__/ \___/|_|   \__|
//                                          | |                   
//                                          |_|                   
// @MeshImport @Import
// --------------------------------------------------------------------------------
// parse and process HTML GET params
// List of valid parameters:
// dataset: set the selected dataset by index
// doi: set the selected dataset by DOI
// mesh: set the selected mesh by index, only valid if either doi or dataset is set
HexaLab.UI.process_html_params = function () {
    function get_html_params() {
        let vars = {}
        let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value
        })
        return vars
    }
    let params = get_html_params()
    if (params['doi']) {
        $.each(HexaLab.UI.datasets_index.sources, function (i, source) {
            if (source.paper.DOI == params['doi']) {
                HexaLab.UI.set_selected_dataset_by_idx(i)
                HexaLab.UI.show_infobox_1()
                HexaLab.UI.show_mesh_dropdown_list()
            }
        })
    } else if (params['dataset']) {
        HexaLab.UI.set_selected_dataset_by_idx(params['dataset'])
        HexaLab.UI.show_infobox_1()
        HexaLab.UI.show_mesh_dropdown_list()
    } else {
        return
    }
    if (params['mesh']) {
        HexaLab.UI.set_selected_mesh_by_idx(params['mesh'])
    } else {
        return
    }
    
    HexaLab.UI.import_selected_mesh()
    if (params['settings']) {
        HexaLab.UI.queued_settings = JSON.parse(decodeURIComponent(params['settings']))
    }
}

HexaLab.UI.process_mesh_pack = function (file) {
    HexaLab.UI.is_pack_processing = true
    HexaLab.UI.clear_infobox_1()
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()
    HexaLab.UI.set_progress_phasename('Loading...');

    let out = new JSZip()
    var png_promises = []
    var pngs = []
    function process_zip_content (content) {
        var promises = []
        content.forEach(function (file) {
            promises.push(file.async("uint8array").then(function (data) {
                let name = file.name
                HexaLab.UI.set_mesh(name, data)
                HexaLab.app.force_canvas_update()
                png_promises.push(new Promise(function(resolve, reject) {
                    HexaLab.app.canvas.element.toBlob(function (blob) {
                        pngs.push({
                            name: name.substr(0, name.lastIndexOf(".")) + ".png",
                            blob: blob
                        })
                        resolve()
                    }, "image/png")
                }))
            }))
        })
        return Promise.all(promises)
    }

    JSZip.loadAsync(file).then(function (zip) {
        var files = []
        zip.forEach(function (path, file) {
            let ext = HexaLab.FS.get_path_file_extension(path)
            if (ext == "mesh" || ext == "vtk") {
                files.push(file)
            }
        })
        process_zip_content(files).then(function () {
            Promise.all(png_promises).then(function () {
                pngs.forEach(function (png) {
                    out.file(png.name, png.blob)
                })
                out.generateAsync({type:"blob"}).then(function (blob) {
                    saveAs(blob, "HexaPack.zip")
                    HexaLab.UI.clear_infobox_2()
                    HexaLab.UI.clear_dataset_dropdown_list()
                    HexaLab.UI.is_pack_processing = false
                })
            })
        })
    })
}

// TODO document long/short name
HexaLab.UI.set_mesh = function (long_name, byte_array) {
    var name = HexaLab.FS.short_path(long_name)
    HexaLab.UI.mesh_long_name = long_name
    HexaLab.FS.make_file(byte_array, name);
	
    HexaLab.app.import_mesh(name);
    HexaLab.FS.delete_file(name);

    if (HexaLab.UI.first_mesh) {
        HexaLab.UI.on_first_mesh()
        HexaLab.UI.first_mesh = false
        let settings = JSON.parse(Cookies.get('HexaLab'))
        HexaLab.app.set_settings(settings)
        HexaLab.UI.update_cookie()
    }

    if (HexaLab.UI.queued_settings) {
        HexaLab.app.set_settings(HexaLab.UI.queued_settings)
        HexaLab.UI.queued_settings = null
    }
}

var force_redraw = function(el){
	// nothing of this works, at least from emscripten code and chrome  :(
	var trick;
	trick = el.offsetHeight;
	el.hide(0, function(){el.show(0);} );
	//el.hide();
	//el.show();
}

HexaLab.UI.set_progress_phasename = function( str ){
	HexaLab.UI.mesh.infobox_2.text.text(str).show();
	force_redraw( HexaLab.UI.mesh.infobox_2.text );
	force_redraw( HexaLab.UI.mesh.infobox_2.element );
	//console.log("PHASE NAME: '"+str+"'")
}

HexaLab.UI.set_progress_percent = function( num ){
	return; // doesn't work well enought yet
	num = num.toFixed(0);
	HexaLab.UI.mesh.infobox_2.element.css('background-size', "" + num + '% 100%');
	force_redraw( HexaLab.UI.mesh.infobox_2.text );
	force_redraw( HexaLab.UI.mesh.infobox_2.element );
	//console.log("PROGRESS "+num+"%")
}

HexaLab.UI.import_custom_mesh = function (file) {
    HexaLab.UI.set_selected_dataset_by_idx(HexaLab.UI.DATASET_ID_CUSTOM)
    HexaLab.UI.clear_infobox_1()
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()
    //HexaLab.UI.clear_mesh_info()
    // Fill
	HexaLab.UI.set_progress_phasename('Loading...');
    HexaLab.FS.read_file(file, function (name, data) {
        HexaLab.UI.set_mesh(name, data)
        HexaLab.UI.mesh_long_name = name
        HexaLab.UI.set_displayed_dataset_idx(HexaLab.UI.DATASET_IDX_CUSTOM)
        HexaLab.UI.show_infobox_2()
    })
}

HexaLab.UI.import_selected_mesh = function () {
    let dataset = HexaLab.UI.get_selected_dataset()
    let mesh_idx = HexaLab.UI.get_selected_mesh_idx()

    let name = dataset.data[mesh_idx]
    let request = new XMLHttpRequest();
    request.open('GET', 'datasets/' + dataset.path + '/' + name, true);
    request.responseType = 'arraybuffer';
    request.onloadend = function(e) {
        var data = new Uint8Array(this.response)
        HexaLab.UI.set_mesh(name, data)
        HexaLab.UI.set_displayed_dataset_idx(HexaLab.UI.get_selected_dataset_idx())
        HexaLab.UI.set_displayed_mesh_idx(mesh_idx)
        HexaLab.UI.clear_mesh_dropdown_list()
        HexaLab.UI.show_mesh_dropdown_list()
        HexaLab.UI.show_infobox_2()
		// TODO ? HexaLab.UI.mesh.infobox_2.element.css('background-size', '0% 100%');
    }
	
	/*request.onprogress = function (event) {
		HexaLab.UI.set_progress_percent( 100 * event.loaded / event.total );
	};*/
	
	//request.addEventListener("progress", request.onprogress, false);

    
    HexaLab.UI.set_progress_phasename('Loading...')
    // Early remove italic from the mesh dropdown list
    HexaLab.UI.mesh.dataset_content.css('font-style', 'normal').show()
	
	request.send();
}

HexaLab.UI.on_import_mesh = function (name) {
    HexaLab.UI.topbar.on_mesh_import()
    // if (HexaLab.UI.view_source == 1) HexaLab.UI.show_mesh_name(name)
    // if (HexaLab.UI.view_source == 2) HexaLab.UI.setup_dataset_content()
    // HexaLab.UI.show_infobox_2()
    HexaLab.UI.quality_plot_update()
}

HexaLab.UI.on_import_mesh_fail = function (name) {
    HexaLab.UI.topbar.on_mesh_import_fail()
    HexaLab.UI.mesh.infobox_2.text.empty().append('<span>Can\'t parse the file.</span>')
    // HexaLab.UI.view_source = null
    // HexaLab.UI.view_mesh = null
}

HexaLab.UI.maybe_set_settings = function ( s ){
	if (HexaLab.UI.topbar.load_settings.prop("disabled")==false) {
		HexaLab.app.set_settings(s);
	}
}

HexaLab.UI.import_settings_from_txt = function (file) {
    HexaLab.FS.read_json_file(file, function (file, json) {
        HexaLab.UI.maybe_set_settings(json)
    })
}

HexaLab.UI.import_settings_from_png = function (file) {
	
	var fr = new FileReader();
	fr.onloadend = function( e ) {
		
		pngitxt.get( fr.result, "hexalab" , 
			function(err,d) {
				if (err != null) {
					alert("No HexaLab settings found in \n\"" + file.name +"\"" );
				}
				const json = JSON.parse(d.value)
				HexaLab.UI.maybe_set_settings(json)
			}	
		)
	}
	fr.readAsBinaryString( file );
	
}

// HexaLab.UI.mesh.source.on("click", function () {
//     if (HexaLab.UI.mesh.source.select_focus_file_flag) {
//         HexaLab.UI.mesh.source.select_focus_file_flag = 0
//         return
//     }
//     this.selectedIndex = -1
// })

HexaLab.UI.mesh.source.on("click", function () {
    // This flag is only used here and inside onChange.
    // It's used to fill the select box content when the dropdown list is displayed and to keep it that way in case it gets closed without a selection.
    if (HexaLab.UI.mesh.source.select_click_flag) {
        HexaLab.UI.mesh.source.select_click_flag = 0
        return
    }
    this.selectedIndex = 0
})

HexaLab.UI.mesh.source.on("change", function () {
    HexaLab.UI.mesh.source.css('font-style', 'normal')
    HexaLab.UI.mesh.source.select_click_flag = 1
    
    //var selected_source = this.options[this.selectedIndex].value
    //var prev_source = HexaLab.UI.mesh.selected_source
    //HexaLab.UI.mesh.selected_source = selected_source
    let selected_dataset_idx = HexaLab.UI.get_selected_dataset_idx()
    
    HexaLab.UI.clear_infobox_1()
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()

    if (selected_dataset_idx == -1) {
        //if (prev_source == -1) HexaLab.UI.setup_mesh_stats(HexaLab.FS.short_path(HexaLab.UI.mesh_long_name))
        HexaLab.FS.trigger_file_picker(HexaLab.UI.import_custom_mesh, ".mesh, .vtk", "Open Hexahedral mesh")
        //HexaLab.UI.show_infobox_2()
    } else {
        HexaLab.UI.show_infobox_1()
        HexaLab.UI.show_mesh_dropdown_list()
        if (selected_dataset_idx == HexaLab.UI.get_displayed_dataset_idx()) {
            HexaLab.UI.show_infobox_2()
        }
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
    HexaLab.UI.import_selected_mesh()
})
// --------------------------------------------------------------------------------
//  _____                         _____                  
// |  __ \                  ___  |  __ \                 
// | |  | |_ __ __ _  __ _ ( _ ) | |  | |_ __ ___  _ __  
// | |  | | '__/ _` |/ _` |/ _ \/\ |  | | '__/ _ \| '_ \ 
// | |__| | | | (_| | (_| | (_>  < |__| | | | (_) | |_) |
// |_____/|_|  \__,_|\__, |\___/\/_____/|_|  \___/| .__/ 
//                    __/ |                       | |    
//                   |___/                        |_|    
// @DragDrop
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
    HexaLab.UI.import_custom_mesh(files[0])
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
	var fn = files[0];
	if (fn.name.toLowerCase().endsWith(".png")) {
		HexaLab.UI.import_settings_from_png(fn)
	} else {
		HexaLab.UI.import_settings_from_txt(fn)
	}
})
HexaLab.UI.dragdrop.settings.on('dragbetterleave', function (event) {
    $(this).removeClass('drag_drop_quad_on').addClass('drag_drop_quad_off');
})

/* drop on canvas: guess based on file name */
HexaLab.UI.display.on('drop', function (event) {
    event.preventDefault()
    var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files
    
	var fn = files[0];
	var st = fn.name.toLowerCase();
	if (st.endsWith(".png")) {
		HexaLab.UI.import_settings_from_png(fn)
	} else if (st.endsWith(".txt"))  {
		HexaLab.UI.import_settings_from_txt(fn)
	} else if (st.endsWith(".mesh"))  {
		HexaLab.UI.import_custom_mesh(fn)
	}
})
// --------------------------------------------------------------------------------
//  _____  _       _   
// |  __ \| |     | |  
// | |__) | | ___ | |_ 
// |  ___/| |/ _ \| __|
// | |    | | (_) | |_ 
// |_|    |_|\___/ \__|
// @Plot
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
    let datamin=10000000
    let datamax=-1000000
    let sorted_range_min = Math.min(range_min,range_max) 
    let sorted_range_max = Math.max(range_min,range_max) 

    let quality = HexaLab.app.backend.get_hexa_quality()
    if (quality != null) {
        let t = new Float32Array(Module.HEAPU8.buffer, quality.data(), quality.size())
        for (let i = 0; i < quality.size() ; i++) {
            datamin=Math.min(t[i],datamin)
            datamax=Math.max(t[i],datamax)
            data[i] = Math.min(Math.max(range_min, t[i]), range_max) 
        }
    }
    
    
    // problem: plotly does not map the color to the range, it maps the color to the bins.
    //          the first color is given to the first non-empty bin, the others follow.
    //          following non-empty bins are correctly counted and their color is skipped.
    // solution: skip the first n color ticks, where n is the number of empty bins at the start.
    let mesh = HexaLab.app.backend.get_mesh()
    let bin_num = 100
    let bin_width = (sorted_range_max - sorted_range_min) / bin_num
    let emptybinNum = Math.trunc((mesh.quality_min - sorted_range_min) / bin_width)
    if(emptybinNum<0) emptybinNum=0
    for (let i = emptybinNum; i < bin_num ; i++) {
        bins_colors[i - emptybinNum] = 100 - i
    }

    console.log("range minmax",range_min,range_max)
    console.log("data minmax",datamin,datamax)
    console.log("quality minmax",mesh.quality_min,mesh.quality_max)

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
        histnorm:   '',
        cauto:      false,
        autobinx:   false,
        //nbinsx: 100,
        marker: {
            // showscale: true,
            cmin:   0,
            cmax:   bin_num - 1,
            color:  bins_colors,
            colorscale: colorscale,
        },
    }]
    plot_data[0][axis] = data
    plot_data[0][axis.concat('bins')] = {
        start:  sorted_range_min,
        end:    sorted_range_max,
        size:   bin_width
    }

    var plot_layout = {
        paper_bgcolor: 'rgba(255, 255, 255, 0.2)',
        plot_bgcolor:  'rgba(255, 255, 255, 0.2)',
        autosize:       true,
        font: {
                size: 12,
        },
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
        dtick:      (range_max - range_min) / 10, //0.25,
        ticklen:    2,
        tickwidth:  2,
        tickcolor:  '#444444'
    }

    HexaLab.UI.save_plot = function (format) {
        HexaLab.UI.plot_format_dialog.dialog('close')

        let magFac=4
        plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 1)'
        plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 1)'
        plot_layout.font.size *= magFac
        plot_layout.margin.l *= magFac
        plot_layout.margin.r *= magFac
        plot_layout.margin.b *= magFac
        plot_layout.margin.t *= magFac
        Plotly.newPlot($("<div></div>")[0], {
            data: plot_data,
            layout: plot_layout,
            config: plot_config
        })
        Plotly.toImage(container.find('#plot_div')[0], {
            format: format, 
            width: container.find('#plot_div').width()*magFac, 
            height: container.find('#plot_div').height()*magFac
        }).then(function(data) {
            let canvas_width, canvas_height
            if (axis == 'x') {
                canvas_width  = container.find('#plot_div').width()*magFac
                canvas_height = (container.find('#plot_div').height() + 16 + 10)*magFac
            } else {
                canvas_width  = (container.find('#plot_div').width()  + 16 + 10)*magFac
                canvas_height = container.find('#plot_div').height()*magFac
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
                        ctx.drawImage(bar_img, 60*magFac, canvas_height - (16 + 5)*magFac, canvas_width - (60 + 30)*magFac, 16*magFac)
                    } else {
                        ctx.drawImage(bar_img, 5*magFac, 30*magFac, 16*magFac, canvas_height - (30 + 50)*magFac)
                        ctx.drawImage(plot_img, (5 + 16)*magFac, 0)
                    }
                    let img = c.toDataURL("image/png")
                    saveAs(dataURItoBlob(img), "HLplot.png")
                }
            }
        })
        plot_layout.paper_bgcolor = 'rgba(255, 255, 255, 0.2)'
        plot_layout.plot_bgcolor = 'rgba(255, 255, 255, 0.2)'
        plot_layout.font.size /= magFac                    
        plot_layout.margin.l /= magFac
        plot_layout.margin.r /= magFac
        plot_layout.margin.b /= magFac
        plot_layout.margin.t /= magFac
        Plotly.newPlot(container.find('#plot_div')[0], {
            data: plot_data,
            layout: plot_layout,
            config: plot_config
        })
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
                    HexaLab.UI.plot_format_dialog = HexaLab.UI.dialog(500, 100, 100, 100, "<div title='Choose format'>\
                        <ul style='list-style-type:none;'>\
                            <li><a href='javascript:void(0)' onclick='HexaLab.UI.save_plot(\"png\")'>png</a></li>\
                            <li><a href='javascript:void(0)' onclick='HexaLab.UI.save_plot(\"html\")'>html</a></li>\
                            <li><a href='javascript:void(0)' onclick='HexaLab.UI.save_plot(\"cvs\")'>cvs</a></li>\
                        </ul>\
                    </div>")
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
//  _______            ____             
// |__   __|          |  _ \            
//    | | ___  _ __   | |_) | __ _ _ __ 
//    | |/ _ \| '_ \  |  _ < / _` | '__|
//    | | (_) | |_) | | |_) | (_| | |   
//    |_|\___/| .__/  |____/ \__,_|_|   
//            | |                       
//            |_|             
// @TopBar
// --------------------------------------------------------------------------------
HexaLab.UI.topbar.load_mesh.on('click', function () {
    HexaLab.UI.mesh.source.css('font-style', 'normal')
    HexaLab.UI.clear_infobox_1()
    HexaLab.UI.clear_infobox_2()
    HexaLab.UI.clear_mesh_dropdown_list()
    HexaLab.FS.trigger_file_picker(HexaLab.UI.import_custom_mesh, ".mesh, .vtk", "Open Hexahedral mesh")
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

HexaLab.UI.topbar.process_pack.on('click', function () {
    HexaLab.FS.trigger_file_picker(HexaLab.UI.process_mesh_pack, ".zip", "Open Meshes .zip pack")
})

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
    window.open('https://github.com/cnr-isti-vclab/HexaLab#hexalabnet-an-online-viewer-for-hexahedral-meshes', '_blank');
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

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

HexaLab.UI.topbar.snapshot.on('click', function () {
    HexaLab.app.canvas.element.toBlob(function (blob) {
			var reader = new FileReader();
			
			reader.onloadend = function (e) {
				const settingsStr = JSON.stringify(HexaLab.app.get_settings(), null, 4)
				pngitxt.set(
					reader.result, 
					{  
						keyword: "hexalab", 
						value: settingsStr	
					},
					function (res) {
						var by = new Uint8Array(res.length);
						for (var i=0; i<res.length; i++) by[i]=res.charCodeAt(i);
						blob = new Blob( [by.buffer] )
						saveAs(blob, "hexalab.png")
					}
				)
			}

			reader.readAsBinaryString( blob );

    }, "image/png");
}).prop("disabled", true);

HexaLab.UI.settings.rendering_menu_content.prop('disabled', true)
HexaLab.UI.settings.silhouette.slider('disable')    
HexaLab.UI.settings.erode_dilate.slider('disable')    
HexaLab.UI.settings.singularity_mode.slider('disable')
//HexaLab.UI.settings.wireframe_row.hide()
//HexaLab.UI.settings.crack_size_row.hide()
//HexaLab.UI.settings.rounding_radius_row.hide()
HexaLab.UI.settings.color.default.outside.spectrum('disable')
HexaLab.UI.settings.color.default.inside.spectrum('disable')

// Overlay
HexaLab.UI.dialog = function (x, y, width, height, content) {
    return $(content).dialog({
        width: '200px',
        close: function() {
            $(this).dialog('close')
        }
    });
}