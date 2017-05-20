THREE.SSAOBlur = {

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join( "\n" ),

	fragmentShader: [

		// Uniform parameters
		"uniform sampler2D tSSAO;",
		"uniform sampler2D tDepth;",
		"uniform sampler2D tNormals;",
		"uniform vec2 uSize;",
		"uniform float depthThreshold;",
		"uniform mat4 uInvProj;",

		// VS Output
		"varying vec2 vUv;",

		"#include <packing>",

		"float getLinearDepth(const in vec2 coord) {",
			"return unpackRGBAToDepth(texture2D(tDepth, coord));",
		"}",

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

		"float weight(const float viewZ, const in vec3 norm, const in vec2 sampleTex) {",
			"float sampleZ = getViewPos(getScreenPos(sampleTex)).z;",
			"vec3 sampleNorm = texture2D(tNormals, sampleTex).xyz;",
			"return abs(viewZ - sampleZ) < depthThreshold && dot(norm, sampleNorm) > 0.7 ? 1.0 : 0.0;",
		"}",

		"void main() {",
			"vec2 texelSize = 1.0 / uSize;",
		   	"float result = 0.0;",
		   	"float weightSum = 0.0;",
         	"float viewZ = getViewPos(getScreenPos(vUv)).z;",
		   	"vec3 norm = texture2D(tNormals, vUv).xyz;",
		   	"for (int x = -2; x < 2; ++x) {",
	    		"for (int y = -2; y < 2; ++y) {",
		         	"vec2 offset = vec2(float(x), float(y)) * texelSize;",
	         		"float w = weight(viewZ, norm, vUv + offset);",
	         		"result += texture2D(tSSAO, vUv + offset).r * w;",
	         		"weightSum += w;",
	      		"}",
	   		"}",
		 
		 	"result = result / weightSum + 0.0001;",
			"gl_FragColor = vec4(vec3(result), 1.0);",
			//"float ssao = texture2D(tSSAO, vUv).r;",
			//"gl_FragColor = vec4(vec3(ssao), 1.0);",
		"}"

	].join( "\n" )

};