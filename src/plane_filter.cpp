#include <plane_filter.h>

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

    // Returns true if any of the face vertices are culled (behind the plane)
    bool PlaneFilter::plane_cull_test(Mesh& mesh, Face& face) {
        MeshNavigator nav = mesh.navigate(face);
        for (int v = 0; v < 4; ++v) {
            if (normal.dot( nav.vert().position) < offset) return true;
            nav = nav.rotate_on_face();
        }
        return false;
    }

    void PlaneFilter::filter(Mesh& mesh) {
        if (!this->enabled)
            return;

        for (unsigned int i = 0; i < mesh.hexas.size(); ++i) {
            Hexa& hexa = mesh.hexas[i];

            // front face plane cull check
            MeshNavigator nav = mesh.navigate(hexa);
            if (plane_cull_test(mesh, nav.face())) { 
                mesh.mark(nav.hexa());
                continue;
            }
            nav = nav.rotate_on_hexa().rotate_on_hexa();
            if (plane_cull_test(mesh, nav.face())) { 
                mesh.mark(nav.hexa());
                continue;
            }
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
        return (max_offset+max_offset)/2.0;
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
