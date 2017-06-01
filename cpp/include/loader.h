#ifndef _HL_LOADER_H_
#define _HL_LOADER_H_

#include <common.h>

#include <vector>

#include <Eigen/Dense>

namespace HexaLab { 
    using namespace Eigen;
    using namespace std;

    class Loader {
    public:
        // The two vectors will be cleared and then filled with loaded mesh data.
        static bool load(const string& path, vector<Vector3f>& out_verts, vector<Index>& out_indices);
    };
}

#endif
