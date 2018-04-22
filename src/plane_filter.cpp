#include <plane_filter.h>

#define HL_PLANE_FILTER_DEFAULT_OFFSET  0
#define HL_PLANE_FILTER_DEFAULT_NORMAL  1, 0, 0
#define HL_PLANE_FILTER_DEFAULT_ENABLED true

namespace HexaLab {
    void PlaneFilter::on_mesh_set(Mesh& mesh) {
        this->mesh_aabb = &mesh.aabb;
        this->enabled = HL_PLANE_FILTER_DEFAULT_ENABLED;
        this->set_plane_normal(HL_PLANE_FILTER_DEFAULT_NORMAL);
        this->set_plane_offset(HL_PLANE_FILTER_DEFAULT_OFFSET);
    }

    // Returns true if any of the face vertices are culled (behind the plane)
    bool PlaneFilter::plane_cull_test(Mesh& mesh, Face& face) {
        MeshNavigator nav = mesh.navigate(face);
        for (int v = 0; v < 4; ++v) {
            if (plane.signedDistance(nav.vert().position) < 0) {
                return true;
                break;
            }
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
        Vector3f normal(nx, ny, nz);
        normal.normalize();
        plane = Hyperplane<float, 3>(normal, mesh_aabb->center() + normal * (mesh_aabb->diagonal().norm() * (get_plane_offset() - 0.5f)));
    }
    void PlaneFilter::set_plane_offset(float offset) { // offset in [0,1]
        plane = Hyperplane<float, 3>(plane.normal(), mesh_aabb->center() + plane.normal() * (mesh_aabb->diagonal().norm() * (offset - 0.5f)));
    }
    Vector3f PlaneFilter::get_plane_normal() {
        return plane.normal();
    }
    float PlaneFilter::get_plane_offset() {   // return the offset from the center expressed in [0,1] range (0.5 is the center)
        return -plane.signedDistance(mesh_aabb->center()) / mesh_aabb->diagonal().norm() + 0.5f;
    }
    float PlaneFilter::get_plane_world_offset() {
        return plane.signedDistance(mesh_aabb->center());
    }
}
