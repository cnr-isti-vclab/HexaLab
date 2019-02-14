#pragma once

#include <vector>
#include <unordered_map>
#include <algorithm>
#include <Eigen/Dense>
#include <Eigen/Geometry>

#include <common.h>
#include <mesh_navigator.h>
#include <hex_quality_color_maps.h>

// How to save a lot of mem
// Darts are quite verbous, you need 48 of them for a hexa, and in most of 'reasonable' subdivisions they are uselessy repetitive
// Nice trick is to compact them (e.g. moving to halfedge like structures) 
// This can be done implicitly
// consider that for example the four darts inside a wedge: they share the same cell and edge and refers two vertices and two faces; 
// You always will have this 4plets of darts, so if you keep them distributed in fixed way in a vector you can avoid to explicitly store them. 
// In this way you store a vector of N/4 FatDarts that can be used to represent a vector of N darts and simply use the 2 LSB to disambiguate a FatDart into the right dart.


namespace HexaLab {
    using namespace Eigen;
    using namespace std;

    // https://en.wikipedia.org/wiki/Generalized_map
    // TODO switch to combinatorial maps (half-edge structures) ?
    struct Dart {
        Index cell_neighbor = -1;
        Index face_neighbor = -1;
        Index edge_neighbor = -1;
        Index vert_neighbor = -1;
        Index cell = -1;
        Index face = -1;
        Index edge = -1;
        Index vert = -1;

        Dart() {}
        Dart ( Index cell, Index face, Index edge, Index vert ) {
            this->cell = cell;
            this->face = face;
            this->edge = edge;
            this->vert = vert;
        }

        Dart ( const Dart& other ) = delete;

        Dart ( const Dart&& other ) {
            this->cell_neighbor = other.cell_neighbor;
            this->face_neighbor = other.face_neighbor;
            this->edge_neighbor = other.edge_neighbor;
            this->vert_neighbor = other.vert_neighbor;
            this->cell          = other.cell;
            this->face          = other.face;
            this->edge          = other.edge;
            this->vert          = other.vert;
        }

        bool operator== ( const Dart& other ) const {
            // TODO avoid comparing neighbors, only compare cell/face/edeg/vert fields ?
            return this->cell_neighbor == other.cell_neighbor
                   && this->face_neighbor == other.face_neighbor
                   && this->edge_neighbor == other.edge_neighbor
                   && this->vert_neighbor == other.vert_neighbor
                   && this->cell          == other.cell
                   && this->face          == other.face
                   && this->edge          == other.edge
                   && this->vert          == other.vert;
        }
    };

    // marked <=> filtered

    struct Cell {
        Index dart      = -1;
        uint32_t mark   =  0;       // mark == mesh.mark -> cell is filtered

        Cell() {}
        Cell ( Index dart ) { this->dart = dart; }
        bool operator== ( const Cell& other ) const { return this->dart == other.dart; }
        bool operator!= ( const Cell& other ) const { return ! ( *this == other ); }
    };

    struct Face {
        Index dart = -1;
        Vector3f normal;
        // is_surface is given by simply checking the existence of a neighboring hexa.
        // the normal is stored with respect to the hexa that the dart belongs to. flip it if you want it with respect to the other.

        Face() {}
        Face ( Index dart ) { this->dart = dart; }
        Face ( Index dart, const Vector3f& norm ) { this->dart = dart; this->normal = norm; }
        Face ( Index dart, const Vector3f&& norm ) { this->dart = dart; this->normal = norm; }

        bool operator== ( const Face& other ) const { return this->dart == other.dart; }
        bool operator!= ( const Face& other ) const { return ! ( *this == other ); }
    };

    struct Edge {
        Index dart      = -1;
        bool is_surface = false;

        Edge() {}
        Edge ( int32_t dart ) { this->dart = dart; }
        bool operator== ( const Edge& other ) const { return this->dart == other.dart; }
        bool operator!= ( const Edge& other ) const { return ! ( *this == other ); }
    };

    struct Vert {
        Index dart          = -1;
        Vector3f position;
        uint32_t visible_mark = 0;
        bool is_surface     = false;

        Vert() {}
        Vert ( Vector3f position ) { this->position = position; }
        Vert ( Vector3f position, Index dart ) { this->position = position; this->dart = dart; }
        // TODO avoid comparing the position, only compare the dart field ?
        bool operator== ( const Vert& other ) const { return this->dart == other.dart && this->position == other.position; }
        bool operator!= ( const Vert& other ) const { return ! ( *this == other ); }
    };

    class Mesh {
        // As the name suggests, the Builder class is responsible for building a Mesh instance, given the file parser output.
        friend class Builder;

      private:
        // Marks are used to flag the visibility of elements. 
        // If an element's mark field equals to the mesh mark field, that element is currently invisible. 
        // Otherwise, it means that is has not been filtered and should be displayed.
        uint32_t current_mark = 0;

      public:
        vector<Cell> cells;
        vector<Face> faces;
        vector<Edge> edges;
        vector<Vert> verts;
        vector<Dart> darts;

        AlignedBox3f aabb;

        void unmark_all() { ++this->current_mark; }

        //bool mark_is_current ( const Cell& cell ) const { return cell.mark == this->current_mark; }
        bool is_marked ( const Cell& cell ) const { return cell.mark == this->current_mark ; }
        bool is_marked ( const Vert& vert ) const { return vert.visible_mark == this->current_mark; }
        void unmark ( Cell& cell ) const { cell.mark = this->current_mark - 1; }
        void unmark ( Vert& vert ) const { vert.visible_mark = this->current_mark - 1; }
        void mark ( Cell& cell ) const { cell.mark = this->current_mark; }
        void mark ( Vert& vert ) const { vert.visible_mark = this->current_mark; }

        // Methods to spawn a mesh navigator off of a mesh element
        MeshNavigator navigate ( Dart& dart ) { return MeshNavigator ( dart, *this ); }
        MeshNavigator navigate ( Cell& cell ) { Dart& d = darts[cell.dart]; return navigate ( d ); }
        MeshNavigator navigate ( Face& face ) { Dart& d = darts[face.dart]; return navigate ( d ); }
        MeshNavigator navigate ( Edge& edge ) { Dart& d = darts[edge.dart]; return navigate ( d ); }
        MeshNavigator navigate ( Vert& vert ) { Dart& d = darts[vert.dart]; return navigate ( d ); }

        // The mesh class also functions as a cache for one (the last) evaluated quality measure.
        // The quality values are stored per hexa both in normalized and non-normalized formats.
        vector<float>      hexa_quality;
        vector<float>      normalized_hexa_quality;
    };
}
