THREE.AlphaWireframeMaterial = {

    vertexShader: [
        "attribute float alpha;",

        "varying float vAlpha;",
        "varying vec3 vColor;",

        "void main() {",
            "vColor = color;",
            "vAlpha = alpha;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"

    ].join( "\n" ),

    fragmentShader: [
        "varying float vAlpha;",
        "varying vec3 vColor;",

        "uniform bool uMixAlpha;",
        "uniform float uAlpha;",

        "void main() {",
            "float alpha = uMixAlpha ? vAlpha * uAlpha : uAlpha;",
            "gl_FragColor = vec4(vColor, alpha);",
        "}"

    ].join( "\n" )

};
