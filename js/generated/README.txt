Use emscripten to compile cpp to js. 
e.g. em++ --bind -o html/js/generated/hexalab_cpp.js -s TOTAL_MEMORY=500000000 cpp/hexalab.cpp cpp/mesh.cpp -IC:cpp/eigen
