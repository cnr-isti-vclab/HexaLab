#pragma once

#include <mesh.h>
#include <ifilter.h>

namespace HexaLab {
    class PlaneFilter : public IFilter {
    private:
        // The plane.
        Hyperplane<float, 3>    plane;
        // A reference to the current mesh aabb is kept so that the offset input can be in the [0,1] range.
        // TODO make filters completely stateless?
        AlignedBox3f*           mesh_aabb;

    public:
        // Setters
        void set_plane_normal(float nx, float ny, float nz);
        void set_plane_offset(float offset); // offset in [0,1]
        
        // Getters
        Vector3f get_plane_normal();
        float get_plane_offset();   // return the offset from the center expressed in [0,1] range (0.5 is the center)
        float get_plane_world_offset();

        // Marks the elements to be filtered out
        void filter(Mesh& mesh);
        // Updates the mesh aabb reference and resets all settings to default 
        void on_mesh_set(Mesh& mesh);

    private:
        bool plane_cull_test(Mesh& mesh, Face& face);
    };
}
