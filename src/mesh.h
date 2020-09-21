#pragma once

#include <vector>
#include <unordered_map>
#include <Eigen/Dense>
#include <Eigen/Geometry>

#include "common.h"
#include "hex_quality_color_maps.h"

/*
 * HEXALAB vertex and face orderning
 *
 *      6-------7       +   -   +       +-------+       +-------+
 *     /|      /|      /|      /|      /   3   /        |   5   |
 *    2-------3 |     + | -   + |     +-------+       +-------+ |
 *    | |     | |     |0|     |1|                     | |     | |
 *    | 4-----|-5     | +   - | +       +-------+     | +-----|-+
 *    |/      |/      |/      |/       /   2   /      |   4   |
 *    0-------1       +   -   +       +-------+       +-------+
 *
 *      Vertex
 *    Each vertex is
 *    its XYZ coords
 *    in binary
 */


namespace HexaLab {
    using namespace Eigen;
    using namespace std;

    struct FourIndices{
        Index vi[4];
        FourIndices(Index a, Index b, Index c,Index d){ vi[0]=a; vi[1]=b; vi[2]=c; vi[3]=d; }
        Index operator[] (short i) const {return vi[i];}
    };

    struct Cell {
        Index fi[6];
        Index vi[8];
        bool marked;
        FourIndices get_face(short wi) const {
            switch (wi){
            case  0: return FourIndices(vi[0],vi[2],vi[6],vi[4]);
            case  1: return FourIndices(vi[3],vi[1],vi[5],vi[7]);
            case  2: return FourIndices(vi[0],vi[4],vi[5],vi[1]);
            case  3: return FourIndices(vi[6],vi[2],vi[3],vi[7]);
            case  4: return FourIndices(vi[0],vi[1],vi[3],vi[2]);
            default: return FourIndices(vi[5],vi[4],vi[6],vi[7]);
            }
        }
    };

    struct Face {  
        Vector3f normal;
        Index ci[2];
        short wi[2]; // this is face number wi[0] of cell ci[0]

        bool is_boundary() const { return ci[1]==-1; }
        void flip() {
            assert(!is_boundary());
            normal *= -1.0f;
            std::swap(ci[0],ci[1]);
            std::swap(wi[0],wi[1]);
        }
        Face flipped() const {
            Face res = *this;
            res.flip();
            return res;
        }

    };

    struct Edge {
        bool is_surface = false;
        Index vi[2];

        Edge() {}
    };

    struct Vert {
        Vector3f position;
        uint32_t visible; // mystery: if bool, size of vert rises (from 12+4 to 12+12!)
        Vert() {}
        Vert ( Vector3f p ):position(p) {}
    };




    class Mesh {
        // Builder class is responsible for building a Mesh instance, given the file parser output.
        friend class Builder;

      public:
        vector<Cell> cells;
        vector<Face> faces;
        vector<Edge> edges;
        vector<Vert> verts;

        AlignedBox3f aabb;

        void unmark_all();



        FourIndices vertex_indices(const Face &f) const{
            return cells[ f.ci[0] ].get_face( f.wi[0] );
        }

        Vector3f pos( Index vi) const { return verts[vi].position; }
        Vector3f norm_of_side( Index ci, short side) const {
            const Face& f = faces[ cells[ci].fi[side] ];
            if (f.ci[0]==ci) return f.normal; else return -f.normal;
        }

        bool is_marked ( int ci ) const { return cells[ci].marked; }
        bool is_marked ( const Cell& cell ) const { return cell.marked; }
        void unmark ( Cell& cell )  { cell.marked = false; }
        void mark ( Cell& cell )  { cell.marked = true; }

        bool is_visible ( const Vert& vert ) const { return vert.visible; }
        bool is_visible ( int vi ) const { return verts[vi].visible; }
        void set_invisible ( Vert& vert )  { vert.visible = false; }
        void set_visible ( Vert& vert )  { vert.visible = true; }


        Index other_side( Index ci, int side0to5 ) const {
            const Face &f = faces[ cells[ci].fi[side0to5] ];
            return (f.ci[0]==ci)?f.ci[1]:f.ci[0];
        }

        // per-hxa quality measure (parallel vectors)
        vector<float>      hexa_quality;
        vector<float>      normalized_hexa_quality;


        float average_edge_lenght(float &min, float &max) const;
        float average_cell_volume() const;
        void update_vertex_visibility();

        long total_occupation_RAM() const; // approximation!
    };
}
