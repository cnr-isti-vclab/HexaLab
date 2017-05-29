"use strict";

$.fn.togglepanels = function () {
    return this.each(function () {
        $(this).addClass("ui-accordion ui-accordion-icons ui-widget ui-helper-reset")
      .find("h3")
        //.addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
        .addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
        .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
        .hover(function () { $(this).toggleClass("ui-state-hover"); })
        .prepend('<span class="ui-icon ui-icon-triangle-1-s"></span>')
        .click(function () {
            $(this)
              .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
              .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
              .next().slideToggle();
            return false;
        })
        .next()
          .addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
        //.hide()
    });
};

HexaLab.UI = {
    app: null,
    file_reader: new FileReader(),
    file_input: $('#file_input'),

    menu: $('#controls_menu'),
    mesh_source: $('#mesh_source_select'),
    paper_source_div: $('#paper_source_div'),
    paper: $('#paper_select'),
    paper_mesh: $('#paper_mesh_select'),
    custom_mesh: $('#mesh_pick_button'),
    settings_in: $('#import_settings_button'),
    settings_out: $('#export_settings_button'),
    snapshot: $('#snapshot_button'),
    camera_reset: $('#camera_reset_button'),
    msaa: $('#msaa_checkbox'),
    ssao: $('#ssao_checkbox'),

    materials_menu: $('#materials_menu'),
    
    visible_surface_color: $('#surface_color'),
    visible_surface_show_quality: $('#quality_color_checkbox'),
    visible_wireframe_color: $('#wireframe_color'),
    visible_wireframe_opacity: $('#wireframe_opacity'),
    
    filtered_surface_color: $('#culled_surface_color'),
    filtered_surface_opacity: $('#culled_surface_opacity'),
    filtered_wireframe_color: $('#culled_wireframe_color'),
    filtered_wireframe_opacity: $('#culled_wireframe_opacity'),

    singularity_opacity: $('#singularity_opacity'),

    filters_div: $('#filters_menu'),
    filters_menu: $('#filters_menu'),

    plane_nx: $('#plane_normal_x'),
    plane_ny: $('#plane_normal_y'),
    plane_nz: $('#plane_normal_z'),
    plane_normal_div: $('#plane_normal_div'),
    plane_offset_number: $('#plane_offset_number'),
    plane_offset_range: $('#plane_offset_range'),
    plane_offset_div: $('#plane_offset_div'),
    plane_color: $('#plane_color'),
    plane_opacity: $('#plane_opacity'),

    quality_threshold: $('#quality_threshold'),

    quality_plot: $('#quality_plot_button'),
    quality_plot_div: $('#quality_plot_div'),
}
 
//HexaLab.UI.menu.togglepanels();
HexaLab.UI.menu.accordion({
    heightStyle: "content"
});
HexaLab.UI.materials_menu.accordion({
    heightStyle: "content"
});
HexaLab.UI.filters_menu.accordion({
    heightStyle: "content"
});

// controls

HexaLab.UI.mesh_source.selectmenu().hide().on('selectmenuchange', function () {
    if ($(this).val() == 'custom') {
        HexaLab.UI.custom_mesh.show();
        HexaLab.UI.paper_source_div.hide();
    } else if ($(this).val() == 'paper') {
        HexaLab.UI.paper_source_div.show();
        HexaLab.UI.custom_mesh.hide();
    }
})

HexaLab.UI.paper_source_div.hide();

HexaLab.UI.paper.selectmenu().on('selectmenuchange', function () {
    HexaLab.UI.paper_mesh.parent().show();
})

HexaLab.UI.paper_mesh.selectmenu().on('selectmenuchange', function () {
    alert('Not yet implemented :(');
}).parent().hide();

HexaLab.UI.custom_mesh.button().click(function () {
    HexaLab.UI.file_input.val(null);        // reset value (to later trigger change even if the file is the same as before)
    HexaLab.UI.file_input.off('change').change(function () {
        var file = this.files[0];
        HexaLab.UI.file_reader.onload = function () {
            var data = new Int8Array(this.result);
            HexaLab.FS.make_file(data, file.name);
            HexaLab.UI.app.import_mesh(file.name);
        }
        HexaLab.UI.file_reader.readAsArrayBuffer(file, "UTF-8");
    })
    HexaLab.UI.file_input.click();     // open system file picker popup
})

