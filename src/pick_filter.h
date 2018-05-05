#pragma once

#include <vector>

#include <common.h>
#include <mesh.h>
#include <ifilter.h>

namespace HexaLab {
    class PickFilter : public IFilter {
    private:
        // Sorted array of indices of filtered hexas
        std::vector<Index> filtered_hexas;
        // A reference to the mesh is kept to be albe to raycast it later
        Mesh* mesh = nullptr;

    public:
        // Raycasts the mesh and adds/removes the closest/farthest intersecting hexa (if any) to/from the filtered array.
        // Returns the index of the filtered/unfiltered element if any, -1 otherwise.
        Index filter_hexa(Vector3f origin, Vector3f direction);
        Index unfilter_hexa(Vector3f origin, Vector3f direction);
        void clear_filtered_hexas() { this->filtered_hexas.clear(); }
        void filter_hexa_idx(Index idx);

        // Applies the filtered_hexas list to the mesh.
        void filter(Mesh& mesh);
        // Simply clears the filtered hexas array.
        void on_mesh_set(Mesh& mesh);

    private:
        bool hexa_ray_test(Hexa& hexa, Vector3f origin, Vector3f direction, float* min_t, float* max_t);
    };

}