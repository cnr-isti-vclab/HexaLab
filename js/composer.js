/*
Inspired by alteredq EffectComposer.js  / http://alteredqualia.com/
Slightly trimmed down version.
*/

HexaLab.Composer = function (renderer, render_target) {
	this.renderer = renderer;

	if (render_target === undefined) {
		var size = renderer.getSize();
		render_target = new THREE.WebGLRenderTarget(size.width, size.height, {
		    stencilBuffer: false
		});
	}

	this.render_target_1 = render_target;
	this.render_target_2 = render_target.clone();

	this.write_buffer = this.render_target_1;
	this.read_buffer = this.render_target_2;

	this.passes = [];
};

Object.assign(HexaLab.Composer.prototype, {
	swap_buffers: function() {
		var tmp = this.read_buffer;
		this.read_buffer = this.write_buffer;
		this.write_buffer = tmp;
	},

	add_pass: function (pass) {
		this.passes.push(pass);
		var size = this.renderer.getSize();
		pass.set_size(size.width, size.height);
	},

	insertPass: function (pass, index) {
	    this.passes.splice(index, 0, pass);
	    var size = this.renderer.getSize();
	    pass.set_size(size.width, size.height);
	},

	render: function () {
		for (var i = 0; i < this.passes.length; ++i) {
			if (!this.passes[i].enabled) continue;

			this.passes[i].render(this.renderer, this.writeBuffer, this.readBuffer);

			if (this.passes[i].needsSwap) this.swapBuffers();
		}
	},

	setSize: function (width, height) {
		this.render_target_1.setSize(width, height);
		this.render_target_2.setSize(width, height);

		for (var i = 0; i < this.passes.length; ++i) {
			this.passes[i].set_size(width, height);
		}
	}
} );


HexaLab.Pass = function () {
	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;
	this.renderToScreen = false;
};

Object.assign(HexaLab.Pass.prototype, {
	set_size: function(width, height) {},

	render: function (renderer, writeBuffer, readBuffer) {
		console.error( "THREE.Pass: .render() must be implemented in derived pass." );
	}
});


HexaLab.RenderPass = function (scene, camera, override_material, clear_color, clear_alpha) {
    HexaLab.Pass.call(this);
    this.clear = true;

    this.scene = scene;
    this.camera = camera;
    this.override_material = override_material;
    this.clear_color = clear_color;
    this.clear_alpha = (clear_alpha !== undefined) ? clearAlpha : 0;
    this.clear_depth = false;
    this.needs_swap = false;
};

HexaLab.RenderPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {
    constructor: HexaLab.RenderPass,

    render: function (renderer, write_buffer, read_buffer) {

        var old_auto_clear = renderer.autoClear;
        renderer.autoClear = false;

        this.scene.override_material = this.overrideMaterial;

        var old_clear_color, old_clear_alpha;

        if (this.clear_color) {
            old_clear_color = renderer.getClearColor().getHex();
            old_clear_alpha = renderer.getClearAlpha();

            renderer.setClearColor(this.clearColor, this.clearAlpha);
        }

        if (this.clearDepth) {
            renderer.clearDepth();
        }

        renderer.render(this.scene, this.camera, this.render_to_screen ? null : readBuffer, this.clear);

        if (this.clearColor) {

            renderer.setClearColor(oldClearColor, oldClearAlpha);

        }

        this.scene.overrideMaterial = null;
        renderer.autoClear = oldAutoClear;
    }

});