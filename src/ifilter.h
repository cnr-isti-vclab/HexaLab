#pragma once

namespace HexaLab {

    class Mesh;

    class IFilter {
    public:
    	bool enabled = true;

        virtual void on_mesh_set(Mesh& mesh) {}
        virtual void filter(Mesh& mesh) = 0;
    };
}
