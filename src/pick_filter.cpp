#include <float.h>
#include <math.h>

#include "pick_filter.h"

#define HL_PICK_FILTER_DEFAULT_ENABLED true

namespace HexaLab {

void PickFilter::filter(Mesh& mesh) {

    if (!this->enabled) return;

    HL_ASSERT(this->mesh == &mesh);

    if (filtered_cells.size() && filtered_cells[0]==-1) {
        for (Index i=0; i<mesh.cells.size(); i++) mesh.mark( mesh.cells[i] );
    } else {
        for (int i: this->filtered_cells) mesh.mark( mesh.cells[i] );
    }

    for (int i: this->filled_cells) {
        mesh.unmark( mesh.cells[i] );
    }
}

void PickFilter::on_mesh_set(Mesh& mesh) {
    this->enabled = HL_PICK_FILTER_DEFAULT_ENABLED;
    this->mesh = &mesh;
    this->clear();
}

void PickFilter::clear(){
    this->filtered_cells.clear();
    this->filled_cells.clear();
}

void PickFilter::raycast( Vector3f origin, Vector3f direction, Index &in , Index &out ){

    in = out = -1;

    float  maxd = FLT_MAX;

    for (const Face &f: mesh->faces) {

        Index h0 = f.ci[0];
        Index h1 = f.ci[1];

        bool in0 = !mesh->is_marked( h0 );
        bool in1 = (h1!=-1) && !mesh->is_marked( h1 );

        if (in0==in1) continue; // not a current boundary face

        Face ff = f;
        if (in1) ff.flip();
        if (this->face_ray_test( ff, origin, direction, maxd)) {
            if (in0) { in = h0; out = h1; }
            else {in = h1; out = h0; }
        }
    }

}

Index PickFilter::dig_cell(Vector3f origin, Vector3f direction) {
    Index in, out;
    this->raycast( origin, direction , in, out) ;

    if (in>-1) dig_cell_id( in );

    return in;
}


Index PickFilter::undig_cell(Vector3f origin, Vector3f direction) {
    Index in, out;
    this->raycast( origin, direction , in, out) ;

    if (out>-1) undig_cell_id(out);
    return out;

}

Index PickFilter::isolate_cell(Vector3f origin, Vector3f direction) {
    Index in, out;
    this->raycast( origin, direction , in, out) ;

    if (in>-1) isolate_cell_id(in);
    return in;
}

void PickFilter::add_one_to_filtered( Index idx ){
    HL_LOG("ADDING %d TTO FIL\n",idx);
    if (!this->mesh) return;
    if (idx>=(int)this->mesh->cells.size()) return;
    HL_LOG("FIL [%lu] = %d\n",this->filtered_cells.size(),idx);
    this->filtered_cells.push_back(idx);
    std::sort(this->filtered_cells.begin(), this->filtered_cells.end());
}

void PickFilter::add_one_to_filled( Index idx ){
    if (!this->mesh) return;
    if (idx>=this->mesh->cells.size()) return;
    this->filled_cells.push_back(idx);
    std::sort(this->filled_cells.begin(), this->filled_cells.end());

}

void PickFilter::dig_cell_id(Index idx) {
    auto it = std::find(this->filled_cells.begin(), this->filled_cells.end(), idx );

    if (it != this->filled_cells.end()) {
        this->filled_cells.erase(it);
    } else {
        add_one_to_filtered(idx);
    }
}

void PickFilter::undig_cell_id(Index idx) {
    auto it = std::find(this->filtered_cells.begin(), this->filtered_cells.end(), idx);
    if (it != this->filtered_cells.end()) {
        this->filtered_cells.erase(it);
    } else {
        add_one_to_filled(idx);
    }
}

void PickFilter::isolate_cell_id(Index idx){
    filtered_cells.clear();
    filled_cells.clear();
    filtered_cells.push_back(-1);
    filled_cells.push_back(idx);
}


// helper function:
static bool tri_ray_test(Vector3f vert0, Vector3f vert1,Vector3f vert2,Vector3f ori, Vector3f dir, float& maxd) {

#define EPSIL 0.000001

    Vector3f edge1 = vert1 - vert0;
    Vector3f edge2 = vert2 - vert0;
    Vector3f tvec = ori - vert0;

    Vector3f pvec =  dir.cross( edge2 );
    double det =  edge1.dot(  pvec );

    Vector3f qvec = tvec.cross( edge1 );
    double u =  tvec.dot( pvec );
    double v =  dir.dot(qvec);

    if (det > EPSIL)
    {
        if ( u < 0.0 ||  u > det) return false;
        if ( v < 0.0 ||  u + v > det) return false;
    }
    else if(det < -EPSIL)
    {
        if ( u > 0.0 ||  u < det) return false;
        if ( v > 0.0 ||  u + v < det) return false;
    }
    else return false;

    double t = edge2.dot( qvec )  / det;
    if (t<0) return false;
    if (t>maxd) return false;
    maxd = t;
    return true;

}


bool PickFilter::face_ray_test(const Face& f, Vector3f origin, Vector3f direction, float& maxd) {

    FourIndices x = mesh->vertex_indices(f);

    Vector3f v0 = mesh->verts[ x.vi[0] ].position;
    Vector3f v1 = mesh->verts[ x.vi[1] ].position;
    Vector3f v2 = mesh->verts[ x.vi[2] ].position;
    Vector3f v3 = mesh->verts[ x.vi[3] ].position;

    if (tri_ray_test( v0,v1,v2 , origin, direction,  maxd)) return true;
    if (tri_ray_test( v2,v3,v0 , origin, direction,  maxd)) return true;
    return false;
}




}
