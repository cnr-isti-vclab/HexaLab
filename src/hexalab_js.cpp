#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>
#include <peeling_filter.h>
#include <pick_filter.h>
#include <color_map.h>
#include <hex_quality.h>
#include <hex_quality_color_maps.h>

using namespace HexaLab;
using namespace Eigen;

// emscripten bindings helpers

// Model
vector<Vector3f>* get_surface_vert_pos ( Model& model )     { return &model.surface_vert_pos; }
vector<Vector3f>* get_surface_vert_norm ( Model& model )    { return &model.surface_vert_norm; }
vector<Vector3f>* get_surface_vert_color ( Model& model )   { return &model.surface_vert_color; }
vector<HexaLab::Index>*    get_surface_ibuffer ( Model& model )      { return &model.surface_ibuffer; }
vector<Vector3f>* get_wireframe_vert_pos ( Model& model )   { return &model.wireframe_vert_pos; }
vector<Vector3f>* get_wireframe_vert_color ( Model& model ) { return &model.wireframe_vert_color; }
vector<float>*    get_wireframe_vert_alpha ( Model& model ) { return &model.wireframe_vert_alpha; }

// std::vector
template<typename T> js_ptr buffer_data ( std::vector<T>& v ) { return ( js_ptr ) v.data(); }
template<typename T> size_t buffer_size ( std::vector<T>& v ) { return v.size(); }

// MeshStats
float    mesh_stats_aabb_diag ( MeshStats& stats ) { return stats.aabb.diagonal().norm(); }
Vector3f mesh_stats_aabb_size ( MeshStats& stats ) { return stats.aabb.sizes(); }
Vector3f mesh_stats_center ( MeshStats& stats )    { return stats.aabb.center(); }

// ColorMap
Vector3f map_value_to_color ( App& app, float value ) { return app.get_color_map().get ( value ); }

// Quality measure
float get_lower_quality_range_bound ( App& app ) {
    QualityMeasureEnum m = app.get_quality_measure();
    MeshStats& s = *app.get_mesh_stats();
    return denormalize_quality_measure ( m, 0, s.quality_min, s.quality_max );
}
float get_upper_quality_range_bound ( App& app ) {
    QualityMeasureEnum m = app.get_quality_measure();
    MeshStats& s = *app.get_mesh_stats();
    return denormalize_quality_measure ( m, 1, s.quality_min, s.quality_max );
}

