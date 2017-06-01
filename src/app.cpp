#include <app.h>

namespace HexaLab {
    bool App::import_mesh(string path) {
        mesh = new Mesh();

        HL_LOG("Loading %s...\n", path.c_str());
        vector<Vector3f> verts;
        vector<HexaLab::Index> indices;
        if (!Loader::load(path, verts, indices)) {
            return false;
        }

        HL_LOG("Building...\n");
        Builder::build(*mesh, verts, indices);

        HL_LOG("Validating...\n");
        if (!Builder::validate(*mesh)) {
            return false;
        }
        
        singularity_model.clear();
        for (size_t i = 0; i < mesh->edges.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->edges[i]);
            if (nav.edge().face_count == 4) continue;
            if (nav.edge().surface) continue;
            for (int j = 0; j < 2; ++j) {
                singularity_model.wireframe_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                nav = nav.flip_vert();
            }
            int d = (4 - nav.edge().face_count);
            Vector3f color;
            switch (d) {
            case -1:
                color = Vector3f(1, 0, 0);
                break;
            case 1:
                color = Vector3f(0, 1, 0);
                break;
            default:
                color = Vector3f(0, 0, 1);
            }
            singularity_model.wireframe_vert_color.push_back(color);
            singularity_model.wireframe_vert_color.push_back(color);
        }

        for (size_t i = 0; i < filters.size(); ++i) {
            filters[i]->on_mesh_set(*mesh);
        }

        for (int i = 0; i < mesh->hexas.size(); ++i) {
            hexa_quality.push_back(mesh->hexas[i].scaled_jacobian);
        }

        return true;
    }

    void App::add_visible_face(Dart& dart, float normal_sign) {
        MeshNavigator nav = mesh->navigate(dart);

        for (int i = 0; i < 2; ++i) {
            int j = 0;
            for (; j < 2; ++j) {
                visible_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                add_visible_wireframe(nav.dart());
                nav = nav.rotate_on_face();
            }
            visible_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);

            Vector3f normal = nav.face().normal * normal_sign;
            visible_model.surface_vert_norm.push_back(normal);
            visible_model.surface_vert_norm.push_back(normal);
            visible_model.surface_vert_norm.push_back(normal);

            Vector3f color = Vector3f(1 - nav.hexa().scaled_jacobian, 0, nav.hexa().scaled_jacobian);
            visible_model.surface_vert_color.push_back(color);
            visible_model.surface_vert_color.push_back(color);
            visible_model.surface_vert_color.push_back(color);
        }
    }

    void App::add_visible_wireframe(Dart& dart) {
        MeshNavigator nav = mesh->navigate(dart);
        if (nav.edge().mark != mesh->mark) {
            nav.edge().mark = mesh->mark;
            MeshNavigator edge_nav = nav;
            for (int v = 0; v < 2; ++v) {
                visible_model.wireframe_vert_pos.push_back(mesh->verts[edge_nav.dart().vert].position);
                edge_nav = edge_nav.flip_vert();
            }
        }
    }

    void App::add_filtered_face(Dart& dart) {
        MeshNavigator nav = mesh->navigate(dart);

        for (int i = 0; i < 2; ++i) {
            int j = 0;
            for (; j < 2; ++j) {
                filtered_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                add_filtered_wireframe(nav.dart());
                nav = nav.rotate_on_face();
            }
            filtered_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);

            Vector3f normal = nav.face().normal;
            filtered_model.surface_vert_norm.push_back(normal);
            filtered_model.surface_vert_norm.push_back(normal);
            filtered_model.surface_vert_norm.push_back(normal);
        }
    }

    void App::add_filtered_wireframe(Dart& dart) {
        MeshNavigator nav = mesh->navigate(dart);
        if (nav.edge().mark != mesh->mark) {
            nav.edge().mark = mesh->mark;
            MeshNavigator edge_nav = nav;
            for (int v = 0; v < 2; ++v) {
                filtered_model.wireframe_vert_pos.push_back(mesh->verts[edge_nav.dart().vert].position);
                edge_nav = edge_nav.flip_vert();
            }
        }
    }

    void App::build_models() {
        auto t_start = sample_time();

        mesh->mark++;

        visible_model.clear();
        filtered_model.clear();

        for (size_t i = 0; i < filters.size(); ++i) {
            filters[i]->filter(*mesh);
        }
        
        for (size_t i = 0; i < mesh->faces.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->faces[i]);
            // hexa a visible, hexa b not existing or not visible
            if (nav.hexa().filter_mark != mesh->mark 
                && (nav.dart().hexa_neighbor == -1 
                    || nav.flip_hexa().hexa().filter_mark == mesh->mark)) {
                add_visible_face(nav.dart(), 1);
                // hexa a invisible, hexa b existing and visible
            } else if (nav.hexa().filter_mark == mesh->mark 
                && nav.dart().hexa_neighbor != -1 
                && nav.flip_hexa().hexa().filter_mark != mesh->mark) {
                nav = nav.flip_hexa().flip_edge();
                add_visible_face(nav.dart(), -1);
                // face was culled by the plane, is surface
            } else if (nav.hexa().filter_mark == mesh->mark 
                && (nav.flip_hexa().hexa().filter_mark != mesh->mark 
                    || nav.dart().hexa_neighbor == -1)) {
                add_filtered_face(nav.dart());
            }
        }

    }

}