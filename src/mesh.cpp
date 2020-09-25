#include "mesh.h"

namespace HexaLab {

Index Mesh::pivot_around_edge(Index fi,  Index vi, short &w) const{


    Face ffi = faces[fi];
    if (ffi.is_boundary()) return -1;

    Index ci = ffi.ci[w];
    short face0to5 = ffi.wi[w];
    FourIndices vvi = cells[ ci ].get_face(face0to5);

    short edge0to3=3;
    for (int i=0; i<3; i++) {
        if (vvi[i]==vi) edge0to3=i;
    }

    face0to5 = Cell::pivot_face_around_edge(face0to5,edge0to3);

    Index fj = cells[ci].fi[face0to5];
    Face ffj = faces[fj];

    w = (ffj.ci[0]==ci)?1:0;

    return fj;
}

int Mesh::internal_edge_valency(Index fi, short side0to3) const{

    if (faces[fi].is_boundary()) return 0; // not internal

    FourIndices vvi = vertex_indices( faces[fi] );

    int vi = vvi[side0to3];
    int vj = vvi[(side0to3+1)%4];

    if (vi==vj) return 0;

    short side = 0;
    if (vi<vj) {
        vi = vj;
        side = 1;
    }

    int val = 0;

    Index fj = fi;

    while (1) {
        val++;
        fj = pivot_around_edge(fj,vi,side);
        if (fj==-1) return 0; // not internal
        if (val>6) break;
        if (fj>fi) return 0; // not unique
        if (fj==fi) break;
    }
    return val;

}


void Mesh::unmark_all(){
    for ( Cell& c : cells) c.marked = false;
}

float Mesh::average_edge_lenght(float &min, float &max) const {

    max = std::numeric_limits<float>::lowest();
    min = std::numeric_limits<float>::max();
    float sum = 0;
    int div = 0;

    /* TODO: work on single edges */
    for ( const Cell& c : cells) {
        for (short si=0; si<6; si++) {
            FourIndices f = c.get_face(si);
            for (short wi=0; wi<4; wi++) {
                Vector3f edge = pos( f.vi[wi] ) - pos( f.vi[(wi+1)%4] );
                float len = edge.norm();

                if ( len < min ) min = len;
                if ( len > max ) max = len;
                sum += len;
                div++;
            }

        }
    }

    return sum / div;

}

long Mesh::total_occupation_RAM() const{
    return sizeof(Cell) * cells.size() +
           sizeof(Face) * faces.size() +
           sizeof(Vert) * verts.size();
}

float Mesh::average_cell_volume() const {
    float sum = 0;
    for ( Cell c: cells ) {
        // from Hexalab °rational° order to irrational order!
        sum += QualityMeasureFun::volume (
                pos(c.vi[0]), pos(c.vi[1]), pos(c.vi[3]), pos(c.vi[2]),
                pos(c.vi[4]), pos(c.vi[5]), pos(c.vi[7]), pos(c.vi[6]), nullptr );
    }
    return sum / cells.size();

}


void Mesh::update_vertex_visibility_internals(){
    for ( Vert& v: verts) set_invisible( v );

    for ( const Face &f : faces ) if (!f.is_boundary()) {
        bool side0 = !is_marked( f.ci[0] );
        bool side1 = !is_marked( f.ci[1] );
        if ( side0 != side1 )  {
            FourIndices vi = vertex_indices(f);
            for (int w=0; w<4; w++) set_visible( verts[ vi[w] ] );
        }
    }

}


void Mesh::update_vertex_visibility(){

    for ( Vert& v: verts) set_invisible( v );

    for ( const Face &f : faces ) {
        bool side0 = !is_marked( f.ci[0] );
        bool side1 = !f.is_boundary() && !is_marked( f.ci[1] );
        if ( side0 != side1 )  {
            FourIndices vi = vertex_indices(f);
            for (int w=0; w<4; w++) set_visible( verts[ vi[w] ] );
        }
    }
}


} // namespace
