#include <mesh_navigator.h>

#include <mesh.h>

namespace HexaLab {
    MeshNavigator MeshNavigator::flip_hexa() { return MeshNavigator(_mesh->darts[_dart->hexa_neighbor], *_mesh); }
    MeshNavigator MeshNavigator::flip_face() { return MeshNavigator(_mesh->darts[_dart->face_neighbor], *_mesh); }
    MeshNavigator MeshNavigator::flip_edge() { return MeshNavigator(_mesh->darts[_dart->edge_neighbor], *_mesh); }
    MeshNavigator MeshNavigator::flip_vert() { return MeshNavigator(_mesh->darts[_dart->vert_neighbor], *_mesh); }

    MeshNavigator MeshNavigator::rotate_on_edge() { 
        MeshNavigator nav = *this;
        if (nav.dart().hexa_neighbor != -1) {
            nav = nav.flip_hexa();
        }
        return nav.flip_face(); 
    }
    MeshNavigator MeshNavigator::rotate_on_face() { return flip_vert().flip_edge(); }
    MeshNavigator MeshNavigator::rotate_on_hexa() { return flip_vert().flip_edge().flip_face().flip_edge(); }

    MeshNavigator MeshNavigator::next_hexa_face() { return flip_vert().flip_edge().flip_face(); }

    Hexa& MeshNavigator::hexa() { return _mesh->hexas[_dart->hexa]; }
    Face& MeshNavigator::face() { return _mesh->faces[_dart->face]; }
    Edge& MeshNavigator::edge() { return _mesh->edges[_dart->edge]; }
    Vert& MeshNavigator::vert() { return _mesh->verts[_dart->vert]; }
    Dart& MeshNavigator::dart() { return *_dart; }
}