// Vector3f
void vec3_set_x ( Vector3f& vec, float val ) {
    vec.x() = val;
}
void vec3_set_y ( Vector3f& vec, float val ) {
    vec.y() = val;
}
void vec3_set_z ( Vector3f& vec, float val ) {
    vec.z() = val;
}

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;
EMSCRIPTEN_BINDINGS ( HexaLab ) {
    // APP
    class_<App> ( "App" )
    .constructor<>()
    .function ( "import_mesh",                        &App::import_mesh )
    .function ( "add_filter",                         &App::add_filter, allow_raw_pointers() )
    .function ( "flag_models_as_dirty",               &App::flag_models_as_dirty )
    .function ( "update_models",                      &App::update_models )
    .function ( "enable_quality_color_mapping",       &App::enable_quality_color_mapping )
    .function ( "disable_quality_color_mapping",      &App::disable_quality_color_mapping )
    .function ( "set_default_outside_color",          &App::set_default_outside_color )
    .function ( "set_default_inside_color",           &App::set_default_inside_color )
    .function ( "set_quality_measure",                &App::set_quality_measure )
    .function ( "show_boundary_singularity",          &App::show_boundary_singularity )
    .function ( "show_boundary_creases",              &App::show_boundary_creases )
    .function ( "set_geometry_mode",                  &App::set_geometry_mode )
    .function ( "set_crack_size",                     &App::set_crack_size )
    .function ( "set_rounding_radius",                &App::set_rounding_radius )
    .function ( "set_regularize_str",                 &App::set_regularize_str )
    .function ( "show_visible_wireframe_singularity", &App::show_visible_wireframe_singularity )
    .function ( "get_visible_model",                  &App::get_visible_model, allow_raw_pointers() )
    .function ( "get_filtered_model",                 &App::get_filtered_model, allow_raw_pointers() )
    .function ( "get_line_singularity_model",         &App::get_line_singularity_model, allow_raw_pointers() )
    .function ( "get_spined_singularity_model",       &App::get_spined_singularity_model, allow_raw_pointers() )
    .function ( "get_full_singularity_model",         &App::get_full_singularity_model, allow_raw_pointers() )
    .function ( "get_full_model",                     &App::get_full_model, allow_raw_pointers() )
    .function ( "get_hexa_quality",                   &App::get_hexa_quality, allow_raw_pointers() )
    .function ( "get_normalized_hexa_quality",        &App::get_normalized_hexa_quality, allow_raw_pointers() )
    .function ( "get_mesh",                           &App::get_mesh_stats, allow_raw_pointers() )
    .function ( "get_default_outside_color",          &App::get_default_outside_color )
    .function ( "get_default_inside_color",           &App::get_default_inside_color )
    .function ( "is_quality_color_mapping_enabled",   &App::is_quality_color_mapping_enabled )
    .function ( "get_quality_measure",                &App::get_quality_measure )
    .function ( "map_value_to_color",                 &map_value_to_color )
    .function ( "get_lower_quality_range_bound",      &get_lower_quality_range_bound )
    .function ( "get_upper_quality_range_bound",      &get_upper_quality_range_bound )
    ;
    enum_<ColorMap::Palette> ( "ColorMap" )
    .value ( "Parula",                    ColorMap::Palette::Parula )
    .value ( "Jet",                       ColorMap::Palette::Jet )
    .value ( "RedBlue",                   ColorMap::Palette::RedBlue )
    ;
    enum_<QualityMeasureEnum> ( "QualityMeasure" )
    .value ( "ScaledJacobian",            QualityMeasureEnum::SJ )
    .value ( "Diagonal",                  QualityMeasureEnum::DIA )
    .value ( "EdgeRatio",                 QualityMeasureEnum::ER )
    .value ( "Dimension",                 QualityMeasureEnum::DIM )
    .value ( "Distortion",                QualityMeasureEnum::DIS )
    .value ( "Jacobian",                  QualityMeasureEnum::J )
    .value ( "MaxEdgeRatio",              QualityMeasureEnum::MER )
    .value ( "MaxAspectFrobenius",        QualityMeasureEnum::MAAF )
    .value ( "MeanAspectFrobenius",       QualityMeasureEnum::MEAF )
    .value ( "Oddy",                      QualityMeasureEnum::ODD )
    .value ( "RelativeSizeSquared",       QualityMeasureEnum::RSS )
    .value ( "Shape",                     QualityMeasureEnum::SHA )
    .value ( "ShapeAndSize",              QualityMeasureEnum::SHAS )
    .value ( "Shear",                     QualityMeasureEnum::SHE )
    .value ( "ShearAndSize",              QualityMeasureEnum::SHES )
    .value ( "Skew",                      QualityMeasureEnum::SKE )
    .value ( "Stretch",                   QualityMeasureEnum::STR )
    .value ( "Taper",                     QualityMeasureEnum::TAP )
    .value ( "Volume",                    QualityMeasureEnum::VOL )
    ;
    class_<Model> ( "Model" )
    .constructor<>()
    .function ( "surface_pos",            &get_surface_vert_pos, allow_raw_pointers() )
    .function ( "surface_norm",           &get_surface_vert_norm, allow_raw_pointers() )
    .function ( "surface_color",          &get_surface_vert_color, allow_raw_pointers() )
    .function ( "surface_ibuffer",        &get_surface_ibuffer, allow_raw_pointers() )
    .function ( "wireframe_pos",          &get_wireframe_vert_pos, allow_raw_pointers() )
    .function ( "wireframe_color",        &get_wireframe_vert_color, allow_raw_pointers() )
    .function ( "wireframe_alpha",        &get_wireframe_vert_alpha, allow_raw_pointers() )
    ;
    class_<MeshStats> ( "Mesh" )
    .property ( "vert_count",             &MeshStats::vert_count )
    .property ( "hexa_count",             &MeshStats::hexa_count )
    .property ( "min_edge_len",           &MeshStats::min_edge_len )
    .property ( "max_edge_len",           &MeshStats::max_edge_len )
    .property ( "avg_edge_len",           &MeshStats::avg_edge_len )
    .property ( "quality_min",            &MeshStats::quality_min )
    .property ( "quality_max",            &MeshStats::quality_max )
    .property ( "quality_avg",            &MeshStats::quality_avg )
    .property ( "quality_var",            &MeshStats::quality_var )
    .function ( "get_aabb_diagonal",      &mesh_stats_aabb_diag )
    .function ( "get_aabb_size",          &mesh_stats_aabb_size )
    .function ( "get_aabb_center",        &mesh_stats_center )
    .property ( "normalized_quality_min", &MeshStats::normalized_quality_min )
    .property ( "normalized_quality_max", &MeshStats::normalized_quality_max )
    ;
    enum_<GeometryMode> ( "GeometryMode" )
    .value ( "Default",                   GeometryMode::Default )
    .value ( "Cracked",                   GeometryMode::Cracked )
    .value ( "Smooth",                    GeometryMode::Smooth )
    ;
    // FILTERS
    class_<IFilter> ( "Filter" )
    .property ( "enabled",                &IFilter::enabled )
    ;
    class_<PlaneFilter, base<IFilter>> ( "PlaneFilter" )
                                    .constructor<>()
                                    .function ( "filter",                 &PlaneFilter::filter )
                                    .function ( "on_mesh_set",            &PlaneFilter::on_mesh_set )
                                    .function ( "set_plane_normal",       &PlaneFilter::set_plane_normal )
                                    .function ( "set_plane_offset",       &PlaneFilter::set_plane_offset )
                                    .function ( "get_plane_normal",       &PlaneFilter::get_plane_normal )
                                    .function ( "get_plane_offset",       &PlaneFilter::get_plane_offset )
                                    .function ( "get_plane_world_offset", &PlaneFilter::get_plane_world_offset )
                                    ;
    enum_<QualityFilter::Operator> ( "QualityFilterOperator" )
    .value ( "Inside",                    QualityFilter::Operator::Inside )
    .value ( "Outside",                   QualityFilter::Operator::Outside )
    ;
    class_<QualityFilter, base<IFilter>> ( "QualityFilter" )
                                      .constructor<>()
                                      .function ( "filter",                 &QualityFilter::filter )
                                      .function ( "on_mesh_set",            static_cast<void ( QualityFilter::* ) ( Mesh& ) > ( &IFilter::on_mesh_set ) )
                                      .property ( "quality_threshold_min",  &QualityFilter::quality_threshold_min )
                                      .property ( "quality_threshold_max",  &QualityFilter::quality_threshold_max )
                                      .property ( "operator",               &QualityFilter::op )
                                      ;
    class_<PeelingFilter, base<IFilter>> ( "PeelingFilter" )
                                      .constructor<>()
                                      .function ( "filter",                 &PeelingFilter::filter )
                                      .function ( "on_mesh_set",            static_cast<void ( PeelingFilter::* ) ( Mesh& ) > ( &IFilter::on_mesh_set ) )
                                      .property ( "peeling_depth",          &PeelingFilter::depth_threshold )
                                      .property ( "max_depth",              &PeelingFilter::max_depth )
                                      ;
    class_<PickFilter, base<IFilter>> ( "PickFilter" )
                                   .constructor<>()
                                   .function ( "filter",                 &PickFilter::filter )
                                   .function ( "on_mesh_set",            static_cast<void ( PickFilter::* ) ( Mesh& ) > ( &IFilter::on_mesh_set ) )
                                   .function ( "clear",                  &PickFilter::clear )
								   .function ( "dig_hexa",            	 &PickFilter::dig_hexa )
                                   .function ( "undig_hexa",             &PickFilter::undig_hexa )
                                   .function ( "add_one_to_filtered",    &PickFilter::add_one_to_filtered )
                                   .function ( "add_one_to_filled",      &PickFilter::add_one_to_filled )
                                   ;
    // MISC
    class_<Vector3f> ( "vec3" )
    .constructor<>()
    .function ( "x",                      static_cast<float& ( Vector3f::* ) () > ( select_overload<float&() > ( &Vector3f::x ) ) )
    .function ( "y",                      static_cast<float& ( Vector3f::* ) () > ( select_overload<float&() > ( &Vector3f::y ) ) )
    .function ( "z",                      static_cast<float& ( Vector3f::* ) () > ( select_overload<float&() > ( &Vector3f::z ) ) )
    .function ( "set_x",                  &vec3_set_x )
    .function ( "set_y",                  &vec3_set_y )
    .function ( "set_z",                  &vec3_set_z )
    ;
    class_<vector<Vector3f>> ( "buffer3f" )
                          .constructor<>()
                          .function ( "data",                   &buffer_data<Vector3f> )
                          .function ( "size",                   &buffer_size<Vector3f> )
                          ;
    class_<vector<float>> ( "buffer1f" )
                       .constructor<>()
                       .function ( "data",                   &buffer_data<float> )
                       .function ( "size",                   &buffer_size<float> )
                       ;
    class_<vector<Index>> ( "buffer1i" )
                       .constructor<>()
                       .function ( "data",                   &buffer_data<Index> )
                       .function ( "size",                   &buffer_size<Index> )
                       ;
}
#endif
