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
        
        assert(mesh.hexas.size() == this->HexaDepth.size());
        for (size_t i = 0; i < mesh.hexas.size(); ++i) {
            if(this->HexaDepth[i] < this->depth_threshold)
                mesh.mark(mesh.hexas[i]);
        }
    }

    void PeelingFilter::on_mesh_set(Mesh& mesh) {
        // Reset defaults
        this->enabled           = HL_PEELING_FILTER_DEFAULT_ENABLED;
        this->depth_threshold   = HL_PEELING_FILTER_DEFAULT_THRESHOLD;
        this->max_depth         = HL_PEELING_FILTER_DEFAULT_MESH_MAX;

        // Compute depth
        printf("[Peeling Filter] %i %i on_mesh_set\n", mesh.hexas.size(), this->HexaDepth.size());
        const size_t hn = mesh.hexas.size();
        this->HexaDepth.clear();
        this->HexaDepth.resize(hn,-1);
        std::vector<size_t> toBeProcessed, toBeProcessedNext;
        
        for(size_t i = 0; i < mesh.faces.size(); ++i) {
            if(mesh.navigate(mesh.faces[i]).is_face_boundary())
                this->HexaDepth[mesh.navigate(mesh.faces[i]).hexa_index()] = 0;
        }

        for(size_t i = 0; i < hn; ++i) {
            if (this->HexaDepth[i] < 0)
                toBeProcessed.push_back(i);
        }
        
        int curDepth = 0;
        while(!toBeProcessed.empty()) {
            curDepth++;
            toBeProcessedNext.clear();
            for (size_t i : toBeProcessed) {
                auto navStart = mesh.navigate(mesh.hexas[i]);
                assert(this->HexaDepth[i] == -1);
                int minInd = std::numeric_limits<int>::max();
                auto nav = navStart;
                int faceCnt = 0;
                do {
                    faceCnt++;
                    assert(!nav.is_face_boundary());            
                    int otherDepth = this->HexaDepth[nav.flip_hexa().hexa_index()];
                    assert(otherDepth == -1 || otherDepth <= curDepth);
                    if (otherDepth >= 0 && otherDepth < curDepth && otherDepth < minInd) minInd = otherDepth;            
                    nav = nav.next_hexa_face();
                } while(!(nav == navStart));
                assert(faceCnt == 6);

                if(minInd < std::numeric_limits<int>::max())
                    this->HexaDepth[i] = minInd + 1;
                else 
                    toBeProcessedNext.push_back(i);                      
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

