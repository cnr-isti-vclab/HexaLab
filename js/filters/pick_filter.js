"use strict;"

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.pick_enabled        = $('#pick_enabled')
HexaLab.UI.pick_button         = $('#pick_button')
HexaLab.UI.fill_button         = $('#fill_button')
HexaLab.UI.pick_clear_button   = $('#pick_clear_button')

// --------------------------------------------------------------------------------
// Filter class
// --------------------------------------------------------------------------------
HexaLab.PickFilter = function () {
    // Ctor
    HexaLab.Filter.call(this, new Module.PickFilter(), 'Pick');

    // Listener
    var self = this;
    HexaLab.UI.pick_enabled.change(function () {
        self.enable($(this).is(':checked'))
    })
    HexaLab.UI.pick_button.click(function () {
        self.toggle_pick()
    }).width('50px')
    HexaLab.UI.fill_button.click(function () {
        self.toggle_fill()
    }).width('50px')
    HexaLab.UI.pick_clear_button.click(function () {
        self.clear()
    }).width('50px')

    // State
    this.filtered_hexas = []
    this.picking = false
    this.filling = false

    this.default_settings = {
        enabled: false,
        filtered_hexas: []
    }

    this.mousedown_listener = this.on_mouse_down.bind(this)
    this.mouseup_listener   = this.on_mouse_up.bind(this)
    this.mousemove_listener = this.on_mouse_move.bind(this)
}

