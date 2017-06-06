#ifndef _HL_LOW_QUALITY_VIEW_H_
#define _HL_LOW_QUALITY_VIEW_H_

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
        Operator op = Operator::Inside;
        void filter(Mesh& mesh);
    };
}

#endif