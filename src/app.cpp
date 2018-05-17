#include <app.h>

#include <limits>

#define D2R (3.141592653589793f / 180.f)

namespace HexaLab {

    // PUBLIC

    bool App::import_mesh ( string path ) {
        delete mesh;
        mesh = new Mesh();
        // Load
        HL_LOG ( "Loading %s...\n", path.c_str() );
        vector<Vector3f> verts;
        vector<HexaLab::Index> indices;

        if ( !Loader::load ( path, verts, indices ) ) {
            return false;
        }

        // Build
        HL_LOG ( "Building...\n" );
        Builder::build ( *mesh, verts, indices );
        // Validate
         HL_LOG ( "Validating...\n" );
         Builder::validate ( *mesh );
        // Update stats
        float max = std::numeric_limits<float>::lowest();
        float min = std::numeric_limits<float>::max();
        float avg = 0;

        for ( size_t i = 0; i < mesh->edges.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->edges[i] );
            Vector3f edge = nav.vert().position - nav.flip_vert().vert().position;
            float len = edge.norm();

            if ( len < min ) {
                min = len;
            }

            if ( len > max ) {
                max = len;
            }

            avg += len;
        }

        avg /= mesh->edges.size();
        mesh_stats.min_edge_len = min;
        mesh_stats.max_edge_len = max;
        mesh_stats.avg_edge_len = avg;
        float avg_v = 0;
        Vector3f v[8];

