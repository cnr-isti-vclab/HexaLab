#ifndef _HL_MODEL_H_
#define _HL_MODEL_H_

#include <common.h>
#include <mesh.h>

#include <vector>
#include <Eigen/Dense>

namespace HexaLab {
    using namespace Eigen;
    using namespace std;
    
    struct Model {
        vector<Vector3f> surface_vert_pos;
        vector<Vector3f> surface_vert_norm;
        vector<Vector3f> surface_vert_color;
        vector<Vector3f> wireframe_vert_pos;
        vector<Vector3f> wireframe_vert_color;
        bool dirty_flag = false;

        void clear() {
            surface_vert_pos.clear();
            surface_vert_norm.clear();
            surface_vert_color.clear();
            wireframe_vert_pos.clear();
            wireframe_vert_color.clear();
            dirty_flag = false;
        }
    };
}

#endif
