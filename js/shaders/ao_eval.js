THREE.AOEval = {
    vertexShader: [
        "varying vec2 vUv;",
        "varying mat4 vProj;",
        "void main() {",
            "vUv = uv;",
            "vProj = projectionMatrix;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join( "\n" ),
    fragmentShader: [
        "uniform sampler2D tDepth;",
        "uniform sampler2D tVert;",
        "uniform sampler2D tNorm;",
        "uniform mat4 uModel;",
        "uniform mat4 uView;",
        "uniform vec3 uCamPos;",
        "uniform mat4 uProj;",
        "uniform mat4 uInvProj;",
        "uniform vec2 uSize;",
        "uniform float uDepthBias;",

        "varying vec2 vUv;",
        "varying mat4 vProj;",

        "#include <packing>",

        "float sample_depth(const in vec2 coord) {",
			"return unpackRGBAToDepth(texture2D(tDepth, coord));",
		"}",

        "vec3 sample_ndc(const in vec2 tex) {",
			"float x = tex.x * 2.0 - 1.0;",
		    "float y = tex.y * 2.0 - 1.0;",
		    "float z = sample_depth(tex);",
		    "return vec3(x, y, z);",
		"}",

		"vec3 ndc_to_view(const in vec3 ndc) {",
			"vec4 view = uInvProj * vec4(ndc, 1.0);",
			"return vec3(view.xyz / view.w);",
		"}",

        "vec3 sample_view(const in vec2 tex) {",
		    "return texture2D(tDepth, tex).xyz;",
		"}",

        "void main() {",
            "vec3 vert = texture2D(tVert, vUv).rgb;",
            "vec3 norm = texture2D(tNorm, vUv).rgb;",
            "vert = (uView * uModel * vec4(vert, 1.0)).xyz;",
            "norm = /*mat3(uView) * */ mat3(uModel) * norm;",
            "vec4 ndc = uProj * vec4(vert, 1.0);",
            "ndc /= ndc.w;",
            "vec2 ndc_uv = (ndc.xy + vec2(1.0, 1.0)) / 2.0;",
            //"vec3 sampled_ndc = sample_ndc(ndc_uv);",
            //"vec3 sampled_view = ndc_to_view(sampled_ndc);",
            "vec3 sampled_view = sample_view(ndc_uv);",
            "float Lo = 0.0;",
            "if (vert.z + uDepthBias >= sampled_view.z) {",
                "Lo = max(0.0, dot(norm, normalize(uCamPos)));",
            "}",
            "gl_FragColor = vec4(vec3( Lo ), 1.0);",
        "}"
    ].join( "\n" ),
}
