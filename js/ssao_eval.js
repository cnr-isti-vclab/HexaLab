THREE.SSAOEval = {

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"#extension GL_OES_standard_derivatives : enable", // emits a warning

		// Uniforms
		"uniform sampler2D tDepth;",
		"uniform sampler2D tNoise;",
		"uniform sampler2D tNormals;",
		"uniform vec3 uKernel[16];",
		"uniform float uRadius;",
		"uniform vec2 uSize;",
		"uniform mat4 uProj;",
		"uniform mat4 uInvProj;",
		"uniform mat4 uView;",

		// Consts
		"const float cameraNear = 0.1;",
		"const float cameraFar = 1000.0;",
		"const int numSamples = 16;",

		// VS Output
		"varying vec2 vUv;",

		
		// RGBA depth
		"#include <packing>",


		// Read the depth of a pixel from the depth buffer
		"float getLinearDepth(const in vec2 coord) {",
			"float cameraFarPlusNear = cameraFar + cameraNear;",
			"float cameraFarMinusNear = cameraFar - cameraNear;",
			"float cameraCoef = 2.0 * cameraNear;",

			"#ifdef USE_LOGDEPTHBUF",
				"float logz = unpackRGBAToDepth(texture2D(tDepth, coord));",
				"float w = pow(2.0, (logz / logDepthBufFC)) - 1.0;",
				"float z = (logz / w) + 1.0;",
			"#else",
				"float z = texture2D(tDepth, coord).r;",
			"#endif",
			"return z;",
			//"return cameraCoef / (cameraFarPlusNear - z * cameraFarMinusNear);",
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
		"vec3 getNorm(const in vec3 viewPos) {",
//			"if (viewPos.z < -10.0) {",
//				"return vec3(0.0, 0.0, 0.0);",
//			"}",
			"vec3 norm = cross(normalize(dFdx(viewPos)), normalize(dFdy(viewPos)));",
			"return norm;",
		"}",

		// http://theorangeduck.com/page/pure-depth-ssao
		"vec3 getNorm2(const in float depth, const in vec2 uv) {",
			"const vec2 offset1 = vec2(0.0,0.001);",
		  	"const vec2 offset2 = vec2(0.001,0.0);",
		  
		  	"float depth1 = getLinearDepth(uv + offset1);",
		  	"float depth2 = getLinearDepth(uv + offset2);",
		  
		  	"vec3 p1 = vec3(offset1, depth1 - depth);",
		  	"vec3 p2 = vec3(offset2, depth2 - depth);",
		  
		  	"vec3 normal = cross(p1, p2);",
		  	"normal.z = -normal.z;",
		  
		  	"return normalize(normal);",
		"}",

		"void main() {",
			"vec2 uvScale = vec2(uSize.x / 4.0, uSize.y / 4.0);",
			"vec3 screenPos = getScreenPos(vUv);",
			"vec3 viewPos = getViewPos(screenPos);",
			//"vec3 normal = getNorm(viewPos);",
			//"vec3 normal = getNorm2(getLinearDepth(vUv), vUv);",
			//"vec3 normal = (mat3(uView) * vec3(0.0, 1.0, 0.0)).xyz;//getNorm2(getLinearDepth(vUv), vUv);",
			"vec3 normal = texture2D(tNormals, vUv).xyz;",
			"vec3 rotationVec = texture2D(tNoise, vUv * uvScale).xyz;",
			"vec3 tangent = normalize(rotationVec - normal * dot(rotationVec, normal));",
			"vec3 bitangent = cross(normal, tangent);",
			"mat3 rotationMatrix = mat3(tangent, bitangent, normal);",			

			"float occlusion = 0.0; const int q = 0;",
			"for (int i = 0; i < numSamples; ++i) {",
				"vec3 sample = rotationMatrix * uKernel[i] * uRadius + viewPos;",
				"vec4 sampleNDC = (uProj * vec4(sample, 1.0));",
				"sampleNDC.xyz /= sampleNDC.w;",
				"vec2 sampleUV = sampleNDC.xy * 0.5 + 0.5 ;",
				"vec3 sampleScreen = getScreenPos(sampleUV);",
				"vec3 sampleView = getViewPos(sampleScreen);",

				"float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(viewPos.z - sampleView.z));",
				"occlusion += (sampleView.z >= sample.z ? 1.0 : 0.0) * rangeCheck;",   
			"}",

			"occlusion = 1.0 - (occlusion / float(numSamples));",
			//"occlusion = 1.0 - occlusion;",
			"gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);",

			//"gl_FragColor = vec4(sampleView.z - viewPos.z, 0.0, 0.0, 1.0);",
		"}"

	].join( "\n" )

};

