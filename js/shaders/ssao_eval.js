THREE.SSAOEval = {

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join( "\n" ),

	fragmentShader: [

		// Uniforms
		"uniform sampler2D tDepth;",
		"uniform sampler2D tNoise;",
		"uniform sampler2D tNormals;",
		"uniform vec3 uKernel[numSamples];",
		"uniform float uRadius;",
		"uniform vec2 uSize;",
		"uniform mat4 uProj;",
		"uniform mat4 uInvProj;",
		"uniform mat4 uView;",

		// VS Output
		"varying vec2 vUv;",


		"float getLinearDepth(const in vec2 coord) {",
			"return texture2D(tDepth, coord).r;",
		"}",

		// https://mynameismjp.wordpress.com/2009/03/10/reconstructing-position-from-depth/
		"vec3 getScreenPos(const in vec2 tex) {",
			"float x = tex.x * 2.0 - 1.0;",
		    "float y = tex.y * 2.0 - 1.0;",
		    "float z = getLinearDepth(tex);",
		    "return vec3(x, y, z);",
		"}", 

		"vec3 getViewPos(const in vec3 screenPos) {",
			"vec4 viewPos = uInvProj * vec4(screenPos, 1.0);",
			"return vec3(viewPos.xyz / viewPos.w);",
		"}",

		// http://stackoverflow.com/questions/37627254/how-to-reconstruct-normal-from-depth-without-artifacts-on-edge
		/*"#extension GL_OES_standard_derivatives : enable", // emits a warning
		"vec3 getNorm(const in vec3 viewPos) {",
			"vec3 norm = cross(normalize(dFdx(viewPos)), normalize(dFdy(viewPos)));",
			"return norm;",
		"}",*/

		// http://theorangeduck.com/page/pure-depth-ssao
		/*"vec3 getNorm2(const in float depth, const in vec2 uv) {",
			"const vec2 offset1 = vec2(0.0,0.001);",
		  	"const vec2 offset2 = vec2(0.001,0.0);",
		  
		  	"float depth1 = getLinearDepth(uv + offset1);",
		  	"float depth2 = getLinearDepth(uv + offset2);",
		  
		  	"vec3 p1 = vec3(offset1, depth1 - depth);",
		  	"vec3 p2 = vec3(offset2, depth2 - depth);",
		  
		  	"vec3 normal = cross(p1, p2);",
		  	"normal.z = -normal.z;",
		  
		  	"return normalize(normal);",
		"}",*/

		// https://graphics.stanford.edu/courses/cs148-10-summer/docs/2006--degreve--reflection_refraction.pdf
		"vec3 normalComponent(const in vec3 normal, const in vec3 vector) {",
			"return normal * dot(vector, normal);",
		"}",

		// http://john-chapman-graphics.blogspot.it/2013/01/ssao-tutorial.html
		"void main() {",
			"vec2 uvScale = vec2(uSize.x / 4.0, uSize.y / 4.0);",	// map screen uv coords to wrapped noise texture uv coords
			"vec3 screenPos = getScreenPos(vUv);",
			"vec3 viewPos = getViewPos(screenPos);",
			"vec3 normal = texture2D(tNormals, vUv).xyz;",
			"vec3 noise = texture2D(tNoise, vUv * uvScale).xyz;",
			"vec3 tangent = normalize(noise - normalComponent(normal, noise));",
			"vec3 bitangent = cross(normal, tangent);",
			"mat3 rotationMatrix = mat3(tangent, bitangent, normal);",

			"float occlusion = 0.0;",
			"if (screenPos.z < 1.0) {",	// remove darkened background
				"for (int i = 0; i < numSamples; ++i) {",
					"vec3 sample = rotationMatrix * uKernel[i] * uRadius + viewPos;",
					"vec4 sampleNDC = (uProj * vec4(sample, 1.0));",
					"sampleNDC.xyz /= sampleNDC.w;",
					"vec2 sampleUV = sampleNDC.xy * 0.5 + 0.5 ;",
					"vec3 sampleScreen = getScreenPos(sampleUV);",
					"vec3 sampleView = getViewPos(sampleScreen);",

					"float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(viewPos.z - sampleView.z));",
					"occlusion += (sampleView.z > sample.z ? 1.0 : 0.0) * rangeCheck;",   
				"}",
			"}",

			"occlusion = 1.0 - (occlusion / float(numSamples));",
			"gl_FragColor = vec4(vec3(occlusion), 1.0);",
		"}"

	].join( "\n" )

};
