#pragma once

#include <mesh.h>
#include <mesh_navigator.h>
#include <ifilter.h>
#include <model.h>
#include <loader.h>
#include <builder.h>
#include <color_map.h>
#include <hex_quality_color_maps.h>

#include <Eigen/Geometry>

namespace HexaLab {

    using namespace Eigen;

    struct MeshStats {
        size_t vert_count = 0;
        size_t hexa_count = 0;
        float min_edge_len = 0;
        float max_edge_len = 0;
        float avg_edge_len = 0;
        float avg_volume = 0;
        AlignedBox3f aabb;
        float quality_min = 0;
        float quality_max = 0;
        float quality_avg = 0;
        float quality_var = 0;
        float normalized_quality_min = 0;
        float normalized_quality_max = 0;
    };

    enum class GeometryMode {
        Default,
        Cracked,
        Smooth,
    };

    class App {
      private:
        // Currently loaded mesh. Initially a nullptr.
        Mesh* mesh = nullptr;
        // Data structure exposed to the .js app containing a bunch of useful info about the currently loaded mesh.
        MeshStats mesh_stats;

        // App filters instances. Each has a correspondent filter object in the .js app.
        // Filters are directly instanced and added from the .js app.
        vector<IFilter*> filters;

        // App models. Each has a correspondent model object in the .js app.
        // Singularity models are not subject to filtering, so they are built only once.
        // visible_model and filtered_model together make up the entire mesh and are updated on request.
        Model visible_model;
        Model filtered_model;
        Model singularity_model;

        bool do_show_boundary_singularity = false;
        bool do_show_boundary_creases = false;

        // Colors selected for the visible_model in the .js app. They are used when hexa quality color mapping is off.
        Vector3f default_outside_color = Vector3f ( 1, 1, 1 );
        Vector3f default_inside_color  = Vector3f ( 1, 1, 0 );

        // Selected quality measure. The evaluated values are stored inside the mesh, for each hexa.
        // Automatically updated on mesh or measure change.
        QualityMeasureEnum quality_measure = QualityMeasureEnum::SJ;

        // Selected quality color map, used when the hexa quality color mapping is on.
        ColorMap color_map;
        bool     quality_color_mapping_enabled = false;

        bool models_dirty_flag = false;

        GeometryMode geometry_mode = GeometryMode::Default;

        // default values are half these
        const float max_crack_size = 0.6f;
        const float max_rounding_radius = 0.3f;

        // these are scalars 0->1 that multiply the max
        float crack_size;
        float rounding_radius;

      public:
        // Loads and imports a new mesh file into the system. Call the Loader, the Builder, updates mesh stats and
        // evaluated quality measures, builds singularity models, notifies filters of the new mesh.
        bool import_mesh ( string path );

        // Adds a filter to the filters collection. On update, the filters are invoked in the order in which they were added.
        void add_filter ( IFilter* filter );

        // Flags the models as dirty. Called by all the app setters.
        // Filters should also call this (either from their .cpp or .js portion) whenever their settings get changed.
        void flag_models_as_dirty() { this->models_dirty_flag = true; }

        // If models are marked dirty, it reruns all the filters and rebuilds the surface models buffers.
        // Returns true if an update has been made (the models were marked dirty), false otherwise
        bool update_models();

        // Updates the selected color map, enabled quality color mapping and flags the model color buffer as dirty.
        void enable_quality_color_mapping ( ColorMap::Palette palette );
        // Disables quality color mapping and flags the model color buffer as dirty (it will be rebuilt using the default colors).
        void disable_quality_color_mapping();

        // Updates the default colors and if quality color mapping is disabled, it flags the model color buffer as dirty.
        void set_default_outside_color ( float r, float g, float b );
        void set_default_inside_color ( float r, float g, float b );

        // Flags as dirty the model quality buffers, and also the model color buffer if quality color mapping is enabled.
        void set_quality_measure ( QualityMeasureEnum e );

        // Flags as dirty the position/normal buffers.
        void set_geometry_mode ( GeometryMode mode );

        void show_boundary_singularity ( bool do_show );
        void show_boundary_creases ( bool do_show );

        void set_crack_size ( float size );
        void set_rounding_radius ( float rad );


        // Getters
        Vector3f            get_default_outside_color()         { return this->default_outside_color; }
        Vector3f            get_default_inside_color()          { return this->default_inside_color; }
        Model*              get_visible_model()                 { return &this->visible_model; }
        Model*              get_filtered_model()                { return &this->filtered_model; }
        Model*              get_singularity_model()             { return &this->singularity_model; }
        Mesh*               get_mesh()                          { return this->mesh; }
        MeshStats*          get_mesh_stats()                    { return this->mesh ? &this->mesh_stats : nullptr; }
        vector<float>*      get_hexa_quality()                  { return this->mesh ? &this->mesh->hexa_quality : nullptr; }
        vector<float>*      get_normalized_hexa_quality()       { return this->mesh ? &this->mesh->normalized_hexa_quality : nullptr; }
        ColorMap&           get_color_map()                     { return this->color_map; }
        bool                is_quality_color_mapping_enabled()  { return this->quality_color_mapping_enabled; }
        QualityMeasureEnum  get_quality_measure()               { return this->quality_measure; }

      private:
        void add_visible_vert ( Dart& dart, float normal_sign, Vector3f color );
        void add_visible_face ( Dart& dart, float normal_sign );
        void add_visible_wireframe ( Dart& dart );
        void add_filtered_face ( Dart& dart );
        void add_filtered_wireframe ( Dart& dart );

        size_t add_vertex ( Vector3f pos, Vector3f norm, Vector3f color );
        void add_triangle ( size_t i1, size_t i2, size_t i3 );
        void add_quad ( size_t i1, size_t i2, size_t i3, size_t i4 );

        void prepare_geometry();
        void prepare_cracked_geometry();
        void prepare_smooth_geometry();

        void build_gap_hexa ( const Vector3f pp[8], const Vector3f nn[6], const bool vv[8], const Vector3f ww[6] );
        void build_smooth_hexa ( const Vector3f pp[8], const Vector3f nn[6], const bool vv[8], const bool ww[6], Index hexa_idx );

        void compute_hexa_quality();
        void build_surface_models();
        void build_singularity_models();
    };
}
