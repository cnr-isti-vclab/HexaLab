#ifndef _HL_IFILTER_H_
#define _HL_IFILTER_H_

#include <mesh.h>

namespace HexaLab {
    class IFilter {
    public:
        void on_mesh_set(Mesh& mesh) {}
        virtual void filter(Mesh& mesh) = 0;
    };
}

#endif