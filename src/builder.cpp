#include <builder.h>

#include <memory>

namespace HexaLab {

    std::unordered_map<Builder::EdgeMapKey, Index> Builder::edges_map;
    std::unordered_map<Builder::FaceMapKey, Index> Builder::faces_map;

    constexpr Index Builder::hexa_face[6][4];

    static float scaled_jacobian(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
        const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7) {
        // edges
        Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
        Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
        Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
        Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

        // cross-derivatives
        Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
        Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
        Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

        L0.normalize();     L4.normalize();     L8.normalize();
        L1.normalize();     L5.normalize();     L9.normalize();
        L2.normalize();     L6.normalize();     L10.normalize();
        L3.normalize();     L7.normalize();     L11.normalize();
        X1.normalize();     X2.normalize();     X3.normalize();

        // normalized jacobian matrices determinants
        float alpha[9] =
        {
            L0.dot(L3.cross(L4)),
            L1.dot(-L0.cross(L5)),
            L2.dot(-L1.cross(L6)),
            -L3.dot(-L2.cross(L7)),
            L11.dot(L8.cross(-L4)),
            -L8.dot(L9.cross(-L5)),
            -L9.dot(L10.cross(-L6)),
            -L10.dot(-L11.cross(-L7)),
            X1.dot(X2.cross(X3))
        };

        float msj = *std::min_element(alpha, alpha + 9);

        if (msj > 1.1) msj = -1.0;

        return msj;
    }

    void Builder::add_edge(Mesh& mesh, Index h, Index f, const Index* edge) {
        // Lookup/add the edge
        Index e;
        auto search_result = edges_map.find(EdgeMapKey(edge));
        if (search_result != edges_map.end()) {
            e = search_result->second;
        } else {
            e = mesh.edges.size();
            mesh.edges.emplace_back(mesh.darts.size());
            edges_map.insert(std::make_pair(EdgeMapKey(edge), e));
        }

        // Add a dart to each vertex
        assert(mesh.verts.size() > edge[0]);
        if (mesh.verts[edge[0]].dart == -1) mesh.verts[edge[0]].dart = mesh.darts.size();
        mesh.darts.emplace_back(h, f, e, edge[0]);

        assert(mesh.verts.size() > edge[1]);
        if(mesh.verts[edge[1]].dart == -1) mesh.verts[edge[1]].dart = mesh.darts.size();
        mesh.darts.emplace_back(h, f, e, edge[1]);

        // Link vertices along the edge
        mesh.darts[mesh.darts.size() - 1].vert_neighbor = mesh.darts.size() - 2;
        mesh.darts[mesh.darts.size() - 2].vert_neighbor = mesh.darts.size() - 1;
    }

    // h: index of the hexa to whom the face is part of.
    // face: array of 4 indices representing the face.
    void Builder::add_face(Mesh& mesh, Index h, const Index* face) {
        // Lookup/add the face
        Index f;
        auto search_result = faces_map.find(FaceMapKey(face));
        if (search_result != faces_map.end()) {
            f = search_result->second;
        } else {
            f = mesh.faces.size();
            faces_map.insert(std::make_pair(FaceMapKey(face), f));
            mesh.faces.emplace_back(mesh.darts.size());
        }

        Index f0_base = mesh.darts.size();

        // Add face edges
        for (int i = 0; i < 4; ++i) {
            Index edge_indices[2] = {face[i], face[(i + 1) % 4]};
            add_edge(mesh, h, f, edge_indices);
        }

        // Compute face normal, if its the first match
        if (search_result == faces_map.end()) {
            Vector3f normal(0, 0, 0);
            Vector3f a, b;
            a = mesh.verts[face[1]].position - mesh.verts[face[0]].position;
            b = mesh.verts[face[3]].position - mesh.verts[face[0]].position;
            normal += a.cross(b).normalized();
            a = mesh.verts[face[2]].position - mesh.verts[face[1]].position;
            b = mesh.verts[face[0]].position - mesh.verts[face[1]].position;
            normal += a.cross(b).normalized();
            a = mesh.verts[face[3]].position - mesh.verts[face[2]].position;
            b = mesh.verts[face[1]].position - mesh.verts[face[2]].position;
            normal += a.cross(b).normalized();
            a = mesh.verts[face[0]].position - mesh.verts[face[3]].position;
            b = mesh.verts[face[2]].position - mesh.verts[face[3]].position;
            normal += a.cross(b).normalized();
            (normal /= 4).normalize();
            mesh.faces.back().normal = normal;
        }

        // Link faces with the adjacent hexa, if there's one
        if (search_result != faces_map.end()) {
            Index f1_base = mesh.faces[f].dart;
            
            for (int i = 0; i < 8; ++i) {
                bool k = false;
                Index vert = mesh.darts[f0_base + i].vert;
                Index edge = mesh.darts[f0_base + i].edge;
                for (int j = 0; j < 8; ++j) {
                    if (mesh.darts[f1_base + j].vert == vert
                        && mesh.darts[f1_base + j].edge == edge) {
                        mesh.darts[f0_base + i].hexa_neighbor = f1_base + j;
                        mesh.darts[f1_base + j].hexa_neighbor = f0_base + i;
                        k = true;
                        break;
                    }
                }
                assert(k);
            }
        }

        // Link edges along the face
        for (int i = 1; i < 8; i += 2) {
            mesh.darts[f0_base + i].edge_neighbor = f0_base + (i + 1) % 8;
            mesh.darts[f0_base + (i + 1) % 8].edge_neighbor = f0_base + i;
        }
    }

