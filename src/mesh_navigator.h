#pragma once

namespace HexaLab {
    class Mesh;
    struct Hexa;
    struct Face;
    struct Edge;
    struct Vert;
    struct Dart;

    class MeshNavigator {
      private:
        Dart* _dart;
        Mesh* _mesh;
      public:
        MeshNavigator ( Dart& dart, Mesh& mesh )
            : _dart ( &dart )
            , _mesh ( &mesh ) {}

        // -- 'Atomic' fkil operations
        // Simple flipping of one combinatorial map element
        MeshNavigator flip_hexa();
        MeshNavigator flip_face();
        MeshNavigator flip_edge();
        MeshNavigator flip_vert();

        // -- Composite operaions --
        // 'Rotates' aound the current edge, changing face and hexa
        MeshNavigator rotate_on_edge();
        // 'Rotates' on the current face, changing vert and edge
        MeshNavigator rotate_on_face();
        // 'Rotates' around the current hexa's 4 side faces, changing vert, edge and face.
        // Each call changes face; 4 calls to do a full rotation.
        MeshNavigator rotate_on_hexa();
        // Moves to the corresponding dart as the current, but on the opposite face (e.g. front -> back, back->front, left-> right, ...)
        MeshNavigator flip_side();

        // Useful to iterate over the faces of a hexa.
        // Each call gets to a new face, so 6 to do a full iteration.
        MeshNavigator next_hexa_face();
        // True if the current face is a 'natural surface', meaning,
        // it does not have another hexa adjacent to it.
        bool is_face_boundary() const;
        // Gets the number of faces that are incident on the current edge
        int incident_face_on_edge_num() const;
        void collect_face_vertex_position_vector ( std::vector<Eigen::Vector3f>& posVec ) const;

        Hexa& hexa();
        Face& face();
        Edge& edge();
        Vert& vert();
        Dart& dart();
        Index hexa_index();
        Index face_index();
        Index edge_index();
        Index vert_index();
        Index dart_index();


        const Dart& dart() const;
        bool operator== ( const MeshNavigator& other ) const {
            return this->_dart == other._dart
                   && this->_mesh == other._mesh;
        }
    };
}
