#ifndef _HL_APP_H_
#define _HL_APP_H_

#include <mesh.h>
#include <mesh_navigator.h>
#include <ifilter.h>
#include <model.h>
#include <loader.h>
#include <builder.h>
#include <color_map.h>

#include <Eigen/Geometry>

namespace HexaLab {

    using namespace Eigen;

    struct MeshStats {
        size_t vert_count = 0;
        size_t hexa_count = 0;
        float min_edge_len = 0;
        float max_edge_len = 0;
        float avg_edge_len = 0;
        AlignedBox3f aabb;
        float quality_min = 0;
        float quality_max = 0;
        float quality_avg = 0;
        float quality_var = 0;
    };

    class App {
    private:
        Mesh* mesh = nullptr;
        MeshStats mesh_stats;

        vector<IFilter*> filters;

        Model visible_model;
        Model filtered_model;
        Model singularity_model;
        Model boundary_singularity_model;
        Model boundary_creases_model;

        Vector3f visible_outside_color = Vector3f(1, 1, 1);
        Vector3f visible_inside_color  = Vector3f(1, 1, 0);

    public:
        typedef float (quality_measure_fun)(const Vector3f&, const Vector3f&,
            const Vector3f&, const Vector3f&, const Vector3f&,
            const Vector3f&, const Vector3f&, const Vector3f&);

        bool import_mesh(string path);
        //Mesh* get_mesh() { return mesh; }
        MeshStats* get_mesh_stats() { return &mesh_stats; }

        void add_filter(IFilter* filter) {
            filters.push_back(filter);
        }

        ColorMap color_map;
        bool do_show_color_map = false;
        void set_visible_outside_color(float r, float g, float b) { visible_outside_color = Vector3f(r, g, b); }
        void set_visible_inside_color(float r, float g, float b) { visible_inside_color = Vector3f(r, g, b); }
        Vector3f get_visible_outside_color() { return visible_outside_color; }
        Vector3f get_visible_inside_color() { return visible_inside_color; }

        Model* get_visible_model() { return &this->visible_model; }
        Model* get_filtered_model() { return &this->filtered_model; }
        Model* get_singularity_model() { return &this->singularity_model; }
        Model* get_boundary_singularity_model() { return &this->boundary_singularity_model; }
        Model* get_boundary_creases_model() { return &this->boundary_creases_model; }

        vector<float>* get_hexa_quality() { return mesh == nullptr ? nullptr : &mesh->hexa_quality; }
        void compute_hexa_quality(quality_measure_fun* fun);

        void build_surface_models();
        void build_singularity_models();

    private:
        void add_visible_face(Dart& dart, float normal_sign);
        void add_visible_wireframe(Dart& dart);
        void add_filtered_face(Dart& dart);
        void add_filtered_wireframe(Dart& dart);
    };
}

#endif