HexaLab.UI.settings_in.button().click(function () {
    HexaLab.UI.file_input.val(null);    // reset value (to later trigger change even if the file is the same as before)
    HexaLab.UI.file_input.off('change').change(function () {
        var file = this.files[0];
        HexaLab.UI.file_reader.onload = function () {
            var settings = JSON.parse(this.result);
            HexaLab.UI.app.set_settings(settings);
        }
        HexaLab.UI.file_reader.readAsText(file, "UTF-8");
    })
    HexaLab.UI.file_input.click();     // open system file picker popup
});

HexaLab.UI.settings_out.button().click(function () {
    var settings = JSON.stringify(HexaLab.UI.app.get_settings(), null, 4);
    var blob = new Blob([settings], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "HLsettings.txt");
});

HexaLab.UI.snapshot.button().click(function () {
    HexaLab.UI.app.canvas.element.toBlob(function (blob) {
        saveAs(blob, "HLsnapshot.png");
    }, "image/png");
});
HexaLab.UI.camera_reset.button().click(function () {
    HexaLab.UI.app.set_camera_settings(HexaLab.UI.app.default_camera_settings)
});

// renderer

HexaLab.UI.msaa.checkboxradio({
    icon: false
}).click(function () {
    HexaLab.UI.app.set_antialiasing(HexaLab.UI.msaa.prop('checked'));
});
HexaLab.UI.ssao.checkboxradio({
    icon: false
}).click(function () {
    HexaLab.UI.app.set_occlusion(HexaLab.UI.ssao.prop('checked'));
});

// materials

HexaLab.UI.visible_surface_color.change(function () {
    HexaLab.UI.app.set_visible_surface_color($(this).val());
})

HexaLab.UI.visible_surface_show_quality.checkboxradio({
    icon: false
}).change(function () {
    HexaLab.UI.app.show_visible_quality(HexaLab.UI.visible_surface_show_quality.prop('checked'));
})

HexaLab.UI.visible_wireframe_color.change(function () {
    HexaLab.UI.app.set_visible_wireframe_color($(this).val());
})

HexaLab.UI.visible_wireframe_opacity.slider().on('slide', function (e, ui) {
    HexaLab.UI.app.set_visible_wireframe_opacity(ui.value / 100);
})

HexaLab.UI.filtered_surface_color.change(function () {
    HexaLab.UI.app.set_filtered_surface_color($(this).val());
})

HexaLab.UI.filtered_surface_opacity.slider().on('slide', function (e, ui) {
    HexaLab.UI.app.set_filtered_surface_opacity(ui.value / 100);
})

HexaLab.UI.filtered_wireframe_color.change(function () {
    HexaLab.UI.app.set_filtered_wireframe_color($(this).val());
})

HexaLab.UI.filtered_wireframe_opacity.slider().on('slide', function (e, ui) {
    HexaLab.UI.app.set_filtered_wireframe_opacity(ui.value / 100);
})

HexaLab.UI.singularity_opacity.slider().on('slide', function (e, ui) {
    HexaLab.UI.app.set_singularity_opacity(ui.value / 100);
})

HexaLab.UI.plane_normal_div.controlgroup();
HexaLab.UI.plane_offset_div.controlgroup();

HexaLab.UI.quality_plot.button().click(function () {
    function plot() {
        var x = [];
        HexaLab.UI.quality_plot_div.dialog({
            resize: function () {
                Plotly.Plots.resize(HexaLab.UI.quality_plot_div[0]);
            },
            title: 'Jacobian Quality',
            width: 800,
            height: 500
        });
        var quality = HexaLab.UI.app.app.get_hexa_quality();
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
        Plotly.newPlot(HexaLab.UI.quality_plot_div[0], plot_data);
    }

    plot();
});