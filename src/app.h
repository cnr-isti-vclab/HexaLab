#ifndef _HL_APP_H_
#define _HL_APP_H_

#include <mesh.h>
#include <ifilter.h>
#include <model.h>
#include <loader.h>
#include <builder.h>

#include <string>
#include <vector>

namespace HexaLab {

    class App {
        Mesh* mesh = nullptr;

        vector<IFilter*> filters;

        Model visible_model;
        Model filtered_model;
        Model singularity_model;

        vector<float> hexa_quality;

    public:
        bool import_mesh(string path);
        Mesh* get_mesh() { return mesh; }
        
        void add_filter(IFilter* filter) {
            filters.push_back(filter);
        }

        Model* get_visible_model() { return &this->visible_model; }
        Model* get_filtered_model() { return &this->filtered_model; }
        Model* get_singularity_model() { return &this->singularity_model; }

        vector<float>& get_hexa_quality() { return hexa_quality; }

        void build_models();

    private:
        void add_visible_face(Dart& dart, float normal_sign);
        void add_visible_wireframe(Dart& dart);
        void add_filtered_face(Dart& dart);
        void add_filtered_wireframe(Dart& dart);
    };
}

#endif