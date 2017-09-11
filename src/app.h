#ifndef _HL_APP_H_
#define _HL_APP_H_

#include <mesh.h>
#include <mesh_navigator.h>
#include <ifilter.h>
#include <model.h>
#include <loader.h>
#include <builder.h>
#include <color_map.h>

namespace HexaLab {

    struct MeshStats {
        size_t vert_count = 0;
        size_t hexa_count = 0;
        float min_edge_len = 0;
        float max_edge_len = 0;
        float avg_edge_len = 0;
    };

    class App {
        Mesh* mesh = nullptr;
        MeshStats mesh_stats;

        vector<IFilter*> filters;

        Model visible_model;
        Model filtered_model;
        Model singularity_model;


    public:
        bool import_mesh(string path);
        Mesh* get_mesh() { return mesh; }
        MeshStats* get_mesh_stats() { return &mesh_stats; }
        
        void add_filter(IFilter* filter) {
            filters.push_back(filter);
        }

        ColorMap color_map;

        Model* get_visible_model() { return &this->visible_model; }
        Model* get_filtered_model() { return &this->filtered_model; }
        Model* get_singularity_model() { return &this->singularity_model; }

        vector<float>& get_hexa_quality() { return mesh->hexa_quality; }

        void build_models();
        void build_singularity_model();

    private:
        void add_visible_face(Dart& dart, float normal_sign);
        void add_visible_wireframe(Dart& dart);
        void add_filtered_face(Dart& dart);
        void add_filtered_wireframe(Dart& dart);
    };
}

#endif