    // hexa: array of 8 indices representing the hexa.
    void Builder::add_hexa(Mesh& mesh, const Index* hexa) {
        const Index h = mesh.hexas.size();
        mesh.hexas.emplace_back(mesh.darts.size());

        Index base = mesh.darts.size();

        for (int i = 0; i < 6; ++i) {
            Index face_indices[4];
            for (int j = 0; j < 4; ++j) {
                face_indices[j] = hexa[Builder::hexa_face[i][j]];
            }
            add_face(mesh, h, face_indices);
        }

        // Link side faces
        const int face_size = 8;        // darts in a face
        const int edge_offset = 4;      // dart offset between two side edges (e.g. two left darts, two top darts, two right darts => offset == 4)
        for (int i = 2; i < face_size * 4; i += face_size) {
            mesh.darts[base + i].face_neighbor = base + (i + face_size + edge_offset + 1) % (face_size * 4);
            mesh.darts[base + i + 1].face_neighbor = base + (i + face_size + edge_offset) % (face_size * 4);
        
            mesh.darts[base + (i + face_size + edge_offset + 1) % (face_size * 4)].face_neighbor = base + i;
            mesh.darts[base + (i + face_size + edge_offset) % (face_size * 4)].face_neighbor = base + i + 1;
        }
        // Link bottom face to side faces
        int link_offset = 38;
        int step = 10;
        for (int i = 0; i < face_size * 4; i += face_size) {
            mesh.darts[base + i].face_neighbor = base + i + link_offset + 1;
            mesh.darts[base + i + 1].face_neighbor = base + i + link_offset;

            mesh.darts[base + i + link_offset].face_neighbor = base + i + 1;
            mesh.darts[base + i + link_offset + 1].face_neighbor = base + i;
            
            link_offset -= step;
        }
        // Link top face to side faces
        link_offset = 38;
        step = 6;
        int i = 4;
        for (; i < face_size * 3; i += face_size) {
            mesh.darts[base + i].face_neighbor = base + i + link_offset + 1;
            mesh.darts[base + i + 1].face_neighbor = base + i + link_offset;

            mesh.darts[base + i + link_offset].face_neighbor = base + i + 1;
            mesh.darts[base + i + link_offset + 1].face_neighbor = base + i;

            link_offset -= step;
        }
        // Last face is "irregular", requires an extra step
        {
            link_offset -= 8;
            mesh.darts[base + i].face_neighbor = base + i + link_offset + 1;
            mesh.darts[base + i + 1].face_neighbor = base + i + link_offset;

            mesh.darts[base + i + link_offset].face_neighbor = base + i + 1;
            mesh.darts[base + i + link_offset + 1].face_neighbor = base + i;
        }
    }

    void Builder::build(Mesh& mesh, const vector<Vector3f>& vertices, const vector<Index>& indices) {
        assert(indices.size() % 8 == 0);

        HL_LOG("Building %d darts...", indices.size() / 8 * 48);

        auto t0 = sample_time();

        edges_map.clear();
        faces_map.clear();

        mesh.aabb = AlignedBox3f();
        for (size_t v = 0; v < vertices.size(); ++v) {
            mesh.verts.emplace_back(vertices[v]);
            mesh.aabb.extend(vertices[v]);
        }

        size_t hexa_count = indices.size() / 8;
        for (size_t h = 0; h < hexa_count; ++h) {
            add_hexa(mesh, &indices[h * 8]);
        }

        for (size_t i = 0; i < hexa_count; ++i) {
            // compute quality
            mesh.hexas[i].scaled_jacobian =  scaled_jacobian(
                vertices[indices[i * 8 + 0]],
                vertices[indices[i * 8 + 1]],
                vertices[indices[i * 8 + 2]],
                vertices[indices[i * 8 + 3]],
                vertices[indices[i * 8 + 4]],
                vertices[indices[i * 8 + 5]],
                vertices[indices[i * 8 + 6]],
                vertices[indices[i * 8 + 7]]
            );
            // count neighbors
            MeshNavigator nav = mesh.navigate(mesh.hexas[i]);
            for (int j = 0; j < 6; ++j) {
                if (nav.dart().hexa_neighbor != -1) {
                    ++nav.hexa().hexa_count;
                }
                nav = nav.next_hexa_face();
            }
        }

        float max = std::numeric_limits<float>::lowest(), min = std::numeric_limits<float>::max(), avg = 0;
        for (size_t i = 0; i < mesh.edges.size(); ++i) {
            MeshNavigator nav = mesh.navigate(mesh.edges[i]);
            Vector3f edge = nav.vert().position - nav.flip_vert().vert().position;
            float len = edge.norm();
            if (len < min) min = len;
            if (len > max) max = len;
            avg += len;
        }
        avg /= mesh.edges.size();
        mesh.min_edge_len = min;
        mesh.max_edge_len = max;
        mesh.avg_edge_len = avg;

        for (size_t i = 0; i < mesh.edges.size(); ++i) {
            MeshNavigator nav = mesh.navigate(mesh.edges[i]);
            Face& begin = nav.face();
            do {
                if (nav.dart().hexa_neighbor == -1) {
                    nav.edge().surface = true;
                }
                nav = nav.rotate_on_edge();
                ++mesh.edges[i].face_count;
            } while (nav.face() != begin);
        }

        auto dt = milli_from_sample(t0);

        HL_LOG("[Builder] Mesh building took %dms.\n", dt);
    }