        for ( size_t i = 0; i < mesh->hexas.size(); ++i ) {
            int j = 0;
            MeshNavigator nav = mesh->navigate ( mesh->hexas[i] );
            Vert& a = nav.vert();

            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while ( nav.vert() != a );

            nav = nav.rotate_on_hexa().rotate_on_hexa().flip_vert();
            Vert& b = nav.vert();

            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while ( nav.vert() != b );

            avg_v += QualityMeasureFun::volume ( v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], nullptr );
        }

        avg_v /= mesh->hexas.size();
        mesh_stats.avg_volume = avg_v;
        mesh_stats.vert_count = mesh->verts.size();
        mesh_stats.hexa_count = mesh->hexas.size();
        mesh_stats.aabb = mesh->aabb;
        mesh_stats.quality_min = 0;
        mesh_stats.quality_max = 0;
        mesh_stats.quality_avg = 0;
        mesh_stats.quality_var = 0;
        // build quality buffers
        this->compute_hexa_quality();

        // notify filters
        for ( size_t i = 0; i < filters.size(); ++i ) {
            filters[i]->on_mesh_set ( *mesh );
        }

        // build buffers
        this->flag_models_as_dirty();
        //this->update_models();
        this->build_singularity_models();
        return true;
    }

    void App::enable_quality_color_mapping ( ColorMap::Palette e ) {
        this->color_map = ColorMap ( e );
        this->quality_color_mapping_enabled = true;
        this->flag_models_as_dirty();   // TODO update color only
    }

    void App::disable_quality_color_mapping() {
        this->quality_color_mapping_enabled = false;
        this->flag_models_as_dirty();   // TODO update color only
    }

    void App::set_quality_measure ( QualityMeasureEnum e ) {
        this->quality_measure = e;
        this->compute_hexa_quality();

        if ( this->is_quality_color_mapping_enabled() ) {
            this->flag_models_as_dirty();   // TODO update color only
        }
    }

    void App::set_geometry_mode ( GeometryMode mode ) {
        this->geometry_mode = mode;
        this->flag_models_as_dirty();
    }

    void App::set_default_outside_color ( float r, float g, float b ) {
        this->default_outside_color = Vector3f ( r, g, b );

        if ( !this->is_quality_color_mapping_enabled() ) {
            this->flag_models_as_dirty();
        }
    }

    void App::set_default_inside_color ( float r, float g, float b ) {
        this->default_inside_color = Vector3f ( r, g, b );

        if ( !this->is_quality_color_mapping_enabled() ) {
            this->flag_models_as_dirty();
        }
    }

    void App::add_filter ( IFilter* filter ) {
        this->filters.push_back ( filter );
        this->flag_models_as_dirty();
    }

    bool App::update_models() {
        if ( this->models_dirty_flag ) {
            this->build_surface_models();
            this->models_dirty_flag = false;
            return true;
        }

        return false;
    }


    void App::show_boundary_singularity ( bool do_show ) {
        this->do_show_boundary_singularity = do_show;
        this->flag_models_as_dirty();
    }
    void App::show_boundary_creases ( bool do_show ) {
        this->do_show_boundary_creases = do_show;
        this->flag_models_as_dirty();
    }

    void App::set_crack_size(float size) { 
        this->crack_size = size; 
        this->flag_models_as_dirty(); 
    }
    void App::set_rounding_radius(float rad) { 
        this->rounding_radius = rad; 
        this->flag_models_as_dirty(); 
    }

    // PRIVATE

    void App::compute_hexa_quality() {
        quality_measure_fun* fun = get_quality_measure_fun ( this->quality_measure );
        void* arg = nullptr;

        switch ( this->quality_measure ) {
            case QualityMeasureEnum::RSS:
            case QualityMeasureEnum::SHAS:
            case QualityMeasureEnum::SHES:
                arg = &this->mesh_stats.avg_volume;
                break;

            default:
                break;
        }

        float min = std::numeric_limits<float>::max();
        float max = -std::numeric_limits<float>::max();
        float sum = 0;
        float sum2 = 0;
        mesh->hexa_quality.resize ( mesh->hexas.size() );
        mesh->normalized_hexa_quality.resize ( mesh->hexas.size() );
        Vector3f v[8];

        for ( size_t i = 0; i < mesh->hexas.size(); ++i ) {
            int j = 0;
            MeshNavigator nav = mesh->navigate ( mesh->hexas[i] );
            Vert& a = nav.vert();

            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while ( nav.vert() != a );

            nav = nav.rotate_on_hexa().rotate_on_hexa().flip_vert();
            Vert& b = nav.vert();

            do {
                v[j++] = nav.vert().position;
                nav = nav.rotate_on_face();
            } while ( nav.vert() != b );

            float q = fun ( v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], arg );
            mesh->hexa_quality[i] = q;

            if ( min > q ) {
                min = q;
            }

            if ( max < q ) {
                max = q;
            }

            sum += q;
            sum2 += q * q;
        }

        this->mesh_stats.quality_min = min;
        this->mesh_stats.quality_max = max;
        this->mesh_stats.quality_avg = sum / mesh->hexas.size();
        this->mesh_stats.quality_var = sum2 / mesh->hexas.size() - this->mesh_stats.quality_avg * this->mesh_stats.quality_avg;
        min = std::numeric_limits<float>::max();
        max = -std::numeric_limits<float>::max();

        for ( size_t i = 0; i < mesh->hexas.size(); ++i ) {
            float q = normalize_quality_measure ( this->quality_measure, mesh->hexa_quality[i], this->mesh_stats.quality_min, this->mesh_stats.quality_max );

            if ( min > q ) {
                min = q;
            }

            if ( max < q ) {
                max = q;
            }

            mesh->normalized_hexa_quality[i] = q;
        }

        this->mesh_stats.normalized_quality_min = min;
        this->mesh_stats.normalized_quality_max = max;
    }

    void App::build_singularity_models() {
        singularity_model.clear();

        // boundary_singularity_model.clear();
        // boundary_creases_model.clear();
        for ( size_t i = 0; i < mesh->edges.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->edges[i] );
            // -- Boundary check --
            // {
            //     bool boundary = false;
            //     Face& begin = nav.face();
            //     do {
            //         if (nav.is_face_boundary()) {
            //             boundary = true;
            //             break;
            //         }
            //         nav = nav.rotate_on_edge();
            //     } while(nav.face() != begin);
            //     if (boundary) {
            //         // Boundary singularity
            //         if (nav.incident_face_on_edge_num() != 2) {
            //             for (int n = 0; n < 2; ++n) {     // 2 verts that make the edge
            //                 boundary_singularity_model.wireframe_vert_pos.push_back(nav.vert().position);
            //                 boundary_singularity_model.wireframe_vert_color.push_back(Vector3f(0, 0, 1));
            //                 nav = nav.flip_vert();
            //             }
            //         }
            //         // Boundary Crease
            //         MeshNavigator nav2 = nav.flip_face();
            //         if (!nav2.is_face_boundary()) {
            //             nav2 = nav2.flip_hexa().flip_face();
            //             float dot = nav.face().normal.dot(nav2.face().normal);
            //             if (std::acos(dot) > 30 * D2R) {
            //                 for (int n = 0; n < 2; ++n) {     // 2 verts that make the edge
            //                     boundary_creases_model.wireframe_vert_pos.push_back(nav.vert().position);
            //                     boundary_creases_model.wireframe_vert_color.push_back(Vector3f(1, 0, 0));
            //                     nav = nav.flip_vert();
            //                 }
            //             }
            //         }
            //     }
            // }
            // -- Singularity check
            int face_count = nav.incident_face_on_edge_num();

            if ( face_count == 4 ) {
                continue;
            }

            if ( nav.edge().is_surface ) {
                continue;
            }

            // add edge
            for ( int j = 0; j < 2; ++j ) {
                singularity_model.wireframe_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
                nav = nav.flip_vert();
            }

            Vector3f color;

            switch ( face_count ) {
                case  3:
                    color = Vector3f ( 1, 0, 0 );
                    break;

                case  5:
                    color = Vector3f ( 0, 1, 0 );
                    break;

                default:
                    color = Vector3f ( 0, 0, 1 );
            }

            singularity_model.wireframe_vert_color.push_back ( color );
            singularity_model.wireframe_vert_color.push_back ( color );
            // add adjacent faces
            Face& begin = nav.face();

            do {                                          // foreach face adjacent tot he singularity edge
                for ( int k = 0; k < 2; ++k ) {           // for both triangles making up the face
                    for ( int j = 0; j < 2; ++j ) {       // 2 + 1 face vertices add
                        singularity_model.surface_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
                        singularity_model.surface_vert_color.push_back ( color );

                        for ( int n = 0; n < 2; ++n ) {   // 2 verts that make the edge
                            if ( j == 0 && k == 1 ) {
                                continue;
                            }

                            singularity_model.wireframe_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
                            singularity_model.wireframe_vert_color.push_back ( Vector3f ( 0, 0, 0 ) );
                            nav = nav.flip_vert();
                        }

                        nav = nav.rotate_on_face();
                    }

                    singularity_model.surface_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
                    singularity_model.surface_vert_color.push_back ( color );
                }

                nav = nav.rotate_on_edge();
            } while ( nav.face() != begin );
        }
    }

    void App::add_visible_vert ( Dart& dart, float normal_sign, Vector3f color ) {
        MeshNavigator nav = mesh->navigate ( dart );
        visible_model.surface_vert_pos.push_back ( nav.vert().position );
        visible_model.surface_vert_norm.push_back ( nav.face().normal * normal_sign );
        visible_model.surface_vert_color.push_back ( color );
        HL_ASSERT ( visible_model.surface_vert_pos.size() == visible_model.surface_vert_norm.size() &&
                    visible_model.surface_vert_pos.size() == visible_model.surface_vert_color.size() );
        Index idx = visible_model.surface_vert_pos.size() - 1;
        visible_model.surface_ibuffer.push_back ( idx );
    }

    size_t App::add_vertex ( Vector3f pos, Vector3f norm, Vector3f color ) {
        size_t i = visible_model.surface_vert_pos.size();
        visible_model.surface_vert_pos.push_back ( pos );
        visible_model.surface_vert_norm.push_back ( norm );
        visible_model.surface_vert_color.push_back ( color );
        return i;
    }

    void App::add_triangle ( size_t i1, size_t i2, size_t i3 ) {
        visible_model.surface_ibuffer.push_back ( i1 );
        visible_model.surface_ibuffer.push_back ( i2 );
        visible_model.surface_ibuffer.push_back ( i3 );
    }

    void App::add_quad ( size_t i1, size_t i2, size_t i3, size_t i4 ) {
        add_triangle ( i1, i2, i3 );
        add_triangle ( i3, i4, i1 );
    }

    // dart: first dart in the face to render
    void App::add_visible_face ( Dart& dart, float normal_sign ) {
        MeshNavigator nav = mesh->navigate ( dart );

        // Faces are normally shared between two hexas, but their data structure references only one of them, the 'main' (the first encountered when parsing the mesh file).
        // If the normal sign is -1, it means that the hexa we want to render is not the main.
        // Therefore a flip hexa is performed, along with a flip edge to maintain the winding.
        if ( normal_sign == -1 ) {
            nav = nav.flip_hexa().flip_edge();
        }

        // If hexa quality display is enabled, fetch the appropriate quality color.
        // Otherwise use the defautl coloration (white for outer faces, yellow for everything else)
        Vector3f color;

        if ( is_quality_color_mapping_enabled() ) {
            color = color_map.get ( mesh->normalized_hexa_quality[nav.hexa_index()] );
        } else {
            color = nav.is_face_boundary() ? this->default_outside_color : this->default_inside_color;
        }

        for ( int i = 0; i < 2; ++i ) {
            for ( int j = 0; j < 2; ++j ) {
                add_visible_wireframe ( nav.dart() );
                nav = nav.rotate_on_face();
            }
        }

        nav = mesh->navigate ( dart );
        // nav = mesh->navigate(nav.hexa());   // TODO remove this

        if ( normal_sign == -1 ) {
            nav = nav.flip_vert();    // TODO flip hexa/edge instead? same thing?
        }

        Vert& vert = nav.vert();
        Index idx = visible_model.surface_vert_pos.size();

        do {
            add_vertex ( nav.vert().position, nav.face().normal * normal_sign, color );
            nav = nav.rotate_on_face();
        } while ( nav.vert() != vert );

        add_triangle ( idx + 2, idx + 1, idx + 0 );
        add_triangle ( idx + 0, idx + 3, idx + 2 );
    }

    void App::add_visible_wireframe ( Dart& dart ) {
        MeshNavigator nav = mesh->navigate ( dart );
        //if (nav.edge().mark != mesh->mark) {
        //            nav.edge().mark = mesh->mark;
        MeshNavigator edge_nav = nav;
        bool boundary_singularity = false;
        bool boundary_crease = false;

        if ( this->do_show_boundary_singularity ) {
            if ( nav.incident_face_on_edge_num() != 2 ) {
                boundary_singularity = true;
            }
        }

        // if (this->do_show_boundary_creases) {
        //     Face& begin = nav.face();
        //     bool prev_face_is_boundary = false;
        //     Vector3f prev_face_normal;
        //     do {
        //         if (!prev_face_is_boundary) {
        //             if (nav.is_face_boundary()) {
        //                 prev_face_is_boundary = true;
        //                 prev_face_normal = nav.face().normal;
        //             }
        //         } else {
        //             if (nav.is_face_boundary()) {
        //                 // float dot = nav.face().normal.dot(prev_face_normal);
        //                 // if (std::acos(std::abs(dot)) > 1 * D2R) {
        //                     boundary_crease = true;
        //                     break;      // Ends in a different dart from the starting one!
        //                 // }
        //             } else {
        //                 prev_face_is_boundary = false;
        //             }
        //         }
        //         nav = nav.rotate_on_edge();
        //     } while (nav.face() != begin);
        // }
        for ( int v = 0; v < 2; ++v ) {
            visible_model.wireframe_vert_pos.push_back ( edge_nav.vert().position );

            // if (this->do_show_boundary_singularity && boundary_singularity
            // && this->do_show_boundary_creases && boundary_crease) {
            // visible_model.wireframe_vert_color.push_back(Vector3f(0, 1, 1));
            // } else
            if ( this->do_show_boundary_singularity && boundary_singularity ) {
                visible_model.wireframe_vert_color.push_back ( Vector3f ( 0, 0, 1 ) );
                // } else if (this->do_show_boundary_creases && boundary_crease) {
                // visible_model.wireframe_vert_color.push_back(Vector3f(0, 1, 0));
            } else {
                visible_model.wireframe_vert_color.push_back ( Vector3f ( 0, 0, 0 ) );
            }

            edge_nav = edge_nav.flip_vert();
        }

        //}
    }

    void App::add_filtered_face ( Dart& dart ) {
        MeshNavigator nav = mesh->navigate ( dart );

        for ( int i = 0; i < 2; ++i ) {
            for ( int j = 0; j < 2; ++j ) {
                filtered_model.surface_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
                add_filtered_wireframe ( nav.dart() );
                nav = nav.rotate_on_face();
            }

            filtered_model.surface_vert_pos.push_back ( mesh->verts[nav.dart().vert].position );
            Vector3f normal = nav.face().normal;
            filtered_model.surface_vert_norm.push_back ( normal );
            filtered_model.surface_vert_norm.push_back ( normal );
            filtered_model.surface_vert_norm.push_back ( normal );
        }
    }

    void App::add_filtered_wireframe ( Dart& dart ) {
        MeshNavigator nav = mesh->navigate ( dart );
        //if (nav.edge().mark != mesh->mark) {
        //            nav.edge().mark = mesh->mark;
        MeshNavigator edge_nav = nav;

        for ( int v = 0; v < 2; ++v ) {
            filtered_model.wireframe_vert_pos.push_back ( mesh->verts[edge_nav.dart().vert].position );
            edge_nav = edge_nav.flip_vert();
        }

        //}
    }

    void App::prepare_geometry() {
        for ( size_t i = 0; i < mesh->faces.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->faces[i] );

            // hexa a visible, hexa b not existing or not visible
            if ( !mesh->is_marked ( nav.hexa() ) && ( nav.dart().hexa_neighbor == -1 || mesh->is_marked ( nav.flip_hexa().hexa() ) ) ) {
                this->add_visible_face ( nav.dart(), 1 );
            // hexa a invisible, hexa b existing and visible
            } else if ( mesh->is_marked ( nav.hexa() ) && nav.dart().hexa_neighbor != -1 && !mesh->is_marked ( nav.flip_hexa().hexa() ) ) {
                this->add_visible_face ( nav.dart(), -1 );
                // add_filtered_face(nav.dart());
            // face was culled by the plane, is surface
            } else if ( mesh->is_marked ( nav.hexa() ) && nav.dart().hexa_neighbor == -1 ) {
                this->add_filtered_face ( nav.flip_edge().dart() );
            }
        }
    }

    void App::build_gap_hexa ( const Vector3f pp[8], const Vector3f nn[6], const bool vv[8], const Vector3f ww[6] ) {
        if ( !vv[0] && !vv[1] && !vv[2] && !vv[3] && !vv[4] && !vv[5] && !vv[6] && !vv[7] ) {
            return;
        }

        float gap = this->max_crack_size * crack_size;

        Vector3f bari ( 0, 0, 0 );

        for ( int i = 0; i < 8; i++ ) {
            bari += pp[i];
        }

        bari *= ( gap / 8 );
        auto addSide = [&] ( int v0, int v1, int v2, int v3, int fi ) {
            if ( vv[v0] || vv[v1] || vv[v2] || vv[v3] ) add_quad (
                    add_vertex ( ( !vv[v0] ) ? pp[v0] : ( pp[v0] * ( 1 - gap ) + bari ), nn[fi], ww[fi] ),
                    add_vertex ( ( !vv[v3] ) ? pp[v3] : ( pp[v3] * ( 1 - gap ) + bari ), nn[fi], ww[fi] ),
                    add_vertex ( ( !vv[v2] ) ? pp[v2] : ( pp[v2] * ( 1 - gap ) + bari ), nn[fi], ww[fi] ),
                    add_vertex ( ( !vv[v1] ) ? pp[v1] : ( pp[v1] * ( 1 - gap ) + bari ), nn[fi], ww[fi] )
                );
        };
        //    P6------P7
        //   / |     / |
        //  P2------P3 |
        //  |  |    |  |
        //  | P4----|--P5
        //  | /     | /
        //  P0------P1
        //
        addSide(0 + 0, 2 + 0, 6 + 0, 4 + 0, 0);
        addSide(2 + 1, 0 + 1, 4 + 1, 6 + 1, 1);
        addSide(0 + 0, 1 + 0, 3 + 0, 2 + 0, 4);
        addSide(1 + 4, 0 + 4, 2 + 4, 3 + 4, 5);
        addSide(0 + 0, 4 + 0, 5 + 0, 1 + 0, 2);
        addSide(4 + 2, 0 + 2, 1 + 2, 5 + 2, 3);
        //addSide ( 0 + 0, 2 + 0, 6 + 0, 4 + 0, 1 );
        //addSide ( 2 + 1, 0 + 1, 4 + 1, 6 + 1, 0 );
        //addSide ( 0 + 0, 1 + 0, 3 + 0, 2 + 0, 5 );
        //addSide ( 1 + 4, 0 + 4, 2 + 4, 3 + 4, 4 );
        //addSide ( 0 + 0, 4 + 0, 5 + 0, 1 + 0, 3 );
        //addSide ( 4 + 2, 0 + 2, 1 + 2, 5 + 2, 2 );
        //{ 0, 1, 2, 3 },   // Front
        //{ 5, 4, 7, 6 },   // Back
        //{ 1, 5, 6, 2 },   // Left
        //{ 4, 0, 3, 7 },   // Right
        //{ 6, 7, 3, 2 },   // Bottom
        //{ 4, 5, 1, 0 },   // Top
    }

    /*
    float len(vec3 p){
    return p[0]*p[0]+p[1]*p[1]+p[2]*p[2];
    }*/

    // 8 [pp]ositions, 6 [nn]ormals, 8 [vv]isible 6 [ww]hite_or_not
    void App::build_smooth_hexa ( const Vector3f pp[8], const Vector3f nn[6], const bool vv[8], const bool ww[6], Index hexa_idx ) {
        if ( !vv[0] && !vv[1] && !vv[2] && !vv[3] && !vv[4] && !vv[5] && !vv[6] && !vv[7] ) {
            return;
        }

        static Vector3f p[4][4][4];
        static Vector3f n[4][4][4];
        static bool     w[4][4][4]; // TODO
        static int     iv[4][4][4]; // indices
        auto addSide = [&] ( int v0, int v1, int v2, int v3, bool side ) {
            if ( ( v0 != -1 ) && ( v1 != -1 ) && ( v2 != -1 ) && ( v3 != -1 ) ) {
                add_quad ( v0, v1, v2, v3 );
            } else if ( side ) {
                if ( ( v0 != -1 ) && ( v1 != -1 ) && ( v2 != -1 ) ) {
                    add_triangle ( v0, v1, v2 );
                } else if ( ( v0 != -1 ) && ( v1 != -1 ) && ( v3 != -1 ) ) {
                    add_triangle ( v0, v1, v3 );
                } else if ( ( v0 != -1 ) && ( v2 != -1 ) && ( v3 != -1 ) ) {
                    add_triangle ( v0, v2, v3 );
                } else if ( ( v1 != -1 ) && ( v2 != -1 ) && ( v3 != -1 ) ) {
                    add_triangle ( v1, v2, v3 );
                }
            }
        };

        // compute normals / whites (from per face to per vertex)
        for ( int z = 0; z < 4; z++ ) {
            for ( int y = 0; y < 4; y++ ) {
                for ( int x = 0; x < 4; x++ ) {
                    n[x][y][z] = Vector3f ( 0, 0, 0 ); // todo: memfill or something - ?
                    w[x][y][z] = false;
                }
            }
        }

        for ( int z = 0; z < 4; z++ ) {
            for ( int y = 0; y < 4; y++ ) {
                n[0][y][z] += nn[0];
                n[3][y][z] += nn[1];
                n[y][0][z] += nn[2];
                n[y][3][z] += nn[3];
                n[y][z][0] += nn[4];
                n[y][z][3] += nn[5];
                w[0][y][z] |= ww[0];    // TODO
                w[3][y][z] |= ww[1];
                w[y][0][z] |= ww[2];
                w[y][3][z] |= ww[3];
                w[y][z][0] |= ww[4];
                w[y][z][3] |= ww[5];
            }
        }

        for ( int i = 0; i < 4; ++i ) {
            for ( int j = 0; j < 4; ++j ) {
                for ( int k = 0; k < 4; ++k ) {
                    n[i][j][k].normalize();
                }
            }
        }

        for ( int z = 0; z < 4; z++ ) {
            for ( int y = 0; y < 4; y++ ) {
                for ( int x = 0; x < 4; x++ ) {
                    int ii = ( x / 2 ) + ( y / 2 ) * 2 + ( z / 2 ) * 4;
                    p[x][y][z] = pp[ii];
                    iv[x][y][z] = -1;
                }
            }
        }

        float smooth = this->max_rounding_radius * this->rounding_radius;

        for ( int z = 0; z < 4; z += 3 ) {
            for ( int y = 0; y < 4; y += 3 ) {
                for ( int x = 0; x < 4; x += 3 ) {
                    //std::cout << " ";
                    for ( int D = 0; D < 3; D++ ) {
                        int dA[3] = { 0, 0, 0 };
                        int dB[3] = { 0, 0, 0 };
                        int dC[3] = { 0, 0, 0 };
                        int s[3];
                        dA[D] = 1;
                        dB[ ( D + 1 ) % 3] = 1;
                        dC[ ( D + 2 ) % 3] = 1;
                        s[0] = ( x > 1 ) ? -1 : +1;
                        s[1] = ( y > 1 ) ? -1 : +1;
                        s[2] = ( z > 1 ) ? -1 : +1;
                        int ii = ( x / 2 ) + ( y / 2 ) * 2 + ( z / 2 ) * 4;

                        if ( vv[ii] ) {
                            int jj = ( ii ^ ( 1 << D ) );
                            Vector3f edge0 = ( pp[jj] - pp[ii] ) * smooth;
                            Vector3f edge1 = ( pp[jj] - pp[ii] ) * ( smooth * ( 1 - ( sqrt ( 2 ) / 2 ) ) );
                            Vector3f edge2 = ( pp[jj] - pp[ii] ) * ( smooth * ( 1 - ( sqrt ( 3 ) / 3 ) ) );
                            p[x + s[0] * ( dA[0] )][y + s[1] * ( dA[1] )][z + s[2] * ( dA[2] )] += edge0;
                            p[x + s[0] * ( dB[0] + dA[0] )][y + s[1] * ( dB[1] + dA[1] )][z + s[2] * ( dB[2] + dA[2] )] += edge0;
                            p[x + s[0] * ( dC[0] + dA[0] )][y + s[1] * ( dC[1] + dA[1] )][z + s[2] * ( dC[2] + dA[2] )] += edge0;
                            p[x + s[0] * ( dB[0] )][y + s[1] * ( dB[1] )][z + s[2] * ( dB[2] )] += edge1;
                            p[x + s[0] * ( dC[0] )][y + s[1] * ( dC[1] )][z + s[2] * ( dC[2] )] += edge1;
                            p[x][y][z] += edge2;
                        }
                    }
                }
            }
        }

        for ( int z = 0; z < 4; z++ ) {
            for ( int y = 0; y < 4; y++ ) {
                for ( int x = 0; x < 4; x++ ) {
                    int i = ( x / 2 ) + ( y / 2 ) * 2 + ( z / 2 ) * 4;
                    bool mx = ( ( x > 0 ) && ( x < 3 ) ); // mid
                    bool my = ( ( y > 0 ) && ( y < 3 ) );
                    bool mz = ( ( z > 0 ) && ( z < 3 ) );
                    int category = 0;

                    if ( mx ) {
                        category++;
                    }

                    if ( my ) {
                        category++;
                    }

                    if ( mz ) {
                        category++;
                    }

                    int j = i;

                    if ( category == 1 ) {
                        if ( mx ) {
                            j ^= 1;
                        }

                        if ( my ) {
                            j ^= 2;
                        }

                        if ( mz ) {
                            j ^= 4;
                        }
                    }

                    /*
                    v[i][j][k] =    (category==3)  // midpoint: never show
                    || (category==0 && !vv[i])  // corner: show only if corner visible
                    || (category==1 && !vv[i] && !vv[j])  // mid edge: show only if corner visible
                    || (category==2 && !vv[i]); // mid face: show only if corner visible*/

                    if ( category == 0 && !vv[i] ) {
                        continue;    // corner: show only if corner visible
                    }

                    if ( category == 1 && !vv[i] && !vv[j] ) {
                        continue;    // mid edge: show only if corner visible
                    }

                    if ( category == 2 && !vv[i] ) {
                        continue;    // mid face: show only if corner visible*/
                    }

                    if ( category == 3 ) {
                        continue;    // midpoint: never show
                    }

                    Vector3f c;
                    if (is_quality_color_mapping_enabled()) {
                        c = color_map.get(mesh->normalized_hexa_quality[hexa_idx]);
                    } else {
                        c = w[x][y][z] ? this->default_outside_color : this->default_inside_color;
                    }
                    iv[x][y][z] = add_vertex ( p[x][y][z], n[x][y][z], c );
                    //std::cout<<"Range = "<<len(p[x][y][z]-vec3(1,1,1))<<"\n"; // test: smooth = 0.5 --> perfect sphere
                }
            }
        }

        for ( int x = 0; x < 3; x++ ) {
            for ( int y = 0; y < 3; y++ ) {
                bool mx = ( x == 1 ); // mid
                bool my = ( y == 1 );
                int category = 0;

                if ( mx ) {
                    category++;
                }

                if ( my ) {
                    category++;
                }

                addSide ( iv[x][y][0], iv[x][y + 1][0], iv[x + 1][y + 1][0], iv[x + 1][y][0], category == 1 );
                addSide ( iv[x][y][3], iv[x + 1][y][3], iv[x + 1][y + 1][3], iv[x][y + 1][3], category == 1 );
                addSide ( iv[x][0][y], iv[x + 1][0][y], iv[x + 1][0][y + 1], iv[x][0][y + 1], category == 1 );
                addSide ( iv[x][3][y], iv[x][3][y + 1], iv[x + 1][3][y + 1], iv[x + 1][3][y], category == 1 );
                addSide ( iv[0][x][y], iv[0][x][y + 1], iv[0][x + 1][y + 1], iv[0][x + 1][y], category == 1 );
                addSide ( iv[3][x][y], iv[3][x + 1][y], iv[3][x + 1][y + 1], iv[3][x][y + 1], category == 1 );
            }
        }
    }

    void App::prepare_cracked_geometry() {
        auto mark_face_as_visible = [] ( Mesh * mesh, Dart & dart ) {
            MeshNavigator nav = mesh->navigate ( dart );
            Vert& vert = nav.vert();

            do {
                mesh->mark ( nav.vert() );
                nav = nav.rotate_on_face();
            } while ( nav.vert() != vert );
        };

        for ( size_t i = 0; i < mesh->faces.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->faces[i] );

            if ( !mesh->is_marked ( nav.hexa() ) && ( nav.dart().hexa_neighbor == -1 || mesh->is_marked ( nav.flip_hexa().hexa() ) ) ) {
                mark_face_as_visible ( this->mesh, nav.dart() );
            } else if ( mesh->is_marked ( nav.hexa() ) && nav.dart().hexa_neighbor != -1 && !mesh->is_marked ( nav.flip_hexa().hexa() ) ) {
                mark_face_as_visible ( this->mesh, nav.dart() );
            }
        }

        for (size_t i = 0; i < mesh->faces.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->faces[i]);
            if (mesh->is_marked(nav.hexa()) && nav.dart().hexa_neighbor == -1) {
                this->add_filtered_face(nav.flip_edge().dart());
            }
        }

        for ( size_t i = 0; i < mesh->hexas.size(); ++i ) {
            if ( mesh->is_marked ( mesh->hexas[i] ) ) {
                continue;
            }

            // ******
            //    P6------P7
            //   / |     / |
            //  P2------P3 |
            //  |  |    |  |
            //  | P4----|--P5
            //  | /     | /
            //  P0------P1
            Vector3f    verts_pos[8];
            bool        verts_vis[8];
            Vector3f    faces_colors[6];
            Vector3f    faces_norms[6];
            // ******
            // Extract face normals
            MeshNavigator nav = this->mesh->navigate ( mesh->hexas[i] );
            Face& face = nav.face();
            Vector3f    norms_buffer[6];
            Vector3f    colors_buffer[6];

            for ( size_t f = 0; f < 6; ++f ) {
                MeshNavigator n2 = this->mesh->navigate ( nav.face() );
                float normal_sign;

                if ( n2.hexa() == nav.hexa() ) {
                    normal_sign = 1;
                } else {
                    normal_sign = -1;
                    n2 = n2.flip_hexa().flip_edge();
                }

                norms_buffer[f] = n2.face().normal * normal_sign;
                // color
                if (is_quality_color_mapping_enabled()) {
                    colors_buffer[f] = color_map.get(mesh->normalized_hexa_quality[nav.hexa_index()]);
                } else {
                    colors_buffer[f] = nav.is_face_boundary() ? this->default_outside_color : this->default_inside_color;
                }
                nav = nav.next_hexa_face();
            }
            faces_norms[0] = norms_buffer[4];
            faces_norms[1] = norms_buffer[1];
            faces_norms[2] = norms_buffer[5];
            faces_norms[3] = norms_buffer[2];
            faces_norms[4] = norms_buffer[0];
            faces_norms[5] = norms_buffer[3];
            faces_colors[0] = colors_buffer[4];
            faces_colors[1] = colors_buffer[1];
            faces_colors[2] = colors_buffer[5];
            faces_colors[3] = colors_buffer[2];
            faces_colors[4] = colors_buffer[0];
            faces_colors[5] = colors_buffer[3];
            // Extract vertices
            nav = mesh->navigate ( mesh->hexas[i] );
            auto store_vert = [&] ( size_t i ) {
                verts_pos[i] = nav.vert().position;
                verts_vis[i] = mesh->is_marked ( nav.vert() );
            };
            nav = mesh->navigate ( mesh->hexas[i] ).flip_vert();
            store_vert ( 1 );
            nav = mesh->navigate ( mesh->hexas[i] );
            store_vert ( 0 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_vert();
            store_vert ( 5 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side();
            store_vert ( 4 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_vert().flip_edge().flip_vert();
            store_vert ( 3 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_edge().flip_vert();
            store_vert ( 2 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_vert().flip_edge().flip_vert();
            store_vert ( 7 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_edge().flip_vert();
            store_vert ( 6 );
            build_gap_hexa ( verts_pos, faces_norms, verts_vis, faces_colors );
        }
    }

    void App::prepare_smooth_geometry() {
        auto mark_face_as_visible = [] ( Mesh * mesh, Dart & dart ) {
            MeshNavigator nav = mesh->navigate ( dart );
            Vert& vert = nav.vert();

            do {
                mesh->mark ( nav.vert() );
                nav = nav.rotate_on_face();
            } while ( nav.vert() != vert );
        };

        for ( size_t i = 0; i < mesh->faces.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->faces[i] );

            if ( !mesh->is_marked ( nav.hexa() ) && ( nav.dart().hexa_neighbor == -1 || mesh->is_marked ( nav.flip_hexa().hexa() ) ) ) {
                mark_face_as_visible ( this->mesh, nav.dart() );
            } else if ( mesh->is_marked ( nav.hexa() ) && nav.dart().hexa_neighbor != -1 && !mesh->is_marked ( nav.flip_hexa().hexa() ) ) {
                mark_face_as_visible ( this->mesh, nav.dart() );
            }
        }

        for (size_t i = 0; i < mesh->faces.size(); ++i) {
            MeshNavigator nav = mesh->navigate(mesh->faces[i]);
            if (mesh->is_marked(nav.hexa()) && nav.dart().hexa_neighbor == -1) {
                this->add_filtered_face(nav.flip_edge().dart());
            }
        }

        for ( size_t i = 0; i < mesh->hexas.size(); ++i ) {
            if ( mesh->is_marked ( mesh->hexas[i] ) ) {
                continue;
            }

            // ******
            //    P6------P7
            //   / |     / |
            //  P4------P5 |
            //  |  |    |  |
            //  | P2----|--P3
            //  | /     | /
            //  P0------P1
            Vector3f    verts_pos[8];
            bool        verts_vis[8];
            bool        faces_vis[6]; // true: external, false: internal
            Vector3f    faces_norms[6];
            // ******
            // Extract face normals
            MeshNavigator nav = this->mesh->navigate ( mesh->hexas[i] );
            Face& face = nav.face();
            Vector3f    norms_buffer[6];
            bool        vis_buffer[6];

            for ( size_t f = 0; f < 6; ++f ) {
                MeshNavigator n2 = this->mesh->navigate ( nav.face() );
                float normal_sign;

                if ( n2.hexa() == nav.hexa() ) {
                    normal_sign = 1;
                } else {
                    normal_sign = -1;
                    n2 = n2.flip_hexa().flip_edge();
                }

                norms_buffer[f] = n2.face().normal * normal_sign;
                vis_buffer[f] = n2.dart().hexa_neighbor == -1;
                nav = nav.next_hexa_face();
            }

            faces_norms[0] = norms_buffer[4];
            faces_norms[1] = norms_buffer[1];
            faces_norms[2] = norms_buffer[5];
            faces_norms[3] = norms_buffer[2];
            faces_norms[4] = norms_buffer[0];
            faces_norms[5] = norms_buffer[3];
            faces_vis[0] = vis_buffer[4];
            faces_vis[1] = vis_buffer[1];
            faces_vis[2] = vis_buffer[5];
            faces_vis[3] = vis_buffer[2];
            faces_vis[4] = vis_buffer[0];
            faces_vis[5] = vis_buffer[3];
            // Extract vertices
            nav = mesh->navigate ( mesh->hexas[i] );
            auto store_vert = [&] ( size_t i ) {
                verts_pos[i] = nav.vert().position;
                verts_vis[i] = mesh->is_marked ( nav.vert() );
            };
            nav = mesh->navigate ( mesh->hexas[i] ).flip_vert();
            store_vert ( 1 );
            nav = mesh->navigate ( mesh->hexas[i] );
            store_vert ( 0 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_vert();
            store_vert ( 5 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side();
            store_vert ( 4 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_vert().flip_edge().flip_vert();
            store_vert ( 3 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_edge().flip_vert();
            store_vert ( 2 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_vert().flip_edge().flip_vert();
            store_vert ( 7 );
            nav = mesh->navigate ( mesh->hexas[i] ).flip_side().flip_edge().flip_vert();
            store_vert ( 6 );
            build_smooth_hexa ( verts_pos, faces_norms, verts_vis, faces_vis, nav.hexa_index() );
        }
    }

    void App::build_surface_models() {
        if ( mesh == nullptr ) {
            return;
        }

        auto t_start = sample_time();
        mesh->unmark_all();
        visible_model.clear();
        filtered_model.clear();

        for ( size_t i = 0; i < filters.size(); ++i ) {
            filters[i]->filter ( *mesh );
        }

        switch ( this->geometry_mode ) {
            case GeometryMode::Default:
                this->prepare_geometry();
                break;

            case GeometryMode::Cracked:
                this->prepare_cracked_geometry();
                break;

            case GeometryMode::Smooth:
                this->prepare_smooth_geometry();
                break;
        }
    }
}
