#pragma once

#include "mesh.h"

namespace HexaLab { 
    using namespace Eigen;
    using namespace std;

    class Loader {
    public:
        // The two vectors will be cleared and then filled with loaded mesh data.
        // load() dispatches on the file extension. Files ending in ".gz" are
        // transparently gunzipped (native builds only; in the Emscripten/browser
        // build gzip is decompressed in JS before the data reaches the loader).
        static bool load     (const string& path,   vector<Vector3f>& out_verts, vector<Index>& out_indices);
        static bool load_MESH(std::istream& stream, vector<Vector3f>& out_verts, vector<Index>& out_indices);
        static bool load_VTK (std::istream& stream, vector<Vector3f>& out_verts, vector<Index>& out_indices);
    };
}
