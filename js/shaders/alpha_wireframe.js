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

        "void main() {",
            "gl_FragColor = vec4(vColor, vAlpha);",
        "}"

    ].join( "\n" )

};
