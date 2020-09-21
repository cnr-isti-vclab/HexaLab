#pragma once

#include "mesh.h"

namespace HexaLab { 
    using namespace Eigen;
    using namespace std;

    class Loader {
    public:
        // The two vectors will be cleared and then filled with loaded mesh data.
        static bool load     (const string& path, vector<Vector3f>& out_verts, vector<Index>& out_indices);
        static bool load_MESH(const string& path, vector<Vector3f>& out_verts, vector<Index>& out_indices);
        static bool load_VTK (const string& path, vector<Vector3f>& out_verts, vector<Index>& out_indices);
    };
}
