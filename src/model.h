#ifndef _HL_MODEL_H_
#define _HL_MODEL_H_

#include <mesh.h>

namespace HexaLab {
    using namespace Eigen;
    using namespace std;
    
    // This class is used to prepare/manage buffers for rendering stuff 
    // For sake of simplicity there is the huge assumption that everything is NOT indexed
    // Motivation: hopefully rendering will not be an issue....

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
