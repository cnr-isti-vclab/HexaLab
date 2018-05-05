#pragma once

#include <mesh.h>
#include <model.h>
#include <ifilter.h>

namespace HexaLab {
    class PeelingFilter : public IFilter {
    private:
        std::vector<int> HexaDepth;

    public:
        // All the hexa with a depth lower than this will get filtered
        int depth_threshold;
        int max_depth;
        void filter(Mesh& mesh);
        void on_mesh_set(Mesh& mesh);
    };
}
