#ifndef _HL_MESH_H_
#define _HL_MESH_H_

#include <vector>
#include <unordered_map>
#include <algorithm>
#include <Eigen/Dense>
#include <Eigen/Geometry>

#include <common.h>
#include <mesh_navigator.h>



namespace HexaLab {
    using namespace Eigen;
    using namespace std;

  typedef int32_t DartIndex;

  struct Dart {
      DartIndex hexa_neighbor = -1;
      DartIndex face_neighbor = -1;
      DartIndex edge_neighbor = -1;
      DartIndex vert_neighbor = -1;
      Index hexa = -1;
      Index face = -1;
      Index edge = -1;
      Index vert = -1;
  
      Dart(){}
      Dart(Index hexa, Index face, Index edge, Index vert) {
          this->hexa = hexa;
          this->face = face;
          this->edge = edge;
          this->vert = vert;
      }
  
      Dart(const Dart& other) = delete;
  
      Dart(const Dart&& other) {
          this->hexa_neighbor = other.hexa_neighbor;
          this->face_neighbor = other.face_neighbor;
          this->edge_neighbor = other.edge_neighbor;
          this->vert_neighbor = other.vert_neighbor;
          this->hexa = other.hexa;
          this->face = other.face;
          this->edge = other.edge;
          this->vert = other.vert;
      }
  
      bool operator==(const Dart& other) const {
          // Might limit the comparison to the hexa/face/edeg/vert fields
          return this->hexa_neighbor == other.hexa_neighbor
              && this->face_neighbor == other.face_neighbor
              && this->edge_neighbor == other.edge_neighbor
              && this->vert_neighbor == other.vert_neighbor
              && this->hexa == other.hexa
              && this->face == other.face
              && this->edge == other.edge
              && this->vert == other.vert;
      }
  };
 

    struct Hexa {
        DartIndex dart = -1;
        uint32_t _mark = 0;
        //int hexa_count = 0;

        Hexa(){}
        Hexa(Index dart) { this->dart = dart; }

        bool operator==(const Hexa& other) const {
            return this->dart == other.dart;
        }
        bool operator!=(const Hexa& other) const { return !(*this == other); }
    };

    struct Face {
        Index dart = -1;
        Vector3f normal;

        Face(){}
        Face(Index dart) { this->dart = dart; }
        Face(Index dart, const Vector3f& norm) { this->dart = dart; this->normal = norm; }
        Face(Index dart, const Vector3f&& norm) { this->dart = dart; this->normal = norm; }

        bool operator==(const Face& other) const {
            return this->dart == other.dart;
        }
        bool operator!=(const Face& other) const { return !(*this == other); }
    };

    struct Edge {
        Index dart = -1;
//        uint64_t mark = 0;
//        int face_count = 0;
        bool surface_flag = false;

        Edge(){}
        Edge(int32_t dart) { this->dart = dart; }

        bool operator==(const Edge& other) const {
            return this->dart == other.dart;
        }
        bool operator!=(const Edge& other) const { return !(*this == other); }
    };

    struct Vert {
        Index dart = -1;
        Vector3f position;

        Vert(){}
        Vert(Vector3f position) {
            this->position = position;
        }
        Vert(Vector3f position, Index dart) {
            this->position = position;
            this->dart = dart;
        }

        bool operator==(const Vert& other) const {
            return this->dart == other.dart
                && this->position == other.position;    // TODO non necessary ?
        }
        bool operator!=(const Vert& other) const { return !(*this == other); }
    };

class Mesh {
    friend class Builder;
private:
    uint32_t mark = 0;

public:
        vector<Hexa> hexas;
        vector<Face> faces;
        vector<Edge> edges;
        vector<Vert> verts;
        vector<Dart> darts;

        AlignedBox3f aabb;
        
        void unmark_all() { ++mark; }
        bool is_hexa_marked(const Hexa &hexa) const  {return hexa._mark == mark; }
        void unmark_hexa(Hexa &hexa) const { hexa._mark = mark-1; }
        void mark_hexa  (Hexa &hexa) const { hexa._mark = mark; }

        vector<float> hexa_quality;
        
        MeshNavigator navigate(Dart& dart) { return MeshNavigator(dart, *this); }
        MeshNavigator navigate(Hexa& hexa) { Dart& d = darts[hexa.dart]; return navigate(d); }
        MeshNavigator navigate(Face& face) { Dart& d = darts[face.dart]; return navigate(d); }
        MeshNavigator navigate(Edge& edge) { Dart& d = darts[edge.dart]; return navigate(d); }
        MeshNavigator navigate(Vert& vert) { Dart& d = darts[vert.dart]; return navigate(d); }
	};
}

#endif
