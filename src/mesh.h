#ifndef _HL_MESH_H_
#define _HL_MESH_H_

#include <vector>
#include <unordered_map>
#include <algorithm>
#include <Eigen/Dense>
#include <Eigen/Geometry>

#include <common.h>
#include <mesh_navigator.h>
#include <hex_quality_color_maps.h>

namespace HexaLab {
    using namespace Eigen;
    using namespace std;

    // https://en.wikipedia.org/wiki/Generalized_map
    // TODO switch to combinatorial maps (half-edge structures) ?
    struct Dart {
        Index hexa_neighbor = -1;
        Index face_neighbor = -1;
        Index edge_neighbor = -1;
        Index vert_neighbor = -1;
        Index hexa = -1;
        Index face = -1;
        Index edge = -1;
        Index vert = -1;
  
        Dart(){}
        Dart(Index hexa, Index face, Index edge, Index vert) {
            this->hexa = hexa;
            this->face = face;
            this->edge = edge;
            this->vert = vert;
        }
  
        Dart(const Dart& other) = delete;
  
        Dart(const Dart&& other) {
            this->hexa_neighbor = other.hexa_neighbor;
            this->face_neighbor = other.face_neighbor;
            this->edge_neighbor = other.edge_neighbor;
            this->vert_neighbor = other.vert_neighbor;
            this->hexa          = other.hexa;
            this->face          = other.face;
            this->edge          = other.edge;
            this->vert          = other.vert;
        }
  
        bool operator==(const Dart& other) const {
            // TODO avoid comparing neighbors, only compare hexa/face/edeg/vert fields ? 
            return this->hexa_neighbor == other.hexa_neighbor
                && this->face_neighbor == other.face_neighbor
                && this->edge_neighbor == other.edge_neighbor
                && this->vert_neighbor == other.vert_neighbor
                && this->hexa          == other.hexa
                && this->face          == other.face
                && this->edge          == other.edge
                && this->vert          == other.vert;
        }
    };

    struct Hexa {
        Index dart      = -1;
        uint32_t mark   = 0;

        Hexa(){}
        Hexa(Index dart) { this->dart = dart; }
        bool operator==(const Hexa& other) const { return this->dart == other.dart; }
        bool operator!=(const Hexa& other) const { return !(*this == other); }
    };

    struct Face {
        Index dart = -1;
        Vector3f normal;

        Face(){}
        Face(Index dart) { this->dart = dart; }
        Face(Index dart, const Vector3f& norm) { this->dart = dart; this->normal = norm; }
        Face(Index dart, const Vector3f&& norm) { this->dart = dart; this->normal = norm; }

        bool operator==(const Face& other) const { return this->dart == other.dart; }
        bool operator!=(const Face& other) const { return !(*this == other); }
    };

    struct Edge {
        Index dart = -1;
        bool is_surface = false;

        Edge(){}
        Edge(int32_t dart) { this->dart = dart; }
        bool operator==(const Edge& other) const { return this->dart == other.dart; }
        bool operator!=(const Edge& other) const { return !(*this == other); }
    };

    struct Vert {
        Index dart = -1;
        Vector3f position;

        Vert(){}
        Vert(Vector3f position) { this->position = position; }
        Vert(Vector3f position, Index dart) { this->position = position; this->dart = dart; }
        // TODO avoid comparing the position, only compare the dart field ?
        bool operator==(const Vert& other) const { return this->dart == other.dart && this->position == other.position; }
        bool operator!=(const Vert& other) const { return !(*this == other); }
    };

    class Mesh {
        // As the name suggests, the Builder class is responsible for building a Mesh instance, given the file parser output.
    friend class Builder;
    
    private:
        // Marks are used to flag the visibility of elements. If an element's mark field equals to the mesh mark field,
        // that element is currently visible. Otherwise, it means that is has been filtered and should not be displayed.
        uint32_t current_mark = 0;

    public:
        vector<Hexa> hexas;
        vector<Face> faces;
        vector<Edge> edges;
        vector<Vert> verts;
        vector<Dart> darts;

        AlignedBox3f aabb;
        
        void unmark_all() { ++this->current_mark; }
        
        bool is_marked  (const Hexa &hexa) const { return hexa.mark == this->current_mark; }
        void unmark     (Hexa &hexa)       const { hexa.mark = this->current_mark - 1; }
        void mark       (Hexa &hexa)       const { hexa.mark = this->current_mark; }

        // Methods to spawn a mesh navigator off of a mesh element
        MeshNavigator navigate(Dart& dart) { return MeshNavigator(dart, *this); }
        MeshNavigator navigate(Hexa& hexa) { Dart& d = darts[hexa.dart]; return navigate(d); }
        MeshNavigator navigate(Face& face) { Dart& d = darts[face.dart]; return navigate(d); }
        MeshNavigator navigate(Edge& edge) { Dart& d = darts[edge.dart]; return navigate(d); }
        MeshNavigator navigate(Vert& vert) { Dart& d = darts[vert.dart]; return navigate(d); }

        // The mesh class also functions as a cache for one (the last) evaluated quality measure.
        // The quality values are stored per hexa both in normalized and non-normalized formats. 
        vector<float>      hexa_quality;
        vector<float>      normalized_hexa_quality;
	};
}

#endif
