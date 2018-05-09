#include <loader.h>

#include <fstream>

namespace HexaLab {
    
    bool Loader::load(const string& path, vector<Vector3f>& vertices, vector<Index>& indices)
    {
        std::string ext = path.substr(path.find_last_of("."));
        if(ext.compare(".mesh")==0 || ext.compare(".MESH")==0) return load_MESH(path, vertices, indices);
        if(ext.compare(".vtk" )==0 || ext.compare(".VTK")==0 ) return load_VTK (path, vertices, indices);
        return false;
    }


    bool Loader::load_MESH(const string& path, vector<Vector3f>& vertices, vector<Index>& indices)
    {
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
                HL_LOG("[Loader] Reading %d vertices...\n", vertices_count);
                vertices.reserve(vertices_count);
                for (int i = 0; i < vertices_count; ++i) {
                    Vector3f v;
                    float x;
                    HL_ASSERT_LOG(stream >> v.x() >> v.y() >> v.z() >> x, "ERROR: malformed mesh file. Unexpected vertex data format at vert %i.\n",i);
                    vertices.push_back(v);
                }
            // Quad indices
            } else if (header.compare("Quadrilaterals")==0 || header.compare("Quads") == 0) {
                int quads_count;
                HL_ASSERT_LOG(stream >> quads_count, "ERROR: malformed mesh file. Unexpected value after quads tag.\n");
                HL_LOG("[Loader] Reading %d quads... (unused)\n", quads_count);
                for (int i = 0; i < quads_count; ++i) {
                    Index idx[4];
                    Index x;
                    HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[2] >> idx[3] >> x, "ERROR: malformed mesh file. Unexpected quad format.\n");
                }
            // Hex indices
            } else if (header.compare("Hexahedra") == 0) {
                int hexas_count;
                HL_ASSERT_LOG(stream >> hexas_count, "ERROR: malformed mesh file. Unexpected tag after hexahedras tag.\n");
                HL_LOG("[Loader] Reading %d hexas...\n", hexas_count);
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


    bool Loader::load_VTK(const string& path, vector<Vector3f>& vertices, vector<Index>& indices)
    {
        vertices.clear();
        indices.clear();

        std::ifstream stream(path);
        std::string   line;

        bool header_found     = false;
        bool title_found      = false;
        bool type_found       = false;
        bool dataset_found    = false;
        bool point_data_found = false;
        bool cell_data_found  = false;

        // read header
        while(!header_found && std::getline(stream,line))
        {
            if(line.compare("# vtk DataFile Version 2.0")==0) header_found = true;
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse header\n");

        // read title (unused)
        while(!title_found && std::getline(stream,line))
        {
            if (!line.empty()) title_found = true;
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse title\n");

        // read dataset (only ASCII is supported right now)
        while(!type_found && std::getline(stream,line))
        {
            if (line.compare("ASCII")==0) type_found = true;
            HL_ASSERT_LOG(!(line.compare("BINARY")==0), "ERROR: malformed mesh file. ASCII is the only supported file type\n");
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse type (ASCII, BINARY)\n");

        // read type (only UNSTRUCTURED_GRID is supported right now)
        while(!dataset_found && std::getline(stream,line))
        {
            if (line.compare("DATASET UNSTRUCTURED_GRID")==0)  dataset_found = true;
            else
            if (line.compare("DATASET STRUCTURED_POINTS")==0 ||
                line.compare("DATASET STRUCTURED_GRID")==0   ||
                line.compare("DATASET POLYDATA")==0          ||
                line.compare("DATASET RECTILINEAR_GRID")==0  ||
                line.compare("DATASET FIELD")==0)
            {
                HL_ASSERT_LOG(false, "ERROR: malformed mesh file. UNSTRUCTURED_GRID is the only supported dataset\n");
            }
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse dataset type\n");

        // read point_data
        while(!point_data_found && std::getline(stream,line))
        {
            int nverts;
            if(sscanf(line.c_str(), "POINTS %d %*s", &nverts)==1)
            {
                vertices.reserve(nverts);
                point_data_found = true;
                HL_LOG("[Loader] Reading %d vertices...\n", nverts);
                for(int i=0; i<nverts; ++i)
                {
                    Vector3f p;
                    std::getline(stream,line);
                    if(sscanf(line.c_str(), "%f %f %f", &p.x(), &p.y(), &p.z())==3)
                    {
                        vertices.push_back(p);
                    }
                }
            }
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse point data\n");

        // read cell_data
        while(!cell_data_found && std::getline(stream,line))
        {
            int ncells;
            if(sscanf(line.c_str(), "CELLS %d %*d", &ncells)==1)
            {
                indices.reserve(ncells);
                cell_data_found = true;
                HL_LOG("[Loader] Reading %d hexas...\n", ncells);
                for(int i=0; i<ncells; ++i)
                {
                    Index v[8];
                    std::getline(stream,line);
                    if(sscanf(line.c_str(), "8 %d %d %d %d %d %d %d %d", &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6], &v[7])==8)
                    {
                        for(int j=0; j<8; ++j) indices.push_back(v[j]);
                    }
                }
            }
        }
        HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse cell data\n");

        return true;
    }
}
