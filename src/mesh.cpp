#include "mesh.h"

namespace HexaLab {

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
