#include <quality_filter.h>

namespace HexaLab {
    void QualityFilter::filter(Mesh& mesh) {
        for (size_t i = 0; i < mesh.hexas.size(); ++i) {
            if (mesh.hexas[i].scaled_jacobian < quality_threshold) {
                mesh.hexas[i].filter_mark = mesh.mark;
            }
        }
    }
}