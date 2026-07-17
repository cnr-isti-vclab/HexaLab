"use strict;"

// --------------------------------------------------------------------------------
// UI
// --------------------------------------------------------------------------------
HexaLab.UI.pick_enabled        = $('#pick_enabled')
HexaLab.UI.pick_button         = $('#pick_button')
HexaLab.UI.fill_button         = $('#fill_button')
HexaLab.UI.isolate_button      = $('#isolate_button')
HexaLab.UI.pick_clear_button   = $('#pick_clear_button')
HexaLab.UI.pick_menu_content   = $('#pick_menu *')

HexaLab.UI.pick_menu_content.prop('disabled', true)

// --------------------------------------------------------------------------------
// Filter class
// --------------------------------------------------------------------------------
HexaLab.PickFilter = function () {
    // Ctor
    HexaLab.Filter.call(this, new Module.PickFilter(), 'Pick');

    // Listener
    var self = this;

    HexaLab.UI.pick_button.click(function () {
		self.brush = ((self.brush == 1) ? 0 : 1);
        self.updateBrush()
    })
    HexaLab.UI.fill_button.click(function () {
		self.brush = ((self.brush == 2) ? 0 : 2);
        self.updateBrush()
    })
    HexaLab.UI.isolate_button.click(function () {
		self.brush = ((self.brush == 3) ? 0 : 3);
        self.updateBrush()
    })
    HexaLab.UI.pick_clear_button.click(function () {
        self.clear()
		self.brush = 0
		self.updateBrush()
    })

    // State
    this.filtered_hexas = []
    this.filled_hexas   = []
    this.brush = 0

    this.default_settings = {
        enabled: false,
        filtered_hexas: []
    }

    this.mousedown_listener = this.on_mouse_down.bind(this)
    this.mouseup_listener   = this.on_mouse_up.bind(this)
}

