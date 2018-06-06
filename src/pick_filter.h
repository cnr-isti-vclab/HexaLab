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
        std::vector<Index> filled_hexas;
        // A reference to the mesh is kept to be albe to raycast it later
        Mesh* mesh = nullptr;

    public:

        void clear ();

        Index dig_hexa(Vector3f origin, Vector3f direction);
        Index undig_hexa(Vector3f origin, Vector3f direction);

        void filter(Mesh& mesh);

        void on_mesh_set(Mesh& mesh);

    private:
        void dig_hexa(Index idx);
        void undig_hexa(Index idx);

        void raycast( Vector3f origin, Vector3f direction, Index &in , Index &out );

        bool face_ray_test(Face &face, Vector3f origin, Vector3f direction, float& max);
    };

}