    bool Builder::validate(Mesh& mesh) {
        auto t0 = sample_time();

        int surface_darts = 0;
        for (size_t i = 0; i < mesh.darts.size(); ++i) {
            Dart& dart = mesh.darts[i];

            HL_ASSERT(dart.hexa != -1 && dart.hexa < mesh.hexas.size());
            HL_ASSERT(dart.face != -1 && dart.face < mesh.faces.size());
            HL_ASSERT(dart.edge != -1 && dart.edge < mesh.edges.size());
            HL_ASSERT(dart.vert != -1 && dart.vert < mesh.verts.size());
            HL_ASSERT(dart.face_neighbor != -1 && dart.face_neighbor < mesh.darts.size());
            HL_ASSERT(dart.edge_neighbor != -1 && dart.edge_neighbor < mesh.darts.size());
            HL_ASSERT(dart.vert_neighbor != -1 && dart.vert_neighbor < mesh.darts.size());
            if (dart.hexa_neighbor != -1) {
                HL_ASSERT(dart.hexa_neighbor < mesh.darts.size());
            } else {
                ++surface_darts;
            }
        }

        for (size_t i = 0; i < mesh.verts.size(); ++i) {
            Vert& v = mesh.verts[i];
            HL_ASSERT(v.dart != -1);
            auto nav = mesh.navigate(v);
            HL_ASSERT(nav.vert() == v);
            Dart& d1 = nav.dart();
            nav = nav.flip_vert();
            HL_ASSERT(nav.dart().hexa == d1.hexa
                && nav.dart().face == d1.face
                && nav.dart().edge == d1.edge);
            nav = nav.flip_vert();
            HL_ASSERT(nav.vert() == v);
        }

        for (size_t i = 0; i < mesh.edges.size(); ++i) {
            Edge& e = mesh.edges[i];
            HL_ASSERT(e.dart != -1);
            auto nav = mesh.navigate(e);
            HL_ASSERT(nav.edge() == e);
            Dart& d1 = nav.dart();
            nav = nav.flip_edge();
            HL_ASSERT(nav.dart().hexa == d1.hexa
                && nav.dart().face == d1.face
                && nav.dart().vert == d1.vert);
            nav = nav.flip_edge();
            HL_ASSERT(nav.edge() == e);
        }

        for (size_t i = 1; i < mesh.faces.size(); ++i) {
            Face& f = mesh.faces[i];
            HL_ASSERT(f.dart != -1);
            auto nav = mesh.navigate(f);
            HL_ASSERT(nav.face() == f);
            Dart& d1 = nav.dart();
            nav = nav.flip_face();
            HL_ASSERT(nav.dart().hexa == d1.hexa
                && nav.dart().edge == d1.edge
                && nav.dart().vert == d1.vert);
            nav = nav.flip_face();
            HL_ASSERT(nav.face() == f);
        }

        for (size_t i = 0; i < mesh.hexas.size(); ++i) {
            Hexa& h = mesh.hexas[i];
            HL_ASSERT(h.dart != -1);
            auto nav = mesh.navigate(h);
            HL_ASSERT(nav.hexa() == h);
            if (nav.dart().hexa_neighbor != -1) {
                Dart& d1 = nav.dart();
                nav = nav.flip_hexa();
                HL_ASSERT(nav.dart().face == d1.face
                    && nav.dart().edge == d1.edge
                    && nav.dart().vert == d1.vert);
                nav = nav.flip_hexa();
                HL_ASSERT(nav.hexa() == h);
            }
        }

        auto dt = milli_from_sample(t0);

        HL_LOG("[Mesh validator] Surface darts: %d/%d\n", surface_darts, mesh.darts.size());
        HL_LOG("[Mesh validator] Validation took %dms.\n", dt);

        return true;
    }
}