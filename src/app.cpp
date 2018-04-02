#include <app.h>

#include <limits>

namespace HexaLab {
    bool App::import_mesh(string path) {
        delete mesh;
        mesh = new Mesh();

        HL_LOG("Loading %s...\n", path.c_str());
        vector<Vector3f> verts;
        vector<HexaLab::Index> indices;
        if (!Loader::load(path, verts, indices)) {
            return false;
        }

        HL_LOG("Building...\n");
        Builder::build(*mesh, verts, indices);

        float max = std::numeric_limits<float>::lowest(), min = std::numeric_limits<float>::max(), avg = 0;
        for (size_t i = 0; i < mesh->edges.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->edges[i]);
            Vector3f edge = nav.vert().position - nav.flip_vert().vert().position;
            float len = edge.norm();
            if (len < min) min = len;
            if (len > max) max = len;
            avg += len;
        }
        avg /= mesh->edges.size();

        mesh_stats.min_edge_len = min;
        mesh_stats.max_edge_len = max;
        mesh_stats.avg_edge_len = avg;
        mesh_stats.vert_count = mesh->verts.size();
        mesh_stats.hexa_count = mesh->hexas.size();

        //HL_LOG("Validating...\n");
        //if (!Builder::validate(*mesh)) {
            //return false;
        //}


        build_singularity_model();

        for (size_t i = 0; i < filters.size(); ++i) {
            filters[i]->on_mesh_set(*mesh);
        }

//        for (auto i = 0; i < mesh->hexas.size(); ++i) {
//            mesh->hexa_quality.push_back(mesh->hexas[i].scaled_jacobian);
//        }

