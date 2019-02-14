#pragma once

#include <vector>

#include <common.h>
#include <mesh.h>
#include <ifilter.h>

namespace HexaLab {
    class PickFilter : public IFilter {
    private:
        // Sorted array of indices of filtered cells
        std::vector<Index> filtered_cells;
        std::vector<Index> filled_cells;
        // A reference to the mesh is kept to be albe to raycast it later
        Mesh* mesh = nullptr;

    public:

        void clear ();

        Index dig_cell(Vector3f origin, Vector3f direction);
        Index undig_cell(Vector3f origin, Vector3f direction);
        Index isolate_cell(Vector3f origin, Vector3f direction);

        void filter(Mesh& mesh);

        void on_mesh_set(Mesh& mesh);

        void add_one_to_filtered( Index idx );
        void add_one_to_filled( Index idx );

    private:
        void dig_cell_id(Index idx);
        void undig_cell_id(Index idx);
        void isolate_cell_id(Index idx);

        void raycast( Vector3f origin, Vector3f direction, Index &in , Index &out );

        bool face_ray_test(Face &face, Vector3f origin, Vector3f direction, float& max);
    };

}
