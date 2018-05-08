#pragma once

#include <mesh.h>
#include <ifilter.h>

namespace HexaLab {
    class QualityFilter : public IFilter {
    public:
    	enum class Operator {
    		Inside,
    		Outside
    	};

        float quality_threshold_min;
        float quality_threshold_max;
        Operator op;
        
        void filter(Mesh& mesh);
        void on_mesh_set(Mesh& _mesh);
    };
}
