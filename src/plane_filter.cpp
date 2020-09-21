#include "mesh.h"
#include "plane_filter.h"

#define HL_PLANE_FILTER_DEFAULT_OFFSET  0
#define HL_PLANE_FILTER_DEFAULT_NORMAL  1, 0, 0
#define HL_PLANE_FILTER_DEFAULT_ENABLED true

namespace HexaLab {
    void PlaneFilter::on_mesh_set(Mesh& _mesh) {
        this->mesh = &_mesh;
        enabled = HL_PLANE_FILTER_DEFAULT_ENABLED;
        set_plane_normal(HL_PLANE_FILTER_DEFAULT_NORMAL);
        set_plane_offset(HL_PLANE_FILTER_DEFAULT_OFFSET);
        update_min_max_offset();
    }

    // Returns true if any of the cell vertices are culled (behind the plane)
    bool PlaneFilter::cell_test(const Mesh& mesh, const Cell& c ) {
        for (int w=0; w<8; ++w) {
            if (normal.dot( mesh.pos( c.vi[w] ) ) < offset) return true;
        }
        return false;
    }

    void PlaneFilter::filter(Mesh& mesh) {
        if (!this->enabled)
            return;

        for (Cell& c : mesh.cells) {
            if (  cell_test(mesh, c) ) mesh.mark( c );
        }
    }

    void PlaneFilter::set_plane_normal(float nx, float ny, float nz) {
        normal = Vector3f(nx, ny, nz);
        normal.normalize();
        update_min_max_offset();
    }

    void PlaneFilter::set_plane_offset(float _offset) { // offset in [0,1]
        offset01 = _offset;
        offset = min_offset + (max_offset-min_offset)* offset01;
    }

    Vector3f PlaneFilter::get_plane_normal() {
        return normal;
    }
    float PlaneFilter::get_plane_offset() {   // return the offset from the center expressed in [0,1] range (0.5 is the center)
        return offset01;
    }
    float PlaneFilter::get_plane_world_offset() {
        return -offset + ((mesh)?normal.dot(mesh->aabb.center()):0.0f);
    }

    void PlaneFilter::update_min_max_offset(){
        min_offset = max_offset = 0.0;
        if (!mesh) return;
        if (mesh->verts.size()==0) return;
        min_offset = max_offset = normal.dot( mesh->verts[0].position );

        for (const Vert &v : mesh->verts) {
            float k = normal.dot( v.position );
            if (k<min_offset) min_offset = k;
            if (k>max_offset) max_offset = k;
        }
        min_offset-=0.00001;
        max_offset+=0.00001;

        offset = min_offset + (max_offset-min_offset)* offset01;
    }

}
