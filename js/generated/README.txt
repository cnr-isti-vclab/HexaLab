Use emscripten to compile cpp to js. 
e.g. em++ --bind -o html/js/generated/hexalab_cpp.js -s TOTAL_MEMORY=500000000 c:\Code\HexaLab\cpp\hexalab_js.cpp cpp/mesh.cpp cpp/loader.cpp cpp/builder.cpp cpp/visualizer.cpp cpp/mesh_navigator.cpp -Icpp/eigen
