#ifndef  _HL_PEELING_FILTER_H
#define  _HL_PEELING_FILTER_H

#include <mesh.h>
#include <model.h>
#include <ifilter.h>

namespace HexaLab {
    class PeelingFilter : public IFilter {
    private:
        std::vector<int> HexaDepth;
        Mesh* mesh;

    public:
        int depth_threshold = 0; // all the hexa with a depth lower than this are filtered
        int max_depth = 0;
        void filter(Mesh& mesh);
        void on_mesh_set(Mesh& _mesh);

    private:
        
    };
}

#endif // PEELING_FILTER_H
