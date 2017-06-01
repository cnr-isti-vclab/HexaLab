#ifndef _HL_LOW_QUALITY_VIEW_H_
#define _HL_LOW_QUALITY_VIEW_H_

#include <mesh.h>
#include <ifilter.h>

namespace HexaLab {
    class QualityFilter : public IFilter {
    public:
        float quality_threshold;
        void filter(Mesh& mesh);
    };
}

#endif