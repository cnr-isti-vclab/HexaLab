#ifndef _HL_PLANE_FILTER_H_
#define _HL_PLANE_FILTER_H_

#include <mesh.h>
#include <model.h>
#include <ifilter.h>

namespace HexaLab {
    class PlaneFilter : public IFilter {
    private:
        Hyperplane<float, 3> plane;
        
        Mesh* mesh;

    public:
        void set_plane_normal(float nx, float ny, float nz);
        void set_plane_offset(float offset); // offset in [0,1]
        
        Vector3f get_plane_normal();
        float get_plane_offset();   // return the offset from the center expressed in [0,1] range (0.5 is the center)
        float get_plane_world_offset();

        void filter(Mesh& mesh);
    
        void on_mesh_set(Mesh& mesh) {
            this->mesh = &mesh;
        }

    private:
        bool plane_cull_test(Face& face);
    };
}

#endif
