#pragma once

#include "ifilter.h"

namespace HexaLab {
    class PlaneFilter : public IFilter {
    private:
        // The plane.
        Vector3f normal;
        float offset;
        float offset01; // in 0..1

        // A reference to the current mesh aabb is kept so that the offset input can be in the [0,1] range.
        // TODO make filters completely stateless?
        Mesh*           		mesh;
        float min_offset, max_offset;

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
        bool cell_test(const Mesh& mesh, const Cell& c);
        void update_min_max_offset();
    };
}