HexaLab.PickFilter.prototype = Object.assign(Object.create(HexaLab.Filter.prototype), {
	
	unactiveCol : HexaLab.UI.pick_button.css('background'),
	
	activeCol : 'rgb(200,200,255)',
	

    // Api
    get_settings: function () {
        return {
            enabled: this.backend.enabled,
            filtered_hexas: this.filtered_hexas,
            filled_hexas: this.filled_hexas
        }
    },

    set_settings: function (settings) {
        //this.enable(settings.enabled)
        this.set_lists(settings.filtered_hexas, settings.filled_hexas)
        
    },

    on_mesh_change: function (mesh) {
        this.clear()
        HexaLab.UI.pick_menu_content.prop('disabled', false)
    },

    on_clear: function () {
        HexaLab.UI.canvas_container.css('cursor', "default");
    },

    set_lists: function (list_filtered, list_filled) {
		this.backend.clear();
        this.filtered_hexas = list_filtered
		this.filled_hexas = list_filled

        for (let i = 0; i < list_filtered.length; ++i) {
            this.backend.add_one_to_filtered(list_filtered[i])
        }
        for (let i = 0; i < list_filled.length; ++i) {
            this.backend.add_one_to_filled(list_filled[i])
        }
        HexaLab.app.queue_buffers_update()
    },

	updateBrush : function (){
		HexaLab.UI.pick_button   .css('background',(this.brush==1)?this.activeCol:this.unactiveCol );
		HexaLab.UI.fill_button   .css('background',(this.brush==2)?this.activeCol:this.unactiveCol );
		HexaLab.UI.isolate_button.css('background',(this.brush==3)?this.activeCol:this.unactiveCol );
		// Disable camera controls while a pick brush is active. ArcballControls
		// otherwise binds CTRL/SHIFT (and left-drag) to pan/rotate, which would
		// intercept the dig/undig clicks. It is re-enabled when the brush clears.
		if (HexaLab.app && HexaLab.app.controls) {
			HexaLab.app.controls.enabled = (this.brush == 0)
		}
		switch (this.brush) {
		case 0:
			document.removeEventListener('pointerdown', this.mousedown_listener)
			document.removeEventListener('pointerup',   this.mouseup_listener)		
			HexaLab.UI.canvas_container.css('cursor', "auto")
			break;
		case 1:
			document.addEventListener('pointerdown', this.mousedown_listener)
			document.addEventListener('pointerup',   this.mouseup_listener)	
			HexaLab.UI.canvas_container.css('cursor', "url('img/pointer24_minus.png') 9 2,alias")
			break;
		case 2:
			document.addEventListener('pointerdown', this.mousedown_listener)
			document.addEventListener('pointerup',   this.mouseup_listener)	
			HexaLab.UI.canvas_container.css('cursor', "url('img/pointer24_plus.png') 9 2,copy")
			break;
		case 3:
			document.addEventListener('pointerdown', this.mousedown_listener)
			document.addEventListener('pointerup',   this.mouseup_listener)	
			HexaLab.UI.canvas_container.css('cursor', "url('img/pointer24.png') 9 2,pointer")
			break;
		}
	},
	
	setBrush: function (b){
		if (this.brush!=b)  {
			this.brush = b;
			this.updateBrush();
		}
	},
	

    clear: function () {
        this.backend.clear()
        this.filtered_hexas = []
        this.filled_hexas   = []
        HexaLab.app.queue_buffers_update()
    },

	
    // pick/fill click callbacks
    on_mouse_down: function (e) {
        this.clientX = e.clientX
        this.clientY = e.clientY
    },

    on_mouse_up: function (e) {

        if (this.clientX != e.clientX || this.clientY != e.clientY) return

        if (this.brush == 1) {
            this.on_pick(e.clientX, e.clientY)
        } else if (this.brush == 2) {
            this.on_fill(e.clientX, e.clientY)
        }  else if (this.brush == 3) {
            this.on_isolate(e.clientX, e.clientY)
        }
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
        const i = this.backend.dig_hexa(p_origin, p_direction)
		console.log("DIG ID: "+i)
        if (i != -1) {
            const idx = this.filled_hexas.indexOf(i)
            if (idx != -1) {
                this.filled_hexas.splice(idx, 1)
            } else {
                this.filtered_hexas.push(i)
                this.filtered_hexas.sort()   
            }
            HexaLab.app.queue_buffers_update()
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
        const i = this.backend.undig_hexa(p_origin, p_direction)
		console.log("UNDIG ID: "+i)
        if (i != -1) {
            let idx = this.filtered_hexas.indexOf(i);
            if (idx != -1) {
                this.filtered_hexas.splice(idx, 1);
            } else {
                this.filled_hexas.push(i)
                this.filled_hexas.sort()
            }
            HexaLab.app.queue_buffers_update()
        }
    },

    on_isolate: function (x, y) {
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
        const i = this.backend.isolate_hexa(p_origin, p_direction)
		console.log("ISOLATE ID: "+i)
        if (i != -1) {
			this.filtered_hexas = [-1]
            this.filled_hexas = [i]
            HexaLab.app.queue_buffers_update()
			this.brush = 0
			this.updateBrush()
        }
    },

    make_ray: function (client_x, client_y) {
        const canvas_rect = HexaLab.app.canvas.element.getBoundingClientRect()
        // click on canvas check
        if (canvas_rect.left > client_x || canvas_rect.right   < client_x) return
        if (canvas_rect.top  > client_y || canvas_rect.bottom  < client_y) return

        const cam = HexaLab.app.camera()

        // pixel -> normalized device coordinates
        const ndc_x =  ((client_x - canvas_rect.left) / canvas_rect.width)  * 2 - 1
        const ndc_y = -((client_y - canvas_rect.top)  / canvas_rect.height) * 2 + 1

        // Build the picking ray in world space using three.js unproject (robust,
        // and independent of the near/far planes).
        const origin_world = cam.position.clone()
        const dir_world = new THREE.Vector3(ndc_x, ndc_y, 0.5).unproject(cam).sub(origin_world).normalize()

        // Transform the ray into the mesh's own coordinate system. The models
        // transform is a pure translation by mesh_offset, so the origin is
        // translated and the direction is left unchanged.
        const inv_world_m = HexaLab.app.viewer.get_models_transform().clone().invert()
        const origin    = origin_world.clone().applyMatrix4(inv_world_m)
        const direction = dir_world.clone().transformDirection(inv_world_m).normalize()

        Module.print("[Pick Filter] Origin: " + origin.x.toFixed(6) + " " + origin.y.toFixed(6) + " " + origin.z.toFixed(6))
        Module.print("[Pick Filter] Direction: " + direction.x.toFixed(6) + " " + direction.y.toFixed(6) + " " + direction.z.toFixed(6))
        return {
            origin:     origin,
            direction:  direction
        }
    },
})

var _nf = HexaLab.filters.length;
HexaLab.filters.push(new HexaLab.PickFilter())

$(document).keydown(function (e) {
    if ((e.keyCode == 16) && (!HexaLab.UI.fill_button.prop('disabled'))) { HexaLab.filters[_nf].setBrush( 2 ); } // shift  16
    if ((e.keyCode == 17) && (!HexaLab.UI.pick_button.prop('disabled'))) { HexaLab.filters[_nf].setBrush( 1 ); } // ctrl 17
	//if (e.keyCode == 18)  // alt  18
});

$(document).keyup(function (e) {
    if (e.keyCode == 16) HexaLab.filters[_nf].setBrush( 0 ); // shift  16
    if (e.keyCode == 17) HexaLab.filters[_nf].setBrush( 0 ); // ctrl  17
	//if (e.keyCode == 18) toggle_pick() // alt  18
});

window.onfocus = function () { HexaLab.filters[_nf].setBrush( 0 ); }; // recover from ctrl-tab