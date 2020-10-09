#include <fstream>

#include "loader.h"

namespace HexaLab {

bool Loader::load(const string& path, vector<Vector3f>& vertices, vector<Index>& indices)
{
    std::string ext = path.substr(path.find_last_of("."));
    if(ext.compare(".mesh")==0 || ext.compare(".MESH")==0) return load_MESH(path, vertices, indices);
    if(ext.compare(".vtk" )==0 || ext.compare(".VTK")==0 ) return load_VTK (path, vertices, indices);
    return false;
}

void cleanWinLine(std::string & str){
    if (!str.empty() && *str.rbegin()=='\r') str.erase(str.length()-1,1);
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

        if (header.compare("MeshVersionFormatted") == 0) {
            HL_ASSERT_LOG(stream >> precision, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
        } else if (header.compare("Dimension") == 0) {
            HL_ASSERT_LOG(stream >> dimension, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
        } else if (header.compare("Vertices") == 0) {
            int vertices_count;
            HL_ASSERT_LOG(stream >> vertices_count, "ERROR: malformed mesh file. Unexpected value after %s tag.\n", header.c_str());
            HL_LOG("[Loader] Reading %d vertices...\n", vertices_count);
            vertices.reserve(vertices_count);
            for (int i = 0; i < vertices_count; ++i) {
                Vector3d v;
                float x;
                HL_ASSERT_LOG(stream >> v.x() >> v.y() >> v.z() >> x, "ERROR: malformed mesh file. Unexpected vertex data format at vert %i.\n",i);

                vertices.push_back(v.cast<float>());
            }
        } else if (header.compare("Quadrilaterals")==0 || header.compare("Quads") == 0) {
            int quads_count;
            HL_ASSERT_LOG(stream >> quads_count, "ERROR: malformed mesh file. Unexpected value after quads tag.\n");
            HL_LOG("[Loader] Reading %d quads... (unused)\n", quads_count);
            for (int i = 0; i < quads_count; ++i) {
                Index idx[4];
                Index x;
                HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[2] >> idx[3] >> x, "ERROR: malformed mesh file. Unexpected quad format.\n");
            }
        } else if (header.compare("Hexahedra") == 0) {
            int hexas_count;
            HL_ASSERT_LOG(stream >> hexas_count, "ERROR: malformed mesh file. Unexpected tag after hexahedras tag.\n");
            HL_LOG("[Loader] Reading %d hexas...\n", hexas_count);
            indices.reserve(hexas_count * 8);
            for (int h = 0; h < hexas_count; ++h) {
                Index idx[8];
                Index x;
                // irrational to rational vertex ordering!
                HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[3] >> idx[2] >> idx[4] >> idx[5] >> idx[7] >> idx[6] >> x,
                "ERROR: malformed mesh file. Unexpected hexahedra data format.\n");
                for (int i = 0; i < 8; ++i) {
                    indices.push_back(idx[i] - 1);
                }
            }
/*        // TODO: deal with the tetra case!
        }  else if (header.compare("Tetrahedra") == 0) {


            int tetra_count;
            HL_ASSERT_LOG(stream >> tetra_count, "ERROR: malformed mesh file. Unexpected tag after hexahedras tag.\n");
            HL_LOG("[Loader] Reading %d tetra...\n", tetra_count);
            indices.reserve(tetra_count * 8);
            for (int h = 0; h < tetra_count; ++h) {
                Index a,b,c,d;

                Index x;
                HL_ASSERT_LOG(stream >> a >> b >> c >> d >> x,
                              "ERROR: malformed mesh file. Unexpected hexahedra data format.\n");
                a--; b--; c--; d--;
                indices.push_back(a);
                indices.push_back(a);
                indices.push_back(b);
                indices.push_back(b);
                indices.push_back(c);
                indices.push_back(d);
                indices.push_back(c);
                indices.push_back(d);
            }
            */
        } else if (header.compare("Triangles") == 0) {
            int tri_count;
            HL_ASSERT_LOG(stream >> tri_count, "ERROR: malformed mesh file. Unexpected tag after Triangles tag.\n");
            HL_LOG("[Loader] Reading %d tris... (ignored)\n ", tri_count);
            for (int i = 0; i < tri_count; ++i) {
                Index idx[3];
                Index x;
                HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> idx[2] >> x, "ERROR: malformed mesh file. Unexpected triangle format.\n");
            }
        } else if (header.compare("Edges") == 0) {
            int edge_count;
            HL_ASSERT_LOG(stream >> edge_count, "ERROR: malformed mesh file. Unexpected tag after Edges tag.\n");
            HL_LOG("[Loader] Reading %d edges... (ignored)\n ", edge_count);
            for (int i = 0; i < edge_count; ++i) {
                Index idx[2];
                Index x;
                HL_ASSERT_LOG(stream >> idx[0] >> idx[1] >> x, "ERROR: malformed mesh file. Unexpected edge format.\n");
            }
        } else if (header.compare("Corners") == 0) {
            int corner_count;
            HL_ASSERT_LOG(stream >> corner_count, "ERROR: malformed mesh file. Unexpected tag after Corner tag.\n");
            HL_LOG("[Loader] Reading %d corner... (ignored)\n ", corner_count);
            for (int i = 0; i < corner_count; ++i) {
                Index c;
                HL_ASSERT_LOG(stream >> c, "ERROR: malformed mesh file. Unexpected corner format.\n");
            }
        } else if (header.compare("End") == 0) {
            break;
        } else if (header[0]=='#')  {
            stream.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        } else {
            HL_LOG("[Loader] Unexpected header \"%s\"\n ", header.c_str() );
            HL_ASSERT_LOG(false, "[Loader] ERROR: malformed mesh file. Unexpected header tag.\n");
        }
    }

    // Make sure at least vertex and hexa index data was read
    HL_ASSERT_LOG(vertices.size() != 0, "ERROR: mesh does not contain any vertex!\n");
    HL_ASSERT_LOG(indices.size()  != 0, "ERROR: mesh does not contain any thetra or hexa!\n");
    // Make a fast check that all the index are in range
    vector<int> usedVert(vertices.size(),0);
    for(size_t i = 0; i< indices.size();++i) {
        HL_ASSERT_LOG((indices[i]>=0 && indices[i]<vertices.size()),"ERROR: hex %lu has index out of range with val: %i\n",i/8,indices[i]);
        ++usedVert[indices[i]];
    }
    // And yell a warning for unreferenced vertices...
    int unrefCnt=0;
    for(size_t i = 0; i< vertices.size();++i){
      if(usedVert[i]==0) unrefCnt++;
    }
    if(unrefCnt>0) HL_LOG("WARNING: There are %i unref vertices\n",unrefCnt);
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
        cleanWinLine(line);
        if(line.compare("# vtk DataFile Version 2.0")==0) header_found = true;
        else if(line.compare("# vtk DataFile Version 3.0")==0) header_found = true;
    }
    HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse header\n");

    // read title (unused)
    while(!title_found && std::getline(stream,line))
    {
        cleanWinLine(line);
        if (!line.empty()) title_found = true;
    }
    HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse title\n");

    // read dataset (only ASCII is supported right now)
    while(!type_found && std::getline(stream,line))
    {
        cleanWinLine(line);
        if (line.compare("ASCII")==0) type_found = true;
        HL_ASSERT_LOG(!(line.compare("BINARY")==0), "ERROR: malformed mesh file. ASCII is the only supported file type\n");
    }
    HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse type (ASCII, BINARY)\n");

    // read type (only UNSTRUCTURED_GRID is supported right now)
    while(!dataset_found && std::getline(stream,line))
    {
        cleanWinLine(line);
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
        cleanWinLine(line);
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
        cleanWinLine(line);
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
                // irrational to rational vertex ordering!
                if(sscanf(line.c_str(), "8 %d %d %d %d %d %d %d %d", &v[0], &v[1], &v[3], &v[2], &v[4], &v[5], &v[7], &v[6])==8)
                {
                    for(int j=0; j<8; ++j) indices.push_back(v[j]);
                }
            }
        }
    }
    HL_ASSERT_LOG(!stream.eof(), "ERROR: malformed mesh file. Could not parse cell data\n");

    return true;
}

} // namespace
