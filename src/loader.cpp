#include <loader.h>

#include <fstream>

namespace HexaLab {
    
    bool Loader::load(const string& path, vector<Vector3f>& vertices, vector<Index>& indices) {
        string header;

        vertices.clear();
        indices.clear();

        ifstream stream(path, ifstream::in | ifstream::binary);
        HL_ASSERT_LOG(stream.is_open(), "Unable to open file %s!\n", path.c_str());

        int precision;
        int dimension;
        
        while (stream.good()) {
            // Read a line
            HL_ASSERT_LOG(stream >> header, "ERROR: malformed mesh file. Is the file ended correctly?\n");

            // Precision
            if (header.compare("MeshVersionFormatted") == 0) {
                HL_ASSERT_LOG(stream >> precision, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
            // Dimension
            } else if (header.compare("Dimension") == 0) {
                HL_ASSERT_LOG(stream >> dimension, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
            // Vertices
            } else if (header.compare("Vertices") == 0) {
                int vertices_count;
                HL_ASSERT_LOG(stream >> vertices_count, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
                HL_LOG("Reading %d vertices...\n", vertices_count);
                vertices.reserve(vertices_count);
                for (int i = 0; i < vertices_count; ++i) {
                    Vector3f v;
                    float x;
                    HL_ASSERT_LOG(stream >> v.x() >> v.y() >> v.z() >> x, "ERROR: malformed mesh file. Unexpected vertex data format.\n");
                    vertices.push_back(v);
                }
            // Quad indices
            } else if (header.compare("Quadrilaterals") == 0) {
                int quads_count;
                HL_ASSERT_LOG(stream >> quads_count, "ERROR: malformed mesh file. Unexpected value after quads tag.\n");
                HL_LOG("Reading %d quads... (unused)\n", quads_count);
                for (int i = 0; i < quads_count; ++i) {
                    Index idx[4];
                    Index x;
                    HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[2] >> idx[3] >> x, "ERROR: malformed mesh file. Unexpected quad format.\n");
                }
            // Hex indices
            } else if (header.compare("Hexahedra") == 0) {
                int hexas_count;
                HL_ASSERT_LOG(stream >> hexas_count, "ERROR: malformed mesh file. Unexpected tag after hexahedras tag.\n");
                HL_LOG("Reading %d hexas...\n", hexas_count);
                indices.reserve(hexas_count * 8);
                for (int h = 0; h < hexas_count; ++h) {
                    Index idx[8];
                    Index x;
                    HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[2] >> idx[3] >> idx[4] >> idx[5] >> idx[6] >> idx[7] >> x,
                    "ERROR: malformed mesh file. Unexpected hexahedra data format.\n");
                    for (int i = 0; i < 8; ++i) {
                        indices.push_back(idx[i] - 1);
                    }
                }
            // End of file
            } else if (header.compare("End") == 0) {
                break;
            // Unknown token
            } else {
                HL_ASSERT_LOG(false, "ERROR: malformed mesh file. Unexpected header tag.\n");
            }
        }

        // Make sure at least vertex and hexa index data was read
        HL_ASSERT_LOG(vertices.size() != 0, "ERROR: mesh does not contain any vertex!\n");
        HL_ASSERT_LOG(indices.size()  != 0, "ERROR: mesh does not contain any index!\n");

        return true;
    }
}