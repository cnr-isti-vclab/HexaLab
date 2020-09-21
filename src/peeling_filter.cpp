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
        this->HexaDepth.clear();
        this->HexaDepth.resize(hn,-1);
        std::vector<size_t> toBeProcessed, toBeProcessedNext;
        
        for (const Face& f: mesh.faces) {
            if (f.is_boundary()) this->HexaDepth[ f.ci[0] ] = 0;
        }

        for(size_t i = 0; i < hn; ++i) {
            if (this->HexaDepth[i] < 0)
                toBeProcessed.push_back(i);
        }
        
        int curDepth = 0;
        while(!toBeProcessed.empty()) {
            curDepth++;
            toBeProcessedNext.clear();
            for (size_t ci : toBeProcessed) {
                const Cell& c = mesh.cells[ci];

                assert(this->HexaDepth[ci] == -1);

                const int BIG = std::numeric_limits<int>::max();
                int minInd = BIG;

                for (int s=0; s<6; s++) {
                    int cj = mesh.other_side( ci, s );
                    if (cj<0) continue;

                    int otherDepth = this->HexaDepth[ cj ];
                    if (otherDepth >= 0 && otherDepth < curDepth && otherDepth < minInd) minInd = otherDepth;

                }
                if(minInd < BIG )
                    this->HexaDepth[ci] = minInd + 1;
                else 
                    toBeProcessedNext.push_back(ci);
            }
            std::swap(toBeProcessed, toBeProcessedNext); 
        }
        this->max_depth = curDepth;
        if (this->depth_threshold > curDepth) 
            this->depth_threshold = curDepth;
        
        printf("[Peeling Filter] Max Depth %i\n",curDepth);
        for(size_t i = 0; i < hn; ++i) { 
            assert (this->HexaDepth[i] >= 0); 
        }
    }
    
};

