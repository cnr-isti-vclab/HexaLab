#include <quality_filter.h>

#define HL_QUALITY_FILTER_DEFAULT_ENABLED   true
#define HL_QUALITY_FILTER_DEFAULT_MIN       0.f
#define HL_QUALITY_FILTER_DEFAULT_MAX       1.f
#define HL_QUALITY_FILTER_DEFAULT_OP        Operator::Inside

namespace HexaLab {
    void QualityFilter::on_mesh_set ( Mesh& mesh ) {
        this->enabled               = HL_QUALITY_FILTER_DEFAULT_ENABLED;
        this->quality_threshold_min = HL_QUALITY_FILTER_DEFAULT_MIN;
        this->quality_threshold_max = HL_QUALITY_FILTER_DEFAULT_MAX;
        this->op                    = HL_QUALITY_FILTER_DEFAULT_OP;
    }

    void QualityFilter::filter ( Mesh& mesh ) {
        if ( !this->enabled ) {
            return;
        }

        for ( size_t i = 0; i < mesh.cells.size(); ++i ) {
            bool is_filtered;

            switch ( this->op ) {
                case Operator::Inside:
                    is_filtered = mesh.normalized_hexa_quality[i] < quality_threshold_min || mesh.normalized_hexa_quality[i] > quality_threshold_max;
                    break;

                case Operator::Outside:
                    is_filtered = mesh.normalized_hexa_quality[i] > quality_threshold_min && mesh.normalized_hexa_quality[i] < quality_threshold_max;
                    break;
            }

            if ( is_filtered ) {
                mesh.mark ( mesh.cells[i] );
            }
        }
    }
}
