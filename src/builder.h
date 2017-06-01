#ifndef _HL_BUILDER_H_
#define _HL_BUILDER_H_

#include <common.h>
#include <mesh.h>

#include <unordered_map>
#include <algorithm>

namespace HexaLab {
    class Builder {

/*
    Expected hexa structure:

     6------7
    /|     /|
   2------3 |
   | |    | |
   | 5----|-4
   |/     |/
   1------0 

*/
       
        static constexpr Index hexa_face[6][4] = {
            { 5, 1, 2, 6 },   // Left 
            { 1, 0, 3, 2 },   // Front 
            { 0, 4, 7, 3 },   // Right 
            { 4, 5, 6, 7 },   // Back 
            { 5, 4, 0, 1 },   // Bottom 
            { 7, 6, 2, 3 },   // Top 
        };
         
    public:
        // Edges and faces are both temporarily stored into a table, 
        // hashed by their vertices and mapped to their corresponding index in the mesh being built.
        struct EdgeMapKey {
            Index indices[2];

            EdgeMapKey(const Index* indices) { 
                this->indices[0] = indices[0];
                this->indices[1] = indices[1];
                std::sort(std::begin(this->indices), std::end(this->indices));
            }

            bool operator==(const EdgeMapKey& other) const {
                return this->indices[0] == other.indices[0]
                    && this->indices[1] == other.indices[1];
            }

        };

        struct FaceMapKey {
            Index indices[4];

            FaceMapKey(const Index* indices) {
                this->indices[0] = indices[0];
                this->indices[1] = indices[1];
                this->indices[2] = indices[2];
                this->indices[3] = indices[3];
                std::sort(std::begin(this->indices), std::end(this->indices));
            }

            bool operator==(const FaceMapKey& other) const {
                return this->indices[0] == other.indices[0]
                    && this->indices[1] == other.indices[1]
                    && this->indices[2] == other.indices[2]
                    && this->indices[3] == other.indices[3];
            }
        };

        static std::unordered_map<EdgeMapKey, Index> edges_map;
        static std::unordered_map<FaceMapKey, Index> faces_map;

        static void add_edge(Mesh& mesh, Index h, Index f, const Index* edge);
        static void add_face(Mesh& mesh, Index h, const Index* face);
        static void add_hexa(Mesh& mesh, const Index* hexa);

    public:
        // indices should be a vector of size multiple of 8. each tuple of 8 consecutive indices represents an hexahedra.
        static void build(Mesh& mesh, const vector<Vector3f>& verts, const vector<Index>& indices);
        static bool validate(Mesh& mesh);
    };
}

namespace std {
	template <> struct hash<HexaLab::Builder::EdgeMapKey> {
		size_t operator()(const HexaLab::Builder::EdgeMapKey& e)const  {
			return e.indices[0] + e.indices[1];
		}
	};
}

namespace std {
	template <> struct hash<HexaLab::Builder::FaceMapKey> {
		size_t operator()(const HexaLab::Builder::FaceMapKey& f)const  {
			return f.indices[0] + f.indices[1] + f.indices[2] + f.indices[3];
		}
	};
}
    
#endif