HexaLab.PickFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {

    // Api
    get_settings: function () {
        return {
            enabled: this.backend.enabled,
            filtered_hexas: this.filtered_hexas
        }
    },

    set_settings: function (settings) {
        this.enable(settings.enabled)
        this.set_filtered_hexas(settings.filtered_hexas)
    },

    on_mesh_change: function (mesh) {
        this.clear()
        this.on_enabled_set(this.backend.enabled)
    },

    // UI
    on_enabled_set: function (bool) {
        HexaLab.UI.pick_enabled.prop('checked', bool)
    },

    on_toggle_pick: function () {
        if (this.picking) {
            document.body.style.cursor = "crosshair"
            HexaLab.UI.pick_button.css('background', 'rgb(255, 0, 0)')
        } else {
            document.body.style.cursor = "default"
            HexaLab.UI.pick_button.css('background', 'rgb(207, 226, 243)')
        }
        HexaLab.UI.fill_button.css('background', 'rgb(207, 226, 243)')
    },

    on_toggle_fill: function () {
        if (this.filling) {
            document.body.style.cursor = "crosshair"
            HexaLab.UI.fill_button.css('background', 'rgb(255, 0, 0)')
        } else {
            document.body.style.cursor = "default"
            HexaLab.UI.fill_button.css('background', 'rgb(207, 226, 243)')
        }
        HexaLab.UI.pick_button.css('background', 'rgb(207, 226, 243)')
    },

    on_clear: function () {
        document.body.style.cursor = "default"
        HexaLab.UI.pick_button.css('background', 'rgb(207, 226, 243)')
        HexaLab.UI.fill_button.css('background', 'rgb(207, 226, 243)')
    },

    // State
    enable: function (enabled) {
        this.backend.enabled = enabled
        this.on_enabled_set(enabled)
        HexaLab.app.queue_geometry_update()
    },

    set_filtered_hexas: function (list) {
        this.filtered_hexas = list
        this.backend.clear_filtered_hexas()
        for (let i = 0; i < list.length; ++i) {
            this.backend.filter_hexa_idx(list[i])
        }
        HexaLab.app.queue_geometry_update()
    },

    toggle_pick: function () {
        document.removeEventListener('pointerdown', this.mousedown_listener)
        document.removeEventListener('pointerup',   this.mouseup_listener)
        this.filling = false
        if (!this.picking) {
            this.picking = true
            document.addEventListener('pointerdown', this.mousedown_listener)
            document.addEventListener('pointerup',   this.mouseup_listener)
        } else {
            this.picking = false
        }
        this.on_toggle_pick()
    },

    toggle_fill: function () {
        document.removeEventListener('pointerdown', this.mousedown_listener)
        document.removeEventListener('pointerup',   this.mouseup_listener)
        this.picking = false
        if (!this.filling) {
            this.filling = true
            document.addEventListener('pointerdown', this.mousedown_listener)
            document.addEventListener('pointerup',   this.mouseup_listener)
        } else {
            this.filling = false
        }
        this.on_toggle_fill()
    },

    clear: function () {
        this.backend.clear_filtered_hexas()
        this.filtered_hexas = []
        document.removeEventListener('pointerdown', this.mousedown_listener)
        document.removeEventListener('pointerup',   this.mouseup_listener)
        this.picking = false
        this.filling = false
        HexaLab.app.queue_geometry_update()
        this.on_clear()
    },

    // pick/fill click callbacks
    on_mouse_down: function (e) {
        this.clientX = e.clientX
        this.clientY = e.clientY
        document.addEventListener('pointermove', this.mousemove_listener)
    },

    on_mouse_up: function (e) {
        document.removeEventListener('pointermove', this.mousemove_listener)
        document.body.style.cursor = "crosshair"

        if (this.clientX != e.clientX || this.clientY != e.clientY) return

        if (this.picking) {
            this.on_pick(e.clientX, e.clientY)
        } else if (this.filling) {
            this.on_fill(e.clientX, e.clientY)
        }
    },

    on_mouse_move: function (e) {
        // TODO why is this not working? ...
        //document.body.style.cursor = "default"
    },

    on_pick: function (x, y) {
        const ray = this.make_ray(x, y)
        if (!ray) return
        const p_origin = new Module.vec3()
        const p_direction = new Module.vec3()
        p_origin.set_x(ray.origin.x)
        p_origin.set_y(ray.origin.y)
        p_origin.set_z(ray.origin.z)
        p_direction.set_x(ray.direction.x)
        p_direction.set_y(ray.direction.y)
        p_direction.set_z(ray.direction.z)
        // let p = ray.origin.add(ray.direction.multiplyScalar(t))
        // var geometry = new THREE.SphereGeometry( 0.001, 32, 32 )
        // var material = new THREE.MeshBasicMaterial( {color: 0xff0000} )
        // var sphere = new THREE.Mesh( geometry, material )
        // sphere.position.set(p.x, p.y, p.z)
        // HexaLab.app.viewer.add_mesh( sphere )
        const i = this.backend.filter_hexa(p_origin, p_direction)
        if (i != -1) {
            this.filtered_hexas.push(i)
            this.filtered_hexas.sort()
            HexaLab.app.queue_geometry_update()
        }
    },

    on_fill: function (x, y) {
        const ray = this.make_ray(x, y)
        if (!ray) return
        const p_origin = new Module.vec3()
        const p_direction = new Module.vec3()
        p_origin.set_x(ray.origin.x)
        p_origin.set_y(ray.origin.y)
        p_origin.set_z(ray.origin.z)
        p_direction.set_x(ray.direction.x)
        p_direction.set_y(ray.direction.y)
        p_direction.set_z(ray.direction.z)
        const i = this.backend.unfilter_hexa(p_origin, p_direction)
        if (i != -1) {
            let idx = this.filtered_hexas.indexOf(i);
            if (idx != -1) {
                this.filtered_hexas.splice(idx, 1);
            }
            HexaLab.app.queue_geometry_update()
        }
    },

    make_ray: function (client_x, client_y) {
        const canvas_rect = HexaLab.app.canvas.element.getBoundingClientRect()
        // click on canvas check
        if (canvas_rect.left > client_x || canvas_rect.right   < client_x) return
        if (canvas_rect.top  > client_y || canvas_rect.bottom  < client_y) return
        // get projection matrix
        const proj_m         = HexaLab.app.camera().projectionMatrix
        const inv_proj_m     = new THREE.Matrix4().getInverse(proj_m)
        const view_m         = HexaLab.app.camera().matrixWorldInverse
        const view_rot_m     = new THREE.Matrix3().set( 
            view_m.elements[0],view_m.elements[1],view_m.elements[2], 
            view_m.elements[4],view_m.elements[5],view_m.elements[6], 
            view_m.elements[8],view_m.elements[9],view_m.elements[10] )
        const inv_view_m     = new THREE.Matrix4().getInverse(view_m)
        const inv_view_rot_m = new THREE.Matrix3().getInverse(view_rot_m)
        const world_m        = HexaLab.app.viewer.get_models_transform()
        const inv_world_m    = new THREE.Matrix4().getInverse(world_m)

        const viewport_x = client_x - canvas_rect.left 
        const viewport_y = client_y - canvas_rect.top 
        const w_2 = canvas_rect.width  / 2
        const h_2 = canvas_rect.height / 2
        const ndc = new THREE.Vector4(viewport_x / w_2 - 1, (canvas_rect.height - viewport_y) / h_2 - 1, -1, 1)
        let view = ndc.applyMatrix4(inv_proj_m)
        view.multiplyScalar(1 / view.w)
        const direction = new THREE.Vector3(view.x, view.y, view.z).normalize().applyMatrix3(view_rot_m).normalize()
        const origin = new THREE.Vector4(HexaLab.app.camera().position.x, HexaLab.app.camera().position.y, HexaLab.app.camera().position.z, 1)
        origin.applyMatrix4(inv_world_m)
        Module.print("[Pick Filter] Origin: " + origin.x.toFixed(6) + " " + origin.y.toFixed(6) + " " + origin.z.toFixed(6))
        Module.print("[Pick Filter] Direction: " + direction.x.toFixed(6) + " " + direction.y.toFixed(6) + " " + direction.z.toFixed(6))
        return {
            origin:     origin,
            direction:  direction
        }
    },
})

HexaLab.filters.push(new HexaLab.PickFilter())
