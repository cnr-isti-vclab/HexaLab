#include <peeling_filter.h>

#include <vector>
#include <stdint.h>

#define HL_PEELING_FILTER_DEFAULT_THRESHOLD 0
#define HL_PEELING_FILTER_DEFAULT_MESH_MAX  0
#define HL_PEELING_FILTER_DEFAULT_ENABLED   true

namespace HexaLab {
    void PeelingFilter::filter(Mesh& mesh) {       

        if (!this->enabled) 
            return;
        
        assert(mesh.cells.size() == this->HexaDepth.size());
        for (size_t i = 0; i < mesh.cells.size(); ++i) {
            if(this->HexaDepth[i] < this->depth_threshold)
                mesh.mark(mesh.cells[i]);
        }
    }

    void PeelingFilter::on_mesh_set(Mesh& mesh) {
        // Reset defaults
        this->enabled           = HL_PEELING_FILTER_DEFAULT_ENABLED;
        this->depth_threshold   = HL_PEELING_FILTER_DEFAULT_THRESHOLD;
        this->max_depth         = HL_PEELING_FILTER_DEFAULT_MESH_MAX;

        // Compute depth
        printf("[Peeling Filter] %lu %lu on_mesh_set\n", mesh.cells.size(), this->HexaDepth.size());
        const size_t hn = mesh.cells.size();

        const int BIG = std::numeric_limits<int>::max();

        this->HexaDepth.clear();
        this->HexaDepth.resize(hn, BIG);
        std::vector<size_t> toBeProcessed;
        
        for (const Face& f: mesh.faces) {
            if (f.is_boundary()) {
                if (HexaDepth[ f.ci[0] ] > 0) {
                    HexaDepth[ f.ci[0] ] = 0;
                    toBeProcessed.push_back( f.ci[0] );
                }
            }
        }

        int curDepth = 0;
        while(!toBeProcessed.empty()) {
            curDepth++;
            std::vector<size_t> inProcess;
            std::swap(toBeProcessed, inProcess);

            for (size_t ci : inProcess) {

                for (int s=0; s<6; s++) {
                    int cj = mesh.other_side( ci, s );
                    if (cj<0) continue;

                    if (HexaDepth[ cj ] > curDepth) {
                        HexaDepth[ cj ] = curDepth;
                        toBeProcessed.push_back( cj );
                    }
                }
            }
        }
        this->max_depth = curDepth;
        if (this->depth_threshold > curDepth) 
            this->depth_threshold = curDepth;
        
        for(int d : HexaDepth ) assert( d < BIG);

        printf("[Peeling Filter] Max Depth %i\n",curDepth);

    }
    
};

