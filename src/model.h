#ifndef _HL_MODEL_H_
#define _HL_MODEL_H_

#include <mesh.h>

namespace HexaLab {
    using namespace Eigen;
    using namespace std;
    
    struct Model {
        vector<Vector3f> surface_vert_pos;
        vector<Vector3f> surface_vert_norm;
        vector<Vector3f> surface_vert_color;
        vector<Vector3f> wireframe_vert_pos;
        vector<Vector3f> wireframe_vert_color;

        void clear() {
            surface_vert_pos.clear();
            surface_vert_norm.clear();
            surface_vert_color.clear();
            wireframe_vert_pos.clear();
            wireframe_vert_color.clear();
        }
    };
}

#endif
