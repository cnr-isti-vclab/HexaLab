THREE.AlphaPass = {

	vertexShader: [
		"void main() {",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"}"

	].join( "\n" ),

	fragmentShader: [
        "uniform float uAlpha;",

        "void main() {",
			"gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);",
		"}"

	].join( "\n" )

};
