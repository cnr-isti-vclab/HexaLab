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

    /**
     * @brief MeshNavigator::incident_face_on_edge_num
     * @return the number of faces that are incident on the current edge
     */
    int MeshNavigator::incident_face_on_edge_num() const
    {
      int faceCnt=0;
      bool edge_on_boundary=false;
      MeshNavigator nav = *this;
      do
      {
        nav = nav.rotate_on_edge();
        if(nav.is_face_boundary()) edge_on_boundary=true;
        ++faceCnt;

      } while(!(nav == *this));
      if(edge_on_boundary) faceCnt/=2;
      return faceCnt;
    }

    void MeshNavigator::collect_face_vertex_position_vector(std::vector<Vector3f> &posVec) const
    {
      posVec.clear();
      MeshNavigator nav = *this;
      do
      {
        posVec.push_back(nav.vert().position);
        nav = nav.rotate_on_face();
      } while(!(nav == *this));
      assert(posVec.size()==4);
    }

    bool MeshNavigator::is_face_boundary() const { return (_dart->hexa_neighbor == -1); }

    Hexa& MeshNavigator::hexa() { return _mesh->hexas[_dart->hexa]; }
    Face& MeshNavigator::face() { return _mesh->faces[_dart->face]; }
    Edge& MeshNavigator::edge() { return _mesh->edges[_dart->edge]; }
    Vert& MeshNavigator::vert() { return _mesh->verts[_dart->vert]; }
    Index MeshNavigator::hexa_index() { return _dart->hexa; }
    Index MeshNavigator::face_index() { return _dart->face; }
    Index MeshNavigator::edge_index() { return _dart->edge; }
    Index MeshNavigator::vert_index() { return _dart->vert; }
    Index MeshNavigator::dart_index() { return std::distance(&*_mesh->darts.begin(),_dart); }
    const Dart& MeshNavigator::dart() const { return *_dart; }
    Dart& MeshNavigator::dart() { return *_dart; }
}
