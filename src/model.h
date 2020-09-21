#pragma once

#include "common.h"
#include "mesh.h"

namespace HexaLab {
    using namespace Eigen;
    using namespace std;
    
    // GPU geometry buffers container 

    struct Model {
        vector<Vector3f> surface_vert_pos;
        vector<Vector3f> surface_vert_norm;
        vector<Vector3f> surface_vert_color;
        vector<Index>    surface_ibuffer;
        vector<Vector3f> wireframe_vert_pos;
        vector<Vector3f> wireframe_vert_color;
        vector<float>    wireframe_vert_alpha;

        void clear() {
            surface_vert_pos.clear();
            surface_vert_norm.clear();
            surface_vert_color.clear();
            surface_ibuffer.clear();
            wireframe_vert_pos.clear();
            wireframe_vert_color.clear();
            wireframe_vert_alpha.clear();
        }

        void add_surf_vert(Vector3f pos, Vector3f col){
            surface_vert_pos.push_back(pos);
            surface_vert_color.push_back(col);
        }
        void add_wire_vert(Vector3f pos, Vector3f col){
            wireframe_vert_pos.push_back(pos);
            wireframe_vert_color.push_back(col);
        }


    };
}
