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
 *      Vertex                           Faces
 *
 *
 * 2---6---7                               +-0-+-2-+
 * | 0 | 5 |                               3   1   3
 * 0---4---5---7         0---1  +-0-+      +-2-+-0-+-2-+
 *     | 2 | 1 |         |   |  3   1          3   1   3
 *     0---1---3---7     3---2  +-2-+          +-2-+-0-+-2-+
 *         | 4 | 3 |                               3   1   3
 *         0---2---6   Corners  Edges       Edges  +-2-+-0-+
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

        uint32_t marked;

        FourIndices get_face(short face0to5) const {
            switch (face0to5){
            case  0: return FourIndices(vi[2],vi[6],vi[4],vi[0]); //  010 110 100 000
            case  1: return FourIndices(vi[3],vi[1],vi[5],vi[7]); //  011 001 101 111
            case  2: return FourIndices(vi[4],vi[5],vi[1],vi[0]); //  100 101 001 000
            case  3: return FourIndices(vi[6],vi[2],vi[3],vi[7]); //  011 010 011 111
            case  4: return FourIndices(vi[1],vi[3],vi[2],vi[0]); //  001 011 010 000
            default: return FourIndices(vi[5],vi[4],vi[6],vi[7]); //  101 100 110 111
            }
        }

        inline int get_v3_of_face(short face0to5) const {
            return vi[(face0to5&1)*7];
        }

        static short pivot_face_around_edge( short face0to5, short edge0to3 ) {
            /*
             * edge=0 : faces 0<->3 1<->4 2<->5
             * edge=1 : faces 0<->5 2<->1 4<->3
             * edge=2 : faces 0->2->4->0  5->3->1->5
             * edge=3 : faces 0->4->2->0  5->1->3->5
             */

            if (edge0to3==1) face0to5 = (face0to5+3)^1;  else
            if (edge0to3> 1) face0to5 += (((edge0to3 ^ (face0to5&1))<<1)|5);
            return (face0to5+3)%6;

            // edge: 3<->2 (0,1 unchanged)
            //edge0to3 ^= (edge0to3>>1);
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
        vector<Vert> verts;

        AlignedBox3f aabb;

        void unmark_all();

        FourIndices vertex_indices(const Face &f) const{
            return cells[ f.ci[0] ].get_face( f.wi[0] );
        }
        FourIndices vertex_indices(const Face &f,short side0or1) const{
            return cells[ f.ci[side0or1] ].get_face( f.wi[side0or1] );
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

        int count_visible_faces(Index fi, short si) const;

        Index other_side( Index ci, int side0to5 ) const {
            const Face &f = faces[ cells[ci].fi[side0to5] ];
            return (f.ci[0]==ci)?f.ci[1]:f.ci[0];
        }

        // per-hexa quality measure (parallel vectors)
        vector<float>      hexa_quality;
        vector<float>      normalized_hexa_quality;


        int internal_edge_valency(Index fi, short side) const;

        float average_edge_lenght(float &min, float &max) const;
        float average_cell_volume() const;
        void update_vertex_visibility();
        void update_vertex_visibility_internals();

        long total_occupation_RAM() const; // approximation!

        Index pivot_around_edge(Index fi, Index vi, short &side0or1, short edge0to3) const;
        short find_edge(Index fi, Index vi, short side0or1) const;

      private:

        /* used during construction */
        Vector3f barycenter_of(const Face &face) const;
        Vector3f barycenter_of(const Cell &c) const;
        void compute_and_store_normal(Face &face);
    };
}
