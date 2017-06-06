#include <quality_filter.h>

namespace HexaLab {
    void QualityFilter::filter(Mesh& mesh) {
        if (!this->enabled)
        	return;
        for (size_t i = 0; i < mesh.hexas.size(); ++i) {
        	bool is_filtered;
        	switch(this->op) {
        	case Operator::Inside:
        		is_filtered = mesh.hexas[i].scaled_jacobian < quality_threshold_min || mesh.hexas[i].scaled_jacobian > quality_threshold_max;
        		break;
        	case Operator::Outside:
        		is_filtered = mesh.hexas[i].scaled_jacobian > quality_threshold_min && mesh.hexas[i].scaled_jacobian < quality_threshold_max;
        		break;
        	}
            if (is_filtered) {
                mesh.hexas[i].filter_mark = mesh.mark;
            }
        }
    }
}