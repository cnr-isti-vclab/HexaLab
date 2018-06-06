#include <float.h>
#include <math.h>

#include "pick_filter.h"

#define HL_PICK_FILTER_DEFAULT_ENABLED true

namespace HexaLab {

void PickFilter::filter(Mesh& mesh) {

    if (!this->enabled) return;

    HL_ASSERT(this->mesh == &mesh);

    for (int i: this->filtered_hexas) {
        mesh.mark( mesh.hexas[i] );
    }
    for (int i: this->filled_hexas) {
        mesh.unmark( mesh.hexas[i] );
    }
}

void PickFilter::on_mesh_set(Mesh& mesh) {
    this->enabled = HL_PICK_FILTER_DEFAULT_ENABLED;
    this->mesh = &mesh;
    this->clear();
}

void PickFilter::clear(){
    this->filtered_hexas.clear();
    this->filled_hexas.clear();
}

void PickFilter::raycast( Vector3f origin, Vector3f direction, Index &in , Index &out ){

    in = out = -1;
    float  maxd = FLT_MAX;


    int tmp = 0, tmpb = 0, tmpnb= 0;
    for (Face &f: mesh->faces) {

        Index h0 , h1;
        bool in0, in1;

        MeshNavigator nav = mesh->navigate(f);
        h0 = nav.hexa_index();
        in0 = !mesh->is_marked( nav.hexa() );

        if (nav.dart().hexa_neighbor == -1) {
            h1 = -1;
            in1 = false;
            tmpb++;
        } else {
            nav = nav.flip_hexa();
            h1 = nav.hexa_index();
            in1 = !mesh->is_marked( nav.hexa() );
            tmpnb++;
        }
        if (in0==in1) continue; // not a current boundary face

        tmp++;
        if (this->face_ray_test( f, origin, direction, maxd)) {
            if (in0) { in = h0; out = h1; }
            else {in = h1; out = h0; }
        }
    }
    HL_LOG("[Pick Filter]: tested faces = %d\n", tmp);
    HL_LOG("[Pick Filter]: boundary faces = %d\n", tmpb);
    HL_LOG("[Pick Filter]: non boundary faces = %d\n", tmpnb);

}

Index PickFilter::dig_hexa(Vector3f origin, Vector3f direction) {
    Index in, out;
    this->raycast( origin, direction , in, out) ;

    if (in>-1) dig_hexa_id( in );

    return in;
}


Index PickFilter::undig_hexa(Vector3f origin, Vector3f direction) {
    Index in, out;
    this->raycast( origin, direction , in, out) ;

    if (out>-1) undig_hexa_id(out);
    return out;

}

void PickFilter::add_one_to_filtered( Index idx ){
    if (!this->mesh) return;
    if (idx>=this->mesh->hexas.size()) return;
    this->filtered_hexas.push_back(idx);
    std::sort(this->filtered_hexas.begin(), this->filtered_hexas.end());
}

void PickFilter::add_one_to_filled( Index idx ){
    if (!this->mesh) return;
    if (idx>=this->mesh->hexas.size()) return;
    this->filled_hexas.push_back(idx);
    std::sort(this->filled_hexas.begin(), this->filled_hexas.end());

}

void PickFilter::dig_hexa_id(Index idx) {
    auto it = std::find(this->filled_hexas.begin(), this->filled_hexas.end(), idx );

    if (it != this->filled_hexas.end()) {
        this->filled_hexas.erase(it);
    } else {
        add_one_to_filtered(idx);
    }
}

void PickFilter::undig_hexa_id(Index idx) {
    auto it = std::find(this->filtered_hexas.begin(), this->filtered_hexas.end(), idx);
    if (it != this->filtered_hexas.end()) {
        this->filtered_hexas.erase(it);
    } else {
        add_one_to_filled(idx);
    }
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


bool PickFilter::face_ray_test( Face& face, Vector3f origin, Vector3f direction, float& maxd) {

    MeshNavigator nav = this->mesh->navigate(face);

    Vector3f v0 = nav.vert().position;
    nav = nav.rotate_on_face();
    Vector3f v1 = nav.vert().position;
    nav = nav.rotate_on_face();
    Vector3f v2 = nav.vert().position;
    nav = nav.rotate_on_face();
    Vector3f v3 = nav.vert().position;

    if (tri_ray_test( v0,v1,v2 , origin, direction,  maxd)) return true;
    if (tri_ray_test( v2,v3,v0 , origin, direction,  maxd)) return true;
    return false;
}




}
