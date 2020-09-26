#pragma once

#include "mesh.h"

namespace HexaLab {

struct FaceData{
    Index v1,v2,v3; // vertex index 1,2,3, NOT the first one
    Index ci; // originating cell
    short side; // originating side (0 to 5)

    FaceData(FourIndices vi, Index _ci, short s):ci(_ci),v1(vi[1]),v2(vi[2]),v3(vi[3]),side(s) {}

    bool matches( const FaceData& other ) const {
        return (other.v2==v2) && (other.v1==v3) && (other.v3==v1);
    }
};

class Builder {
public:
    // indices should be a vector of size multiple of 8. each tuple of 8 consecutive indices represents an hexahedra.
    void build ( Mesh& mesh, const vector<Vector3f>& verts, const vector<Index>& indices );
    bool validate ( Mesh& mesh );
private:
    void init_build( Mesh& mesh );
    void add_vertices( Mesh& mesh, const vector<Vector3f>& verts );
    void add_hexas( Mesh& mesh, const vector<Index>& indices, int from = 0, int to = 100 );
    void compute_normal( Mesh& mesh, Face& face);

    void add_hexa ( Mesh& mesh, const Index* hexa );

    void add_face(Mesh& mesh, const FaceData & fa);
    void add_face(Mesh& mesh, const FaceData & fa, const FaceData & fb);

    void find_matches( Mesh& mesh, std::vector<FaceData> &v, const FaceData &fd );

    std::vector< std::vector< FaceData > > face_data;


};


} // namespace


