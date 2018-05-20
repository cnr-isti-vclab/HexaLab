THREE.FresnelTransparency = {

    vertexShader: [
        "varying vec3 vNorm;",
        "void main() {",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "vNorm =  normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal);",
        "}"

    ].join( "\n" ),

    fragmentShader: [
        "varying vec3 vNorm;",

        "uniform vec3 uColor;",
        "uniform float uAlpha;",

        "void main() {",
            "vec3 view = cameraPosition - gl_FragCoord",
            "gl_FragColor = vec4 ( uColor, uAlpha * ( 1 - abs ( dot ( vNorm, view ) ) ) );",
        "}"

    ].join( "\n" )

};
