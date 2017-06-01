#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>

using namespace HexaLab;
using namespace Eigen;

template<typename T>
js_ptr buffer_data(std::vector<T>& v) {
    return (js_ptr)v.data();
}
template<typename T>
size_t buffer_size(std::vector<T>& v) {
    return v.size();
}

float mesh_size(Mesh& mesh) { 
    return mesh.aabb.diagonal().norm(); 
};
Vector3f mesh_center(Mesh& mesh) { 
    return mesh.aabb.center(); 
};

vector<float>* hexa_quality(App& app) {
    return &app.get_hexa_quality();
}

vector<Vector3f>* get_surface_vert_pos(Model& model) { return &model.surface_vert_pos; }
vector<Vector3f>* get_surface_vert_norm(Model& model) { return &model.surface_vert_norm; }
vector<Vector3f>* get_surface_vert_color(Model& model) { return &model.surface_vert_color; }
vector<Vector3f>* get_wireframe_vert_pos(Model& model) { return &model.wireframe_vert_pos; }
vector<Vector3f>* get_wireframe_vert_color(Model& model) { return &model.wireframe_vert_color; }

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;
EMSCRIPTEN_BINDINGS(HexaLab) {
	
    class_<App>("App")
        .constructor<>()
        .function("build_models", &App::build_models)
        .function("import_mesh", &App::import_mesh)
        .function("add_filter", &App::add_filter, allow_raw_pointers())
        .function("get_mesh", &App::get_mesh, allow_raw_pointers())
        .function("get_visible_model", &App::get_visible_model, allow_raw_pointers())
        .function("get_filtered_model", &App::get_filtered_model, allow_raw_pointers())
        .function("get_singularity_model", &App::get_singularity_model, allow_raw_pointers())
        .function("get_hexa_quality", &hexa_quality, allow_raw_pointers())
        ;

    class_<Model>("Model")
        .constructor<>()
        .property("dirty", &Model::dirty_flag)
        .function("surface_pos", &get_surface_vert_pos, allow_raw_pointers())
        .function("surface_norm", &get_surface_vert_norm, allow_raw_pointers())
        .function("surface_color", &get_surface_vert_color, allow_raw_pointers())
        .function("wireframe_pos", &get_wireframe_vert_pos, allow_raw_pointers())
        .function("wireframe_color", &get_wireframe_vert_color, allow_raw_pointers())
        ;

    class_<Mesh>("Mesh")
        .constructor<>()
        .function("get_size", &mesh_size)
        .function("get_center", &mesh_center)
        .property("min_edge_len", &Mesh::min_edge_len)
        .property("max_edge_len", &Mesh::max_edge_len)
        .property("avg_edge_len", &Mesh::avg_edge_len)
        ;

    class_<IFilter>("Filter")
        ;

    class_<PlaneFilter, base<IFilter>>("PlaneFilter")
        .constructor<>()
        .function("filter", &PlaneFilter::filter)
        .function("on_mesh_set", &PlaneFilter::on_mesh_set)
        .function("set_plane_normal", &PlaneFilter::set_plane_normal)
        .function("set_plane_offset", &PlaneFilter::set_plane_offset)
        .function("get_plane_normal", &PlaneFilter::get_plane_normal)
        .function("get_plane_offset", &PlaneFilter::get_plane_offset)
        .function("get_plane_world_offset", &PlaneFilter::get_plane_world_offset)
        ;

    class_<QualityFilter, base<IFilter>>("QualityFilter")
        .constructor<>()
        .function("filter", &QualityFilter::filter)
        .function("on_mesh_set", static_cast<void(QualityFilter::*)(Mesh&)>(&IFilter::on_mesh_set))
        .property("quality_threshold", &QualityFilter::quality_threshold)
        ;

    class_<Vector3f>("float3")
        .constructor<>()
        .function("x", static_cast<float&(Vector3f::*)()>(select_overload<float&()>(&Vector3f::x)))
        .function("y", static_cast<float&(Vector3f::*)()>(select_overload<float&()>(&Vector3f::y)))
        .function("z", static_cast<float&(Vector3f::*)()>(select_overload<float&()>(&Vector3f::z)))
        ;

    class_<vector<Vector3f>>("buffer3f")
        .constructor<>()
        .function("data", &buffer_data<Vector3f>)
        .function("size", &buffer_size<Vector3f>)
        ;

    class_<vector<float>>("buffer1f")
        .constructor<>()
        .function("data", &buffer_data<float>)
        .function("size", &buffer_size<float>)
        ;

}
#endif
