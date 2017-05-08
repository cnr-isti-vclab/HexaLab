"use strict";

HexaLab.views.low_quality_view = (function () {
    // private state
    var self = HexaLab.views.low_quality_view;
    var view = new Module.LowQualityView();
    var scene = new THREE.scene();
    var objecs = {
        visible: {
            surface_geometry: new THREE.BufferGeometry(),
            surface_material: new THREE.MeshLambertMaterial(),
            wireframe_geometry: new THREE.BufferGeometry(),
            wireframe_material: new THREE.MeshLambertMaterial(),
            model: view.get_low_quality_model()
        },
        hidden: {
            geometry: new THREE.BufferGeometry(),
            material: new THREE.MeshBasicMaterial(),
            model: view.get_hidden_model()
        }
    };
    var gui = {};

    // settings
    var default_settings = {
        threshold: 0.5,
        hidden_color: "000000",
        hidden_opacity: 0.5,
        show_quality: true
    };
    self.load(default_settings);

    // gui
    gui.threshold = document.createElement("input");
    gui.threshold.setAttribute("type", "number");
    gui.threshold.value = view.quality_threshold;
    gui.threshold.oninput = function (e) {
        self.set_quality_threshold(gui.threshold.value);
        self.update();
    };
    gui.hidden_color = document.createElement("input");
    gui.hidden_color.setAttribute("type", "color");
    gui.hidden_color.value = objecs.hidden.material.color.getHexString();
    gui.hidden_color.oninput = function (e) {
        self.set_hidden_mesh_color(gui.hidden_color.value);
        self.update();
    };
    gui.hidden_opacity = document.createElement("input");
    gui.hidden_opacity.setAttribute("type", "range");
    gui.hidden_opacity.value = objecs.hidden.material.opacity * 100;
    gui.hidden_opacity.oninput = function (e) {
        self.set_quality_threshold(gui.hidden_opacity.value / 100);
        self.update();
    };
    gui.show_quality = document.createElement("input");
    gui.show_quality.setAttribute("type", "checkbox");
    gui.show_quality.checked = objecs.visible.surface_material.vertexColors == THREE.VertexColors;
    gui.show_quality.oninput = function (e) {
        self.set_quality_threshold(gui.show_quality.checked);
        self.update();
    };

    // api
    return {
        // view interface
        show_gui: function (root) {
            gui.forEach(function (e) {
                root.appendChild(e);
            });
        },

        serialize: function () {
            return {
                threshold: view.quality_threshold,
                hidden_color: objecs.hidden.material.color.getHexString(),
                hidden_opacity: objects.hidden.material.opacity,
                show_quality: objects.visible.surface_material.vertexColors == THREE.VertexColors
            }
        },

        load: function (settings) {
            self.set_quality_threshold(settings.threshold);
            self.set_hidden_mesh_color("#" + settings.hidden_color);
            self.set_hidden_mesh_opacity(settings.hidden_opacity);
            self.show_quality(settings.show_quality);
        },

        update: function () {

            view.update();

            var show_quality = objects.visible.surface_material.vertexColors == THREE.VertexColors;
            var visible_face_pos = new Float32Array(Module.HEAPU8.buffer, 
                objects.visible.model.get_surface_vert_pos_addr(), 
                objects.visible.model.get_surface_vert_count() * 3);
            var visible_face_norm = new Float32Array(Module.HEAPU8.buffer,
                objects.visible.model.get_surface_vert_norm_addr(),
                objects.visible.model.get_surface_vert_count() * 3);
            var visible_face_color = new Float32Array(Module.HEAPU8.buffer,
                objects.visible.model.get_surface_vert_color_addr(),
                objects.visible.model.get_surface_vert_count() * 3);
            scene.remove(objects.visible.surface_mesh);
            objects.visible.surface_geometry.addAttribute('position', new THREE.BufferAttribute(visible_face_pos, 3));
            objects.visible.surface_geometry.addAttribute('normal', new THREE.BufferAttribute(visible_face_norm, 3));
            if (show_quality) objects.visible.surface_geometry.addAttribute('color', new THREE.BufferAttribute(visible_face_color, 3));
            objects.visible.surface_mesh = new THREE.Mesh(objects.visible.surface_geometry, objects.visible.surface_material);
            scene.add(objects.visible.surface_mesh);

            var visible_wireframe_pos = new Float32Array(Module.HEAPU8.buffer,
                objects.visible.model.get_wireframe_vert_pos_addr(),
                objects.visible.model.get_wireframe_vert_count() * 3);
            scene.remove(objects.visible.wireframe_mesh);
            objects.visible.wireframe_geometry.addAttribute('position', new THREE.BufferAttribute(visible_wireframe_pos, 3));
            objects.visible.wireframe_mesh = new THREE.Mesh(objects.visible.wireframe_geometry, objects.visible.wireframe_material);
            scene.add(objects.visible.wireframe_mesh);

            var hidden_face_pos = new Float32Array(Module.HEAPU8.buffer,
                objects.hidden.model.get_surface_vert_pos_addr(),
                objects.hidden.model.get_surface_vert_count() * 3);
            var hidden_face_norm = new Float32Array(Module.HEAPU8.buffer,
                objects.hidden.model.get_surface_vert_norm_addr(),
                objects.hidden.model.get_surface_vert_count() * 3);
            scene.remove(objects.hidden.mesh);
            objects.hidden.geometry.addAttribute('position', new THREE.BufferAttribute(hidden_face_pos, 3));
            objects.hidden.geometry.addAttribute('normal', new THREE.BufferAttribute(hidden_face_norm, 3));
            objects.hidden.mesh = new THREE.Mesh(objects.hidden.geometry, objects.hidden.material);
            scene.add(objects.hidden.mesh);
        },

        get_scene: function () {
            return scene;
        },

        // gui callbacks
        set_quality_threshold: function (threshold) {
            view.quality_threshold = threshold;
        },

        set_hidden_mesh_color: function (color) {
            objects.hidden.material.color.set(color);
        },

        set_hidden_mesh_opacity: function (opacity) {
            objects.hidden.material.opacity = opacity;
        },

        show_quality: function (show) {
            if (show) {
                objects.visible.surface_material.vertexColors = THREE.VertexColors;
            } else {
                objects.visible.surface_material.vertexColors = THREE.NoColors;
            }
            objects.visible.surface_material.needsUpdate = true;
        }
    }
    
})