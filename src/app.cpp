#include <limits>

#include "app.h"


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

        mesh_stats.avg_edge_len = mesh->average_edge_lenght( mesh_stats.min_edge_len, mesh_stats.max_edge_len );
        mesh_stats.avg_volume = mesh->average_cell_volume(  );
        mesh_stats.vert_count = mesh->verts.size();
        mesh_stats.hexa_count = mesh->cells.size();
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
        this->build_full_model();
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
        if(this->mesh == nullptr) return; 
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

    void App::set_crack_size ( float size ) {
        this->crack_size = size;
        this->flag_models_as_dirty();
    }
    void App::set_rounding_radius ( float rad ) {
        this->rounding_radius = rad;
        this->flag_models_as_dirty();
    }

    void App::set_regularize_str ( size_t  level ) {
        this->regularize_str = level;
        this->flag_models_as_dirty();
    }

    void App::show_visible_wireframe_singularity ( bool show ) {
        this->do_show_visible_wireframe_singularity = show;
        this->flag_models_as_dirty();
    }

    // PRIVATE

    void App::compute_hexa_quality() {
        quality_measure_fun* qualityFunctor = get_quality_measure_fun ( this->quality_measure );
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

        float minQ =  std::numeric_limits<float>::max();
        float maxQ = -std::numeric_limits<float>::max();
        float sum = 0;
        float sum2 = 0;
        mesh->hexa_quality.resize ( mesh->cells.size() );
        mesh->normalized_hexa_quality.resize ( mesh->cells.size() );

        for ( size_t i = 0; i < mesh->cells.size(); ++i ) {
            Cell &c = mesh->cells[i];

            // from rational to irrational order!
            float q = qualityFunctor (
                    mesh->pos(c.vi[0]), mesh->pos(c.vi[1]), mesh->pos(c.vi[3]), mesh->pos(c.vi[2]),
                    mesh->pos(c.vi[4]), mesh->pos(c.vi[5]), mesh->pos(c.vi[7]), mesh->pos(c.vi[6]),  arg );
            mesh->hexa_quality[i] = q;
            minQ = min(q,minQ);
            maxQ = max(q,maxQ);
            sum += q;
            sum2 += q * q;
        }

        this->mesh_stats.quality_min = minQ;
        this->mesh_stats.quality_max = maxQ;
        this->mesh_stats.quality_avg = sum / mesh->cells.size();
        this->mesh_stats.quality_var = sum2 / mesh->cells.size() - this->mesh_stats.quality_avg * this->mesh_stats.quality_avg;
        minQ = std::numeric_limits<float>::max();
        maxQ = -std::numeric_limits<float>::max();

        for ( size_t i = 0; i < mesh->cells.size(); ++i ) {
            float q = normalize_quality_measure ( this->quality_measure, mesh->hexa_quality[i], this->mesh_stats.quality_min, this->mesh_stats.quality_max );
            minQ = min(q,minQ);
            maxQ = max(q,maxQ);
            mesh->normalized_hexa_quality[i] = q;
        }

        this->mesh_stats.normalized_quality_min = minQ;
        this->mesh_stats.normalized_quality_max = maxQ;
        HL_LOG ( "[QUALITY: %s] %f %f - norm %f %f.\n", get_quality_name(this->quality_measure), mesh_stats.quality_min,mesh_stats.quality_max,mesh_stats.normalized_quality_min,mesh_stats.normalized_quality_max );
    }

    void App::build_singularity_models() {
        line_singularity_model.clear();
        spined_singularity_model.clear();
        full_singularity_model.clear();

        for (Index fi=0; fi<mesh->faces.size();fi++) {
            for (short w = 0; w<4; w++ ) {
                int val = mesh->internal_edge_valency( fi, w );
                if (val>0 && val!=4) {

                    Vector3f colWI; // wireframe Interior
                    Vector3f colWE; // wireframe Exterior
                    Vector3f colSI; // surface Interior
                    Vector3f colSE; // surface Exterior
                    Vector3f colSW; // surface Wire

                    switch ( val ) {
                        case  3:
                            colWI = Vector3f( 0.8f, 0.30f, 0.30f );
                            colWE = Vector3f( 1.0f, 0.80f, 0.80f );
                            colSE = Vector3f( 1.0f, 0.30f, 0.30f );
                            colSI = colSE * 0.6f;
                            colSW = colSI *0.75f;
                            break;

                        case  5:
                            colWI = Vector3f( 0.1f, 0.70f , 0.1f );
                            colWE = Vector3f( 0.5f, 0.90f , 0.5f );
                            colSE = Vector3f( 0.3f, 1.00f , 0.3f );;
                            colSI = colSE * 0.5f;
                            colSW = colSI * 0.75f;
                            break;

                        default:
                            colWI  = Vector3f( 0.2f, 0.2f, 1 );
                            colWE = Vector3f( 0.6f, 0.6f, 1 );
                            colSI = colWI * 0.5f;
                            colSE = colWI;
                            colSW = colSI * 0.75f;
                            break;
                    }
                    FourIndices v = mesh->vertex_indices( mesh->faces[fi] );
                    line_singularity_model.add_wire_vert( mesh->verts[v[w]].position , colWI);
                    line_singularity_model.add_wire_vert( mesh->verts[v[(w+1)%4]].position , colWI);

                }

            }
        }
/* TODO: singularities
        // boundary_singularity_model.clear();
        // boundary_creases_model.clear();
        for ( size_t i = 0; i < mesh->edges.size(); ++i ) {
            MeshNavigator nav = mesh->navigate ( mesh->edges[i] );

            // Boundary check: no thanks --

            int face_count = nav.incident_face_on_edge_num();

            if ( face_count == 4 ) {
                continue;
            }

            if ( nav.edge().is_surface ) {
                continue;
            }


            Vector3f black = Vector3f(0,0,0);
            Vector3f white = Vector3f(1,1,1);

            Vector3f v0, v1;

            v0 = mesh->verts[nav.dart().vert].position;
            v1 = mesh->verts[nav.flip_vert().dart().vert].position;


            // add adjacent faces/edges
            Face& begin = nav.face();

            do {
                Vector3f v2, v3;
                v2 = mesh->verts[nav.rotate_on_face().flip_vert().dart().vert].position;
                v3 = mesh->verts[nav.flip_vert().rotate_on_face().flip_vert().dart().vert].position;
                v2 = v2*0.45 + v1 *0.55;
                v3 = v3*0.45 + v0 *0.55;

                spined_singularity_model.add_wire_vert( v0, colWI );
                spined_singularity_model.add_wire_vert( v3, colWE );

                spined_singularity_model.add_wire_vert( v1, colWI );
                spined_singularity_model.add_wire_vert( v2, colWE );

                full_singularity_model.add_wire_vert( v0, colSW );
                full_singularity_model.add_wire_vert( v3, colSE );

                full_singularity_model.add_wire_vert( v1, colSW );
                full_singularity_model.add_wire_vert( v2, colSE );

                // add two tris
                full_singularity_model.add_surf_vert( v0,colSI );
                full_singularity_model.add_surf_vert( v1,colSI );
                full_singularity_model.add_surf_vert( v2,colSE );
                full_singularity_model.add_surf_vert( v2,colSE );
                full_singularity_model.add_surf_vert( v3,colSE );
                full_singularity_model.add_surf_vert( v0,colSI );

                nav = nav.rotate_on_edge();
            } while ( nav.face() != begin );

            line_singularity_model.add_wire_vert( v0 , colWI);
            spined_singularity_model.add_wire_vert( v0 , colWI);
            full_singularity_model.add_wire_vert( v0 , black);

            line_singularity_model.add_wire_vert( v1 , colWI);
            spined_singularity_model.add_wire_vert( v1 , colWI);
            full_singularity_model.add_wire_vert( v1 , black);


        }
        */
    }

    size_t App::add_vertex ( Vector3f pos, Vector3f norm, Vector3f color ) {
        size_t i = visible_model.surface_vert_pos.size();
        visible_model.surface_vert_pos.push_back ( pos );
        visible_model.surface_vert_norm.push_back ( norm );
        visible_model.surface_vert_color.push_back ( color );
        return i;
    }

    size_t App::add_full_vertex ( Vector3f pos, Vector3f norm, Vector3f color ) {
        size_t i = full_model.surface_vert_pos.size();
        full_model.surface_vert_pos.push_back ( pos );
        full_model.surface_vert_norm.push_back ( norm );
        full_model.surface_vert_color.push_back ( color );
        return i;
    }

    void App::add_triangle ( size_t i1, size_t i2, size_t i3 ) {
        visible_model.surface_ibuffer.push_back ( i1 );
        visible_model.surface_ibuffer.push_back ( i2 );
        visible_model.surface_ibuffer.push_back ( i3 );
    }

    void App::add_full_triangle ( size_t i1, size_t i2, size_t i3 ) {
        full_model.surface_ibuffer.push_back ( i1 );
        full_model.surface_ibuffer.push_back ( i2 );
        full_model.surface_ibuffer.push_back ( i3 );
    }

    void App::add_quad ( size_t i1, size_t i2, size_t i3, size_t i4 ) {
        add_triangle ( i1, i2, i3 );
        add_triangle ( i3, i4, i1 );
    }

    void App::add_visible_face ( const Face &face ) {

        Vector3f color;

        if ( is_quality_color_mapping_enabled() ) {
            color = color_map.get ( mesh->normalized_hexa_quality[ face.ci[0] ] );
        } else {
            color = face.is_boundary() ? this->default_outside_color : this->default_inside_color;
        }

        Index idx = visible_model.surface_vert_pos.size();

        FourIndices vi = mesh->vertex_indices( face );

        for (int i=0; i<4; i++) {
            add_vertex( mesh->pos(vi[i]) , face.normal, color );
        }
        this->add_triangle ( idx + 2, idx + 1, idx + 0 );
        this->add_triangle ( idx + 0, idx + 3, idx + 2 );

        for (short side=0; side<4; side++) {
            int v0 = vi[side];
            int v1 = vi[(side+1)&3];

            if (v0 <= v1) continue; // only once per edge! (also avoids degenerate edges)

            float alpha = 1.0;

            if (this->do_show_visible_wireframe_singularity) {  // if not flat_lines
                Index ci = face.ci[0];
                int new_side = Cell::pivot_face_around_edge( face.wi[0], side );
                Index cj = mesh->other_side( ci , new_side );
                if ( (cj < 0) || ( mesh->is_marked(cj) ) ) alpha = 0.1f;
                else {
                    // Is it really necessary to distinguish between 1 and multpiple edges?
                    // No. But, if so... put it here
                }
            }
            add_wireframe_edge( v0, v1, alpha );
        }
    }

    void App::add_wireframe_edge ( Index v0, Index v1, float alpha ){

        visible_model.wireframe_vert_pos.push_back ( mesh->pos(v0) );
        visible_model.wireframe_vert_pos.push_back ( mesh->pos(v1) );

        for (int i=0; i<2; i++) {
            // todo: color is not needed, alpha suffices
            visible_model.wireframe_vert_color.push_back ( Vector3f ( 0, 0, 0 ) );
            visible_model.wireframe_vert_alpha.push_back ( alpha );
        }

    }


    void App::add_filtered_face ( const Face& face ) {

        FourIndices vi = mesh->vertex_indices( face );

        for (int k=0; k<4; k++) {
            filtered_model.wireframe_vert_pos.push_back( mesh->verts[ vi[k] ].position );
            filtered_model.wireframe_vert_pos.push_back( mesh->verts[ vi[(k+1)%4] ].position );
        }

        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[0] ].position );
        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[1] ].position );
        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[2] ].position );

        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[2] ].position );
        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[3] ].position );
        filtered_model.surface_vert_pos.push_back ( mesh->verts[ vi[0] ].position );

        for (int k=0; k<6; k++)
            filtered_model.surface_vert_norm.push_back ( face.normal );
    }

    void App::add_full_face ( const Face& f ) {

        Index idx = full_model.surface_vert_pos.size();
        Vector3f color{ 1, 1, 1 };

        FourIndices vi = mesh->vertex_indices( f );
        for (int w=0; w<4; w++) {
            add_full_vertex ( mesh->verts[ vi[w] ].position , f.normal, color );
        }

        add_full_triangle ( idx + 2, idx + 1, idx + 0 );
        add_full_triangle ( idx + 0, idx + 3, idx + 2 );
    }

    void App::prepare_geometry() {
        for (const Face& f: mesh->faces) {
            bool side0 = !mesh->is_marked( f.ci[0] );
            bool side1 = !f.is_boundary() && !mesh->is_marked( f.ci[1] );
            if ( side0 && !side1 ) this->add_visible_face ( f );
            if (!side0 &&  side1 ) this->add_visible_face ( f.flipped() );
        }
    }

    //
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
        addSide ( 0 + 0, 2 + 0, 6 + 0, 4 + 0, 0 );
        addSide ( 2 + 1, 0 + 1, 4 + 1, 6 + 1, 1 );
        addSide ( 0 + 0, 1 + 0, 3 + 0, 2 + 0, 4 );
        addSide ( 1 + 4, 0 + 4, 2 + 4, 3 + 4, 5 );
        addSide ( 0 + 0, 4 + 0, 5 + 0, 1 + 0, 2 );
        addSide ( 4 + 2, 0 + 2, 1 + 2, 5 + 2, 3 );

    }


    // 8 [pp]ositions, 6 [nn]ormals, 8 [vv]isible, 6 [ww]hite_or_not
    void App::build_smooth_hexa ( const Vector3f pp[8], const Vector3f nn[6], const bool vv[8], const bool ww[6], Index cell_idx ) {
        if ( !vv[0] && !vv[1] && !vv[2] && !vv[3] && !vv[4] && !vv[5] && !vv[6] && !vv[7] ) {
            return;
        }

        static Vector3f p[4][4][4];
        static Vector3f n[4][4][4];
        static bool     w[4][4][4]; // TODO
        static Index    iv[4][4][4];

        auto addSide = [&] ( Index v0, Index v1, Index v2, Index v3, Index side ) {
            if ( ( v0 != -1 ) && ( v1 != -1 ) && ( v2 != -1 ) && ( v3 != -1 ) ) {
                add_quad ( v0, v1, v2, v3 );
            } else if ( side ) {
                if ( (v0!=-1) && (v1!=-1) && (v2!=-1) ) add_triangle ( v0, v1, v2 ); else
                if ( (v0!=-1) && (v1!=-1) && (v3!=-1) ) add_triangle ( v0, v1, v3 ); else
                if ( (v0!=-1) && (v2!=-1) && (v3!=-1) ) add_triangle ( v0, v2, v3 ); else
                if ( (v1!=-1) && (v2!=-1) && (v3!=-1) ) add_triangle ( v1, v2, v3 );
            }
        };

        // compute normals / whites (from per face to per vertex)

        for ( int z = 0; z < 4; z++ )
        for ( int y = 0; y < 4; y++ )
        for ( int x = 0; x < 4; x++ ) {
            n[x][y][z] = Vector3f ( 0, 0, 0 ); // todo: memfill or something - ?
            w[x][y][z] = false;
        }

        for ( int z = 0; z < 4; z++ )
        for ( int y = 0; y < 4; y++ ) {
            n[0][y][z] += nn[0];
            n[3][y][z] += nn[1];
            n[y][0][z] += nn[2];
            n[y][3][z] += nn[3];
            n[y][z][0] += nn[4];
            n[y][z][3] += nn[5];
            w[0][y][z] |= ww[0];
            w[3][y][z] |= ww[1];
            w[y][0][z] |= ww[2];
            w[y][3][z] |= ww[3];
            w[y][z][0] |= ww[4];
            w[y][z][3] |= ww[5];
        }

        for ( int i = 0; i < 4; ++i )
        for ( int j = 0; j < 4; ++j )
        for ( int k = 0; k < 4; ++k )
            n[i][j][k].normalize();

        for ( int z = 0; z < 4; z++ )
        for ( int y = 0; y < 4; y++ )
        for ( int x = 0; x < 4; x++ ) {
            int ii = ( x / 2 ) + ( y / 2 ) * 2 + ( z / 2 ) * 4;
            p[x][y][z] = pp[ii];
            iv[x][y][z] = -1;
        }

        float smooth = this->max_rounding_radius * this->rounding_radius; // smooth = 0.5 --> perfect sphere

        for ( int z = 0; z < 4; z += 3 )
        for ( int y = 0; y < 4; y += 3 )
        for ( int x = 0; x < 4; x += 3 ) {
            for ( int D = 0; D < 3; D++ ) {
                int dA[3] = { 0, 0, 0 };
                int dB[3] = { 0, 0, 0 };
                int dC[3] = { 0, 0, 0 };
                int s[3];
                dA[D] = 1;
                dB[ (D+1)%3 ] = 1;
                dC[ (D+2)%3 ] = 1;
                s[0] = (x>1) ? -1 : +1;
                s[1] = (y>1) ? -1 : +1;
                s[2] = (z>1) ? -1 : +1;
                int ii = (x/2) + (y/2) * 2 + (z/2) * 4;

                if ( vv[ii] ) {
                    int jj = ( ii ^ ( 1 << D ) );
                    Vector3f edge0 = ( pp[jj] - pp[ii] ) * smooth;
                    Vector3f edge1 = ( pp[jj] - pp[ii] ) * ( smooth * ( 1 - ( sqrt ( 2 ) / 2 ) ) );
                    Vector3f edge2 = ( pp[jj] - pp[ii] ) * ( smooth * ( 1 - ( sqrt ( 3 ) / 3 ) ) );

                    p[x + s[0]*(     dA[0]   )] [y + s[1]*(     dA[1]     )] [z + s[2]*(      dA[2]    )] += edge0;
                    p[x + s[0]*( dB[0]+dA[0] )] [y + s[1]*( dB[1] + dA[1] )] [z + s[2]*( dB[2] + dA[2] )] += edge0;
                    p[x + s[0]*( dC[0]+dA[0] )] [y + s[1]*( dC[1] + dA[1] )] [z + s[2]*( dC[2] + dA[2] )] += edge0;

                    p[x + s[0]*(     dB[0]   )] [y + s[1]*(     dB[1]     )] [z + s[2]*(      dB[2]    )] += edge1;
                    p[x + s[0]*(     dC[0]   )] [y + s[1]*(     dC[1]     )] [z + s[2]*(      dC[2]    )] += edge1;

                    p[x][y][z] += edge2;
                }
            }
        }

        for ( int z = 0; z < 4; z++ )
        for ( int y = 0; y < 4; y++ )
        for ( int x = 0; x < 4; x++ ) {
            int i = (x/2) + (y/2) * 2 + (z/2) * 4;
            bool mx = ( ( x > 0 ) && ( x < 3 ) ); // mid
            bool my = ( ( y > 0 ) && ( y < 3 ) );
            bool mz = ( ( z > 0 ) && ( z < 3 ) );

            int category = 0;
            if ( mx ) category++;
            if ( my ) category++;
            if ( mz ) category++;

            int j = i;
            if ( category == 1 ) {
                if ( mx ) j ^= 1;
                if ( my ) j ^= 2;
                if ( mz ) j ^= 4;
            }

            if ( category == 0 && !vv[i] ) continue;    // corner: show only if corner visible
            if ( category == 1 && !vv[i] && !vv[j] ) continue;    // mid edge: show only if both corners visible
            if ( category == 2 && !vv[i] )  continue;    // mid face: show only if corner visible
            if ( category == 3 ) continue;    // midpoint: never show

            Vector3f c;

            if ( is_quality_color_mapping_enabled() ) {
                c = color_map.get ( mesh->normalized_hexa_quality[cell_idx] );
            } else {
                c = w[x][y][z] ? this->default_outside_color : this->default_inside_color;
            }

            iv[x][y][z] = add_vertex ( p[x][y][z], n[x][y][z], c );
            //std::cout<<"Range = "<<len(p[x][y][z]-vec3(1,1,1))<<"\n"; // test: smooth = 0.5 --> perfect sphere
        }

        for ( int x = 0; x < 3; x++ )
        for ( int y = 0; y < 3; y++ ) {

                int category = 0;
                if ( x == 1 ) category++;
                if ( y == 1 ) category++;

                addSide ( iv[x][y][0], iv[ x ][y+1][ 0 ], iv[x+1][y+1][ 0 ], iv[x+1][ y ][ 0 ], category == 1 );
                addSide ( iv[x][y][3], iv[x+1][ y ][ 3 ], iv[x+1][y+1][ 3 ], iv[ x ][y+1][ 3 ], category == 1 );
                addSide ( iv[x][0][y], iv[x+1][ 0 ][ y ], iv[x+1][ 0 ][y+1], iv[ x ][ 0 ][y+1], category == 1 );
                addSide ( iv[x][3][y], iv[ x ][ 3 ][y+1], iv[x+1][ 3 ][y+1], iv[x+1][ 3 ][ y ], category == 1 );
                addSide ( iv[0][x][y], iv[ 0 ][ x ][y+1], iv[ 0 ][x+1][y+1], iv[ 0 ][x+1][ y ], category == 1 );
                addSide ( iv[3][x][y], iv[ 3 ][x+1][ y ], iv[ 3 ][x+1][y+1], iv[ 3 ][ x ][y+1], category == 1 );
        }
    }

    void App::prepare_external_skin(){
        // add boundary (white) faces unless they are visible
        for ( const Face& f:mesh->faces ) {
            if (f.is_boundary() && mesh->is_marked(f.ci[0]))
                this->add_filtered_face(f);
        }
    }

    void App::prepare_cracked_geometry() {

        this->mesh->update_vertex_visibility();

        for ( Index ci = 0; ci < mesh->cells.size(); ++ci ) {

            const Cell& c = mesh->cells[ci];

            if ( mesh->is_marked ( c ) ) continue;

            Vector3f    verts_pos[8];
            bool        verts_vis[8];
            Vector3f    faces_colors[6];
            Vector3f    faces_norms[6];

            for (int w=0; w<8; w++) verts_pos[w] = mesh->pos( c.vi[w] );
            for (int w=0; w<8; w++) verts_vis[w] = mesh->is_visible( c.vi[w] );

            for (int w=0; w<6; w++) faces_norms[w] = mesh->norm_of_side( ci, w);

            // color
            if ( is_quality_color_mapping_enabled() ) {
                for (int w=0; w<6; w++) faces_colors[w] = color_map.get( mesh->normalized_hexa_quality[ci] );
            } else {
                for (int w=0; w<6; w++) faces_colors[w] =
                        mesh->faces[c.fi[w]].is_boundary() ?
                        this->default_outside_color :
                        this->default_inside_color;
            }

            build_gap_hexa ( verts_pos, faces_norms, verts_vis, faces_colors );
        }
    }

    void App::prepare_smooth_geometry() {
        this->mesh->update_vertex_visibility();

        for ( Index ci = 0; ci < mesh->cells.size(); ++ci ) {

            const Cell& c =  mesh->cells[ci];

            if ( mesh->is_marked ( c ) ) continue;

            Vector3f    verts_pos[8];
            bool        verts_vis[8];
            bool        faces_skin[6]; // true: external, false: internal
            Vector3f    faces_norm[6];

            for (int w=0; w<8; w++) verts_pos[w] = mesh->pos( c.vi[w] );
            for (int w=0; w<8; w++) verts_vis[w] = mesh->is_visible( c.vi[w] );
            for (int w=0; w<6; w++) faces_skin[w] = mesh->faces[c.fi[w]].is_boundary();
            for (int w=0; w<6; w++) faces_norm[w] = mesh->norm_of_side( ci, w);

            build_smooth_hexa ( verts_pos, faces_norm, verts_vis, faces_skin, ci );
        }
    }

    void App::build_surface_models() {

        filtered_model.clear();
        visible_model.clear();

        if ( mesh == nullptr ) return;

        mesh->unmark_all();

        HL_ASSERT(filters.size()==4);
        filters[0]->filter( *mesh ); // slice
        filters[1]->filter( *mesh ); // peel
        erode_dilate( regularize_str );
        filters[2]->filter( *mesh ); // quality
        filters[3]->filter( *mesh ); // pick

        prepare_external_skin();

        switch ( this->geometry_mode ) {
            case GeometryMode::Default:  prepare_geometry(); break;
            case GeometryMode::Cracked:  prepare_cracked_geometry(); break;
            case GeometryMode::Smooth:   this->prepare_smooth_geometry(); break;
        }
    }

    void App::build_full_model() {
        if ( mesh == nullptr ) {
            return;
        }

        this->full_model.clear();

        for ( const Face & f : mesh->faces ) {
            if ( f.is_boundary() ) {
                this->add_full_face ( f );
            }
        }
    }

    void App::erode_dilate( int str ) {
        for ( int i=0; i<str; i++ ) erode();
        for ( int i=0; i<str; i++ ) dilate();
    }

    void App::erode() {
        mesh->update_vertex_visibility_internals();
        for (Cell& c:mesh->cells) {
            for (short i=0; i<8; i++) {
                if (mesh->is_visible(c.vi[i])) mesh->mark( c );
            }
        }
    }

    void App::dilate() {
        mesh->update_vertex_visibility_internals();
        for (Cell& c:mesh->cells) {
            for (short i=0; i<8; i++) {
                if (mesh->is_visible(c.vi[i])) mesh->unmark( c );
            }
        }
    }
}
