THREE.FresnelTransparency = {

    vertexShader: [
        "varying vec3 vNorm;",
        "varying vec3 vPos;",
        "void main() {",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "vNorm =  normalize(mat3(modelMatrix) * normal);",
            "vPos =  (modelMatrix * vec4(position, 1.0)).xyz;",
        "}"

    ].join( "\n" ),

    fragmentShader: [
        "varying vec3 vPos;",
        "varying vec3 vNorm;",

        "uniform vec3 uColor;",
        "uniform float uAlpha;",

        "void main() {",
            "vec3 view = normalize(cameraPosition - vPos);",
            "gl_FragColor = vec4 ( uColor, uAlpha * ( 1.0 - abs ( dot ( vNorm, view ) ) ) );",
        "}"

    ].join( "\n" )

};
