THREE.SSAOBlur = {


	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		// Uniform parameters
		"uniform vec2 uSize;",
		"uniform sampler2D uTexture;",

		// VS Output
		"varying vec2 vUv;",

		"void main() {",
			"vec2 texelSize = 1.0 / uSize;",
		   	"float result = 0.0;",
		   	"for (int x = -2; x < 2; ++x) {",
	    		"for (int y = -2; y < 2; ++y) {",
		         	"vec2 offset = vec2(float(x), float(y)) * texelSize;",
		         	"result += texture2D(uTexture, vUv + offset).r;",
	      		"}",
	   		"}",
		 
		 	"result = result / 16.0;",
			"gl_FragColor = vec4(vec3(result), 1.0);",
		"}"

	].join( "\n" )

};