/*
THREE.SSAOEval = {

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"#extension GL_OES_standard_derivatives : enable", // emits a warning

		// Consts
		"const float cameraNear = 0.1;",
		"const float cameraFar = 1000.0;",
		"const int numSamples = 16;",

		// Uniforms
		"uniform sampler2D tDepth;",
		"uniform sampler2D tNoise;",
		"uniform vec3 uKernel[numSamples];",
		"uniform float uRadius;",
		"uniform vec2 uSize;",
		"uniform mat4 uProj;",
		"uniform mat4 uView;",
		"uniform mat4 uInvProj;",

		// VS Output
		"varying vec2 vUv;",
		
		// RGBA depth
		//"#include <packing>",


		// Read the depth of a pixel from the depth buffer
		"float getLinearDepth(const in vec2 coord) {",
				"float z = texture2D(tDepth, coord).r;",
			//"#endif",
			"return z;",
			//"return cameraCoef / (cameraFarPlusNear - z * cameraFarMinusNear);",
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

		"vec3 getNorm(const in vec3 viewPos) {",
//			"if (viewPos.z < -10.0) {",
//				"return vec3(0.0, 0.0, 0.0);",
//			"}",
			"vec3 norm = cross(normalize(dFdx(viewPos)), normalize(dFdy(viewPos)));",
			"return norm;",
		"}",

		"vec3 getNorm2(const in float depth, const in vec2 uv) {",
			"const vec2 offset1 = vec2(0.0,0.001);",
		  	"const vec2 offset2 = vec2(0.001,0.0);",
		  
		  	"float depth1 = getLinearDepth(uv + offset1);",
		  	"float depth2 = getLinearDepth(uv + offset2);",
		  
		  	"vec3 p1 = vec3(offset1, depth1 - depth);",
		  	"vec3 p2 = vec3(offset2, depth2 - depth);",
		  
		  	"vec3 normal = cross(p1, p2);",
		  	"normal.z = -normal.z;",
		  
		  	"return normalize(normal);",
		"}",

		"void main() {",
			"vec2 uvScale = vec2(uSize.x / 4.0, uSize.y / 4.0);",
			"vec3 screenPos = getScreenPos(vUv);",
			"vec3 viewPos = getViewPos(screenPos);",
			"vec3 normal = getNorm(viewPos);",
			//"vec3 normal = mat3(uView) * vec3(0.0, 1.0, 0.0);//getNorm2(getLinearDepth(vUv), vUv);",
			"vec3 noise = texture2D(tNoise, vUv * uvScale).xyz;",
			// https://graphics.stanford.edu/courses/cs148-10-summer/docs/2006--degreve--reflection_refraction.pdf
			// normal * dot(noise, normal) is the normal component of noise
			"vec3 tangent = normalize(noise - normal * dot(noise, normal));",
			"vec3 bitangent = cross(normal, tangent);",
			"mat3 rotationMatrix = mat3(tangent, bitangent, normal);",			

			"float occlusion = 0.0; const int q = 0;",
			"float acc = 0.0;",
			"for (int i = 0; i < numSamples; ++i) {",
				"vec3 sample = rotationMatrix * uKernel[i] * uRadius + viewPos;",
				"vec4 sampleNDC = (uProj * vec4(sample, 1.0));",
				"sampleNDC.xyz /= sampleNDC.w;",
				"vec2 sampleUV = sampleNDC.xy * 0.5 + 0.5 ;",
				"vec3 sampleScreenProj = getScreenPos(sampleUV);",
				"vec3 sampleViewProj = getViewPos(sampleScreenProj);",

				"float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(viewPos.z - sampleViewProj.z));",
				"occlusion += (sampleViewProj.z >= sample.z + 0.02 ? 1.0 : 0.0) * rangeCheck;",   
				//"acc += sampleViewProj.z - sample.z;",
			"}",

			"occlusion = 1.0 - (occlusion / float(numSamples));",
			//"occlusion = 1.0 - occlusion;",
			"gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);",

			//"gl_FragColor = vec4(acc / float(numSamples) * 10.0, 0, 0, 1.0);",
			//"gl_FragColor = vec4(normal, 1.0);",
		"}"

	].join( "\n" )

};
*/