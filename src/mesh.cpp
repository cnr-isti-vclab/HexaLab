#include "mesh.h"

namespace HexaLab {


void Mesh::erode_dilate_marked( int str ) {
    for ( int i=0; i<str; i++ ) erode_marked();
    for ( int i=0; i<str; i++ ) dilate_marked();
}

void Mesh::erode_marked() {

    update_vertex_visibility_internals();

    for (Cell& c:cells) for (short i=0; i<8; i++) if (is_visible(c.vi[i])) mark( c );

}

void Mesh::dilate_marked() {

    update_vertex_visibility_internals();

    for (Cell& c:cells) for (short i=0; i<8; i++) if (is_visible(c.vi[i])) unmark( c );

}


Vector3f Mesh::barycenter_of(const Face &face) const{
    FourIndices vi = vertex_indices( face );
    return ( pos(vi[0])+pos(vi[1])+pos(vi[2])+pos(vi[3]) )/4.0;
}

Vector3f Mesh::barycenter_of(const Cell &c) const{
    return ( pos( c.vi[0])+pos( c.vi[1])+pos( c.vi[2])+pos(c.vi[3]) +
             pos( c.vi[4])+pos( c.vi[5])+pos( c.vi[6])+pos(c.vi[7]) )/8.0;
}

void Mesh::compute_and_store_normal(Face &face){
    Vector3f normal ( 0, 0, 0 );
    FourIndices vi = vertex_indices( face );

    Vector3f a,b;

    a = verts[vi[3]].position - verts[vi[0]].position;
    b = verts[vi[1]].position - verts[vi[0]].position;
    normal += a.cross ( b );
    a = verts[vi[0]].position - verts[vi[1]].position;
    b = verts[vi[2]].position - verts[vi[1]].position;
    normal += a.cross ( b );
    a = verts[vi[1]].position - verts[vi[2]].position;
    b = verts[vi[3]].position - verts[vi[2]].position;
    normal += a.cross ( b );
    a = verts[vi[2]].position - verts[vi[3]].position;
    b = verts[vi[0]].position - verts[vi[3]].position;
    normal += a.cross ( b );

    if (normal== Vector3f(0,0,0)) {
        // fall back strategy
        normal = barycenter_of(face) - barycenter_of( cells[face.ci[0]] );
    }
    normal.normalize();

    face.normal = normal;
}


short Mesh::find_edge( Index fi, Index vi, short side0or1) const{
    Index ci = faces[fi].ci[side0or1];
    short face0to5 = faces[fi].wi[side0or1];

    FourIndices vvi = cells[ ci ].get_face(face0to5);
    short res=3;
    for (int i=0; i<3; i++) {
        if (vvi[i]==vi) res=i;
    }
    return res;

}

Index Mesh::pivot_around_edge(Index fi,  Index vi, short &w, short edge0to3) const{


    Face ffi = faces[fi];
    if (ffi.is_boundary()) return -1;

    Index ci = ffi.ci[w];

    short face0to5 = ffi.wi[w];
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
        side0to3 = find_edge(fi,vi,1);
    }

    int val = 0;

    Index fj = fi;

    while (1) {
        val++;
        fj = pivot_around_edge(fj,vi,side,side0to3);
        if (fj==-1) return 0; // not internal
        if (val>6) break;
        if (fj>fi) return 0; // not unique
        if (fj==fi) break;
        side0to3 = find_edge(fj,vi,side);
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