        return true;
    }

    void App::compute_hexa_quality(App::quality_measure_fun* fun) {
        float min = std::numeric_limits<float>::max();
        float max = -std::numeric_limits<float>::max();
        float sum = 0;
        float sum2 = 0;
        mesh->hexa_quality.resize(mesh->hexas.size());
        Vector3f v[8];
        for (size_t i = 0; i < mesh->hexas.size(); ++i) {
            int j = 0;
            MeshNavigator nav = mesh->navigate(mesh->hexas[i]);
            Vert& a = nav.vert();
            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while(nav.vert() != a);
            nav = nav.rotate_on_hexa().rotate_on_hexa().flip_vert();
            Vert& b = nav.vert();
            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while(nav.vert() != b);
            float q = fun(v[4], v[5], v[6], v[7], v[0], v[1], v[2], v[3]);
            mesh->hexa_quality[i] = q;
            if (min > q) min = q;
            if (max < q) max = q;
            sum += q;
            sum2 += q * q;
        }
        this->mesh_stats.quality_min = min;
        this->mesh_stats.quality_max = max;
        this->mesh_stats.quality_avg = sum / mesh->hexas.size();
        this->mesh_stats.quality_var = sum2 / mesh->hexas.size() - this->mesh_stats.quality_avg * this->mesh_stats.quality_avg;
    }

    void App::build_singularity_model() {
      singularity_model.clear();
      for (size_t i = 0; i < mesh->edges.size(); ++i) {
          MeshNavigator nav = mesh->navigate(mesh->edges[i]);
          int face_count = nav.incident_face_on_edge_num();
          if (face_count == 4) continue;
          if (nav.edge().surface_flag) continue;
          // add edge
          for (int j = 0; j < 2; ++j) {
              singularity_model.wireframe_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
              nav = nav.flip_vert();
          }
          Vector3f color;
          switch (face_count) {
          case  3:   color = Vector3f(1, 0, 0);  break;
          case  5:   color = Vector3f(0, 1, 0);  break;
          default:   color = Vector3f(0, 0, 1);
          }

//          Face& begin = nav.face();
//          do {
//            vector<Vector3f> facePos;
//            nav.collect_face_vertex_position_vector(facePos);
//              singularity_model.surface_vert_pos.push_back(facePos[i]);
//              singularity_model.surface_vert_color.push_back(color);
//              singularity_model.wireframe_vert_pos.push_back(facePos[i]);
//              singularity_model.wireframe_vert_pos.push_back(facePos[(i+1)%facePos.size()]);
//              singularity_model.wireframe_vert_color.push_back(Vector3f(0, 0, 0));
//              singularity_model.wireframe_vert_color.push_back(Vector3f(0, 0, 0));
//            }
//            nav = nav.rotate_on_edge();
//          } while (nav.face() != begin);

          singularity_model.wireframe_vert_color.push_back(color);
          singularity_model.wireframe_vert_color.push_back(color);
          // add adjacent faces
          Face& begin = nav.face();
          do {
              for (int k = 0; k < 2; ++k) {
                  int j = 0;
                  for (; j < 2; ++j) {
                      singularity_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                      singularity_model.surface_vert_color.push_back(color);
                      for (int n = 0; n < 2; ++n) {
                          singularity_model.wireframe_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                          singularity_model.wireframe_vert_color.push_back(Vector3f(0, 0, 0));
                          nav = nav.flip_vert();
                      }
                      nav = nav.rotate_on_face();
                  }
                  singularity_model.surface_vert_pos.push_back(mesh->verts[nav.dart().vert].position);
                  singularity_model.surface_vert_color.push_back(color);
              }
              nav = nav.rotate_on_edge();
          } while (nav.face() != begin);
      }
    }

    void App::add_visible_face(Dart& dart, float normal_sign) {
        MeshNavigator nav = mesh->navigate(dart);
        if (normal_sign == -1) {
            nav = nav.flip_hexa().flip_edge();
        }

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

            // If hexa quality display is enabled, fetch the color from there.
            // Otherwise use the defautl coloration (white for outer faces, yellow for everything else)
            Vector3f color;
            if (do_show_color_map) {
                color = color_map.get(mesh->hexa_quality[nav.hexa_index()]);
            } else {
                color = nav.is_face_boundary() ? this->visible_outside_color : this->visible_inside_color;
            }
            visible_model.surface_vert_color.push_back(color);
            visible_model.surface_vert_color.push_back(color);
            visible_model.surface_vert_color.push_back(color);
        }
    }

    void App::add_visible_wireframe(Dart& dart) {
        MeshNavigator nav = mesh->navigate(dart);
        //if (nav.edge().mark != mesh->mark) {
//            nav.edge().mark = mesh->mark;
            MeshNavigator edge_nav = nav;
            for (int v = 0; v < 2; ++v) {
                visible_model.wireframe_vert_pos.push_back(mesh->verts[edge_nav.dart().vert].position);
                edge_nav = edge_nav.flip_vert();
            }
        //}
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
        //if (nav.edge().mark != mesh->mark) {
//            nav.edge().mark = mesh->mark;
            MeshNavigator edge_nav = nav;
            for (int v = 0; v < 2; ++v) {
                filtered_model.wireframe_vert_pos.push_back(mesh->verts[edge_nav.dart().vert].position);
                edge_nav = edge_nav.flip_vert();
            }
        //}
    }

    void App::build_models() {
        if (mesh == nullptr) return;

        auto t_start = sample_time();

        mesh->unmark_all();

        visible_model.clear();
        filtered_model.clear();

        for (size_t i = 0; i < filters.size(); ++i) {
            filters[i]->filter(*mesh);
        }

        for (size_t i = 0; i < mesh->faces.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->faces[i]);
            // hexa a visible, hexa b not existing or not visible
            if (! mesh->is_hexa_marked(nav.hexa())
                && (nav.dart().hexa_neighbor == -1
                    || mesh->is_hexa_marked(nav.flip_hexa().hexa()))) {
                add_visible_face(nav.dart(), 1);
                // hexa a invisible, hexa b existing and visible
            } else if ( mesh->is_hexa_marked(nav.hexa())
                && nav.dart().hexa_neighbor != -1
                && !mesh->is_hexa_marked(nav.flip_hexa().hexa())) {
                add_visible_face(nav.dart(), -1);
//                add_filtered_face(nav.dart());
                // face was culled by the plane, is surface
            } else if ( mesh->is_hexa_marked(nav.hexa())
                    && nav.dart().hexa_neighbor == -1) {
                add_filtered_face(nav.dart());
            }
        }
    }
}
