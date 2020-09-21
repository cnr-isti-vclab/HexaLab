#pragma once

#include "mesh.h"

namespace HexaLab {

    class Builder {
      public:
        // indices should be a vector of size multiple of 8. each tuple of 8 consecutive indices represents an hexahedra.
        static void build ( Mesh& mesh, const vector<Vector3f>& verts, const vector<Index>& indices );
        static bool validate ( Mesh& mesh );
      private:
        static void init_build( Mesh& mesh );
        static void add_vertices( Mesh& mesh, const vector<Vector3f>& verts );
        static void add_hexas( Mesh& mesh, const vector<Index>& indices, int from = 0, int to = 100 );
        static void compute_normal( Mesh& mesh, Face& face);

        static void add_hexa ( Mesh& mesh, const Index* hexa );
    };
}


