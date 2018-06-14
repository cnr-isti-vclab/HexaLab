#pragma once

#include <mesh.h>

namespace HexaLab {
    class Builder {

        /*

            The expected input are two faces having no edge in common and opposite front face vertices winding (same if looking from the same pov), like so:

             5------4
            /|     /|
           1------0 |
           | |    | |
           | 6----|-7
           |/     |/
           2------3

             7------6
            /|     /|
           3------2 |
           | |    | |
           | 4----|-5
           |/     |/
           0------1

           This ordering is expected to be coherent across all hexas inside a mesh file.

           The front face is defined arbitrarily based on the order in which the vertices are provided.
           Calling it 'front' is just a way to identify it, it doesn't necessarily have to be 'in front' of anything.

        */

        static constexpr Index hexa_face[6][4] = {
            { 0, 1, 2, 3 },   // Front
            { 5, 4, 7, 6 },   // Back
            { 4, 0, 3, 7 },   // Left
            { 1, 5, 6, 2 },   // Right
            { 4, 5, 1, 0 },   // Bottom
            { 6, 7, 3, 2 },   // Top
        };

        enum HexaFace {
            Front = 0,
            Back,
            Left,
            Right,
            Bottom,
            Top,
        };

      public:
        // Edges and faces are both temporarily stored into a table,
        // hashed by their vertices and mapped to their corresponding index in the mesh being built.
        struct EdgeMapKey {
            Index indices[2];

            EdgeMapKey ( const Index* indices ) {
                this->indices[0] = indices[0];
                this->indices[1] = indices[1];
                std::sort ( std::begin ( this->indices ), std::end ( this->indices ) );
            }

            bool operator== ( const EdgeMapKey& other ) const {
                return this->indices[0] == other.indices[0]
                       && this->indices[1] == other.indices[1];
            }

        };

        struct FaceMapKey {
            Index indices[4];

            FaceMapKey ( const Index* indices ) {
                this->indices[0] = indices[0];
                this->indices[1] = indices[1];
                this->indices[2] = indices[2];
                this->indices[3] = indices[3];
                std::sort ( std::begin ( this->indices ), std::end ( this->indices ) );
            }

            bool operator== ( const FaceMapKey& other ) const {
                return this->indices[0] == other.indices[0]
                       && this->indices[1] == other.indices[1]
                       && this->indices[2] == other.indices[2]
                       && this->indices[3] == other.indices[3];
            }
        };

        static std::unordered_map<EdgeMapKey, Index> edges_map;
        static std::unordered_map<FaceMapKey, Index> faces_map;

        static Index add_edge ( Mesh& mesh, Index h, Index f, const Index* edge );
        static Index add_face ( Mesh& mesh, Index h, const Index* face );
        static Index add_hexa ( Mesh& mesh, const Index* hexa );

        // The Index values refer to darts
        static void link_edges ( Mesh& mesh, Index e1, Index e2 );
        static void link_faces ( Mesh& mesh, Index f1, Index f2 );
        static void link_hexas ( Mesh& mesh, Index f1, Index f2 );

      public:
        // indices should be a vector of size multiple of 8. each tuple of 8 consecutive indices represents an hexahedra.
        static void build ( Mesh& mesh, const vector<Vector3f>& verts, const vector<Index>& indices );
        static bool validate ( Mesh& mesh );
      private:
        static void update_surface_status( Mesh& mesh );
        static void init_build( Mesh& mesh );
        static void add_vertices( Mesh& mesh, const vector<Vector3f>& verts );
        static void add_hexas( Mesh& mesh, const vector<Index>& indices, int from = 0, int to = 100 );

    };
}

namespace std {
    template <> struct hash<HexaLab::Builder::EdgeMapKey> {
        size_t operator() ( const HexaLab::Builder::EdgeMapKey& e ) const  {
            return e.indices[0] + e.indices[1];
        }
    };
}

namespace std {
    template <> struct hash<HexaLab::Builder::FaceMapKey> {
        size_t operator() ( const HexaLab::Builder::FaceMapKey& f ) const  {
            return f.indices[0] + f.indices[1] + f.indices[2] + f.indices[3];
        }
    };
}
