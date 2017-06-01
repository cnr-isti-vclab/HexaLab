#include <plane_filter.h>

namespace HexaLab {
    bool PlaneFilter::plane_cull_test(Face& face) {
        MeshNavigator nav = mesh->navigate(face);
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
        for (unsigned int i = 0; i < mesh.hexas.size(); ++i) {
            Hexa& hexa = mesh.hexas[i];

            // front face plane cull check
            MeshNavigator nav = mesh.navigate(hexa);
            if (plane_cull_test(nav.face())) { 
                nav.hexa().filter_mark = mesh.mark;
                continue;
            }
            nav = nav.rotate_on_hexa().rotate_on_hexa();
            if (plane_cull_test(nav.face())) { 
                nav.hexa().filter_mark = mesh.mark;
                continue;
            }
        }
    }

    void PlaneFilter::set_plane_normal(float nx, float ny, float nz) {
        Vector3f normal(nx, ny, nz);
        normal.normalize();
        plane = Hyperplane<float, 3>(normal, mesh->aabb.center() + normal * (mesh->aabb.diagonal().norm() * (get_plane_offset() - 0.5)));
    }
    void PlaneFilter::set_plane_offset(float offset) { // offset in [0,1]
        plane = Hyperplane<float, 3>(plane.normal(), mesh->aabb.center() + plane.normal() * (mesh->aabb.diagonal().norm() * (offset - 0.5)));
    }
    Vector3f PlaneFilter::get_plane_normal() {
        return plane.normal();
    }
    float PlaneFilter::get_plane_offset() {   // return the offset from the center expressed in [0,1] range (0.5 is the center)
        return -plane.signedDistance(mesh->aabb.center()) / mesh->aabb.diagonal().norm() + 0.5;
    }
    float PlaneFilter::get_plane_world_offset() {
        return plane.signedDistance(mesh->aabb.center());
    }
}
