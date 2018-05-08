#pragma once

#include <mesh.h>

namespace HexaLab {
    class IFilter {
    public:
    	bool enabled = true;

        virtual void on_mesh_set(Mesh& mesh) {}
        virtual void filter(Mesh& mesh) = 0;
    };
}
