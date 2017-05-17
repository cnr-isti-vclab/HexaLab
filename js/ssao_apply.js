
THREE.SSAOApply = {

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform sampler2D t1;",
		"uniform sampler2D t2;",

		"varying vec2 vUv;",

		"void main() {",
		    "vec4 c1 = texture2D(t1, vUv);",
		    "vec4 c2 = texture2D(t2, vUv);",
		    "gl_FragColor = c1 * c2;// mix(c1, c2, c2.a);",
		"}"

	].join( "\n" )

};