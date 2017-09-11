#ifndef _HL_MESH_NAVIGATOR_H_
#define _HL_MESH_NAVIGATOR_H_

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
        MeshNavigator(Dart& dart, Mesh& mesh)
            : _dart(&dart)
            , _mesh(&mesh) {}

        MeshNavigator flip_hexa();
        MeshNavigator flip_face();
        MeshNavigator flip_edge();
        MeshNavigator flip_vert();

        MeshNavigator rotate_on_edge();
        MeshNavigator rotate_on_face();
        MeshNavigator rotate_on_hexa();
        
        MeshNavigator next_hexa_face();
        bool is_face_boundary() const;
        int incident_face_on_edge_num() const;
        void collect_face_vertex_position_vector(std::vector<Eigen::Vector3f> &posVec) const;
        
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
        bool operator==(const MeshNavigator& other) const {
          return this->_dart == other._dart
              && this->_mesh == other._mesh;          
        }
    };
}

#endif
