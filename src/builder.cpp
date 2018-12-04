#include <hex_quality.h>

#include <builder.h>

#include <hex_quality.h>
//#include <emscripten.h>

//#define HL_SET_PROGRESS_PHASE(X) \
//    emscripten_run_script("HexaLab.UI.set_progress_phasename( '" X "' )");
//#define HL_SET_PROGRESS_PHASE(X) \
//    EM_ASM( HexaLab.UI.set_progress_phasename( X ) )
#define HL_SET_PROGRESS_PHASE(X)

namespace HexaLab {

std::unordered_map<Builder::EdgeMapKey, Index> Builder::edges_map;
std::unordered_map<Builder::FaceMapKey, Index> Builder::faces_map;

constexpr Index Builder::hexa_face[6][4];


/*
        The second edge must come after the first, like so:

         - e1 ->
        ---------
                | |
                | e2
                | v
    */
void Builder::link_edges ( Mesh& mesh, Index e1, Index e2 ) {
    MeshNavigator n1 = mesh.navigate ( mesh.darts[e1] );
    MeshNavigator n2 = mesh.navigate ( mesh.darts[e2] );
    n1.flip_vert().dart().edge_neighbor = n2.dart_index();
    n2.dart().edge_neighbor = n1.flip_vert().dart_index();
}

void Builder::link_hexas ( Mesh& mesh, Index d1, Index d2 ) {
    MeshNavigator n1 = mesh.navigate ( mesh.darts[d1] );
    MeshNavigator n2 = mesh.navigate ( mesh.darts[d2] );
    size_t found = 0;

    for ( size_t i = 0; i < 4; ++i ) {
        for ( size_t j = 0; j < 4; ++j ) {
            if ( n2.vert() == n1.vert() && n2.edge() == n1.edge() ) {
                n2.dart().hexa_neighbor = n1.dart_index();
                n1.dart().hexa_neighbor = n2.dart_index();
                n2.flip_vert().dart().hexa_neighbor = n1.flip_vert().dart_index();
                n1.flip_vert().dart().hexa_neighbor = n2.flip_vert().dart_index();
                ++found;
            }

            n2 = n2.flip_vert();

            if ( n2.vert() == n1.vert() && n2.edge() == n1.edge() ) {
                n2.dart().hexa_neighbor = n1.dart_index();
                n1.dart().hexa_neighbor = n2.dart_index();
                n2.flip_vert().dart().hexa_neighbor = n1.flip_vert().dart_index();
                n1.flip_vert().dart().hexa_neighbor = n2.flip_vert().dart_index();
                ++found;
            }

            n2 = n2.flip_edge();
        }

        n1 = n1.rotate_on_face();
    }

    assert ( found > 0 );
}

void Builder::link_faces ( Mesh& mesh, Index d1, Index d2 ) {
    MeshNavigator n1 = mesh.navigate ( mesh.darts[d1] );
    MeshNavigator n2 = mesh.navigate ( mesh.darts[d2] );
    size_t found = 0;

    for ( size_t i = 0; i < 4; ++i ) {
        for ( size_t j = 0; j < 4; ++j ) {
            if ( n2.vert() == n1.vert() && n2.edge() == n1.edge() ) {
                n2.dart().face_neighbor = n1.dart_index();
                n1.dart().face_neighbor = n2.dart_index();
                n2.flip_vert().dart().face_neighbor = n1.flip_vert().dart_index();
                n1.flip_vert().dart().face_neighbor = n2.flip_vert().dart_index();
                ++found;
                ++found;
            }

            n2 = n2.flip_vert();

            if ( n2.vert() == n1.vert() && n2.edge() == n1.edge() ) {
                n2.dart().face_neighbor = n1.dart_index();
                n1.dart().face_neighbor = n2.dart_index();
                n2.flip_vert().dart().face_neighbor = n1.flip_vert().dart_index();
                n1.flip_vert().dart().face_neighbor = n2.flip_vert().dart_index();
                ++found;
                ++found;
            }

            n2 = n2.flip_edge();
        }

        n1 = n1.rotate_on_face();
    }

    assert ( found > 0 );
}

Index Builder::add_edge ( Mesh& mesh, Index h, Index f, const Index* edge ) {
    // Lookup/add the edge
    Index e;
    auto search_result = edges_map.find ( EdgeMapKey ( edge ) );

    if ( search_result != edges_map.end() ) {
        e = search_result->second;
    } else {
        e = mesh.edges.size();
        mesh.edges.emplace_back ( mesh.darts.size() );
        edges_map.insert ( std::make_pair ( EdgeMapKey ( edge ), e ) );
    }

    // Add a dart to each vertex
    assert ( mesh.verts.size() > edge[0] );
    Index d = mesh.darts.size();

    if ( mesh.verts[edge[0]].dart == -1 ) {
        mesh.verts[edge[0]].dart = mesh.darts.size();
    }

    mesh.darts.emplace_back ( h, f, e, edge[0] );
    assert ( mesh.verts.size() > edge[1] );

    if ( mesh.verts[edge[1]].dart == -1 ) {
        mesh.verts[edge[1]].dart = mesh.darts.size();
    }

    mesh.darts.emplace_back ( h, f, e, edge[1] );
    // Link vertices along the edge
    mesh.darts[mesh.darts.size() - 1].vert_neighbor = mesh.darts.size() - 2;
    mesh.darts[mesh.darts.size() - 2].vert_neighbor = mesh.darts.size() - 1;
    return d;
}

// h:    index of the hexa the face is part of.
// face: array of 4 vertex indices representing the face.
Index Builder::add_face ( Mesh& mesh, Index h, const Index* face ) {
    // Lookup/add the face
    Index f;
    auto search_result = faces_map.find ( FaceMapKey ( face ) );

    if ( search_result != faces_map.end() ) {
        f = search_result->second;
    } else {
        f = mesh.faces.size();
        faces_map.insert ( std::make_pair ( FaceMapKey ( face ), f ) );
        mesh.faces.emplace_back ( mesh.darts.size() );
    }

    // Add face edges
    Index edge_indices[2];
    edge_indices[0] = face[0];
    edge_indices[1] = face[1];
    Index e1 = add_edge ( mesh, h, f, edge_indices );
    edge_indices[0] = face[1];
    edge_indices[1] = face[2];
    Index e2 = add_edge ( mesh, h, f, edge_indices );
    edge_indices[0] = face[2];
    edge_indices[1] = face[3];
    Index e3 = add_edge ( mesh, h, f, edge_indices );
    edge_indices[0] = face[3];
    edge_indices[1] = face[0];
    Index e4 = add_edge ( mesh, h, f, edge_indices );
    // Link face edges between them
    link_edges ( mesh, e1, e2 );
    link_edges ( mesh, e2, e3 );
    link_edges ( mesh, e3, e4 );
    link_edges ( mesh, e4, e1 );

    // Compute face normal, if it is the first match
    if ( search_result == faces_map.end() ) {
        Vector3f normal ( 0, 0, 0 );
        Vector3f a, b;
        a = mesh.verts[face[3]].position - mesh.verts[face[0]].position;
        b = mesh.verts[face[1]].position - mesh.verts[face[0]].position;
        normal += a.cross ( b ).normalized();
        a = mesh.verts[face[0]].position - mesh.verts[face[1]].position;
        b = mesh.verts[face[2]].position - mesh.verts[face[1]].position;
        normal += a.cross ( b ).normalized();
        a = mesh.verts[face[1]].position - mesh.verts[face[2]].position;
        b = mesh.verts[face[3]].position - mesh.verts[face[2]].position;
        normal += a.cross ( b ).normalized();
        a = mesh.verts[face[2]].position - mesh.verts[face[3]].position;
        b = mesh.verts[face[0]].position - mesh.verts[face[3]].position;
        normal += a.cross ( b ).normalized();
        ( normal /= 4 ).normalize();
        mesh.faces.back().normal = normal;
    }

    // Link hexa faces if the face is shared with another hexa
    if ( search_result != faces_map.end() ) {
        link_hexas ( mesh, mesh.faces[f].dart, e1 );
    }

    return e1;
}

// hexa: array of 8 vertex indices representing the hexa.
Index Builder::add_hexa ( Mesh& mesh, const Index* hexa ) {
    const Index h = mesh.hexas.size();
    mesh.hexas.emplace_back ( mesh.darts.size() );
    Index base = mesh.darts.size();
    Index faces[6];

    for ( int i = 0; i < 6; ++i ) {
        Index face_indices[4];

        for ( int j = 0; j < 4; ++j ) {
            face_indices[j] = hexa[Builder::hexa_face[i][j]];
        }

        faces[i] = add_face ( mesh, h, face_indices );
    }

    link_faces ( mesh, faces[Front], faces[Top] );
    link_faces ( mesh, faces[Front], faces[Bottom] );
    link_faces ( mesh, faces[Front], faces[Left] );
    link_faces ( mesh, faces[Front], faces[Right] );
    link_faces ( mesh, faces[Back], faces[Top] );
    link_faces ( mesh, faces[Back], faces[Bottom] );
    link_faces ( mesh, faces[Back], faces[Left] );
    link_faces ( mesh, faces[Back], faces[Right] );
    link_faces ( mesh, faces[Top], faces[Left] );
    link_faces ( mesh, faces[Top], faces[Right] );
    link_faces ( mesh, faces[Bottom], faces[Left] );
    link_faces ( mesh, faces[Bottom], faces[Right] );
    //for ( size_t i = 0; i < 6; ++i ) {
    //    for ( size_t j = 0; j < 6; ++j ) {
    //        if ( i != j ) {
    //            link_faces ( mesh, faces[i], faces[j] );
    //        }
    //    }
    //}
    return h;
}

void Builder::add_vertices( Mesh& mesh, const vector<Vector3f>& verts ){
    mesh.aabb = AlignedBox3f();

    for ( const Vector3f &v: verts ) {
        mesh.verts.emplace_back ( v );
        mesh.aabb.extend ( v );
    }
}

// mesh:     empty mesh to be filled
// vertices: mesh vertices
// indices:  8*n vertex indices
void Builder::build ( Mesh& mesh, const vector<Vector3f>& vertices, const vector<Index>& indices ) {
    assert ( indices.size() % 8 == 0 );

    add_vertices( mesh, vertices );

    HL_SET_PROGRESS_PHASE("Building structures");
    HL_LOG ( "[Builder] Building %lu darts...\n", indices.size() / 8 * 48 );

    auto t0 = sample_time();

    edges_map.clear();
    faces_map.clear();

    HL_LOG ( "[Builder] adding hexa " );
    add_hexas(mesh, indices ,  0, 25);
    add_hexas(mesh, indices , 25, 50);
    add_hexas(mesh, indices , 50, 75);
    add_hexas(mesh, indices , 75, 100);

    mesh.hexa_quality.resize ( mesh.hexas.size() );
    HL_LOG ( "100%%\n" );

    auto dt = milli_from_sample ( t0 );

    HL_LOG ( "[Builder] Mesh building took %dms.\n", dt );

    update_surface_status( mesh );

}

void Builder::add_hexas( Mesh& mesh, const vector<Index>& indices, int from , int to ){
    size_t c = indices.size() / 8;
    size_t first_in = c*from / 100;
    size_t first_out = c*to  / 100;

    for ( size_t h = first_in; h < first_out; h++ ) {
        add_hexa ( mesh, &indices[h * 8] );
    }
    HL_LOG ( "%d%%\n", to );
}

void Builder::update_surface_status( Mesh& mesh ) {
    for ( size_t i = 0; i < mesh.edges.size(); ++i ) {
        MeshNavigator nav = mesh.navigate ( mesh.edges[i] );
        Face& begin = nav.face();

        do {
            if ( nav.dart().hexa_neighbor == -1 ) {
                nav.edge().is_surface = true;
                nav.vert().is_surface = true;
                nav.flip_vert().vert().is_surface = true;
            }
            nav = nav.rotate_on_edge();
        } while ( nav.face() != begin );
    }
}




bool Builder::validate ( Mesh& mesh ) {
    HL_SET_PROGRESS_PHASE("Validating");
    auto t0 = sample_time();
    int surface_darts = 0;

    for ( size_t i = 0; i < mesh.darts.size(); ++i ) {
        Dart& dart = mesh.darts[i];
        HL_ASSERT ( dart.hexa != -1 && dart.hexa < mesh.hexas.size() );
        HL_ASSERT ( dart.face != -1 && dart.face < mesh.faces.size() );
        HL_ASSERT ( dart.edge != -1 && dart.edge < mesh.edges.size() );
        HL_ASSERT ( dart.vert != -1 && dart.vert < mesh.verts.size() );
        HL_ASSERT ( dart.face_neighbor != -1 && dart.face_neighbor < mesh.darts.size() );
        HL_ASSERT ( dart.edge_neighbor != -1 && dart.edge_neighbor < mesh.darts.size() );
        HL_ASSERT ( dart.vert_neighbor != -1 && dart.vert_neighbor < mesh.darts.size() );

        if ( dart.hexa_neighbor != -1 ) {
            HL_ASSERT ( dart.hexa_neighbor < mesh.darts.size() );
        } else {
            ++surface_darts;
        }
    }

    for ( size_t i = 0; i < mesh.verts.size(); ++i ) {
        Vert& v = mesh.verts[i];

        if ( v.dart != -1 ) { // perform test only for referenced vertices.
            HL_ASSERT ( v.dart != -1 );
            auto nav = mesh.navigate ( v );
            HL_ASSERT ( nav.vert() == v );
            Dart& d1 = nav.dart();
            nav = nav.flip_vert();
            HL_ASSERT ( nav.dart().hexa == d1.hexa
                        && nav.dart().face == d1.face
                        && nav.dart().edge == d1.edge );
            nav = nav.flip_vert();
            HL_ASSERT ( nav.vert() == v );
        }
    }

    for ( size_t i = 0; i < mesh.edges.size(); ++i ) {
        Edge& e = mesh.edges[i];
        HL_ASSERT ( e.dart != -1 );
        auto nav = mesh.navigate ( e );
        HL_ASSERT ( nav.edge() == e );
        Dart& d1 = nav.dart();
        nav = nav.flip_edge();
        HL_ASSERT ( nav.dart().hexa == d1.hexa
                    && nav.dart().face == d1.face
                    && nav.dart().vert == d1.vert );
        nav = nav.flip_edge();
        HL_ASSERT ( nav.edge() == e );
    }

    for ( size_t i = 1; i < mesh.faces.size(); ++i ) {
        Face& f = mesh.faces[i];
        HL_ASSERT ( f.dart != -1 );
        auto nav = mesh.navigate ( f );
        HL_ASSERT ( nav.face() == f );
        Dart& d1 = nav.dart();
        nav = nav.flip_face();
        HL_ASSERT ( nav.dart().hexa == d1.hexa
                    && nav.dart().edge == d1.edge
                    && nav.dart().vert == d1.vert );
        nav = nav.flip_face();
        HL_ASSERT ( nav.face() == f );
    }

    for ( size_t i = 0; i < mesh.hexas.size(); ++i ) {
        Hexa& h = mesh.hexas[i];
        HL_ASSERT ( h.dart != -1 );
        auto nav = mesh.navigate ( h );
        HL_ASSERT ( nav.hexa() == h );

        if ( nav.dart().hexa_neighbor != -1 ) {
            Dart& d1 = nav.dart();
            nav = nav.flip_hexa();
            HL_ASSERT ( nav.dart().face == d1.face
                        && nav.dart().edge == d1.edge
                        && nav.dart().vert == d1.vert );
            nav = nav.flip_hexa();
            HL_ASSERT ( nav.hexa() == h );
        }
    }

    for ( size_t i = 0; i < mesh.hexas.size(); ++i ) {
        Hexa& h = mesh.hexas[i];
        Vector3f v[8];
        int j = 0;
        auto nav = mesh.navigate ( h );
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

        float q = QualityMeasureFun::volume ( v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], nullptr );
        //            HL_ASSERT ( q > 0 );
    }

    auto dt = milli_from_sample ( t0 );
    HL_LOG ( "[Validator] Surface darts: %d/%lu\n", surface_darts, mesh.darts.size() );
    HL_LOG ( "[Validator] Validation took %dms.\n", dt );
    return true;
}
}
