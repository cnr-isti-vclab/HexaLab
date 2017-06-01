#include <common.h>
#include <mesh.h>
#include <loader.h>
#include <builder.h>
#include <app.h>
#include <plane_filter.h>

#include <eigen/dense>
#include <eigen/geometry>

using namespace HexaLab;

using namespace std;
using namespace Eigen;

int main() {
    App app;
    
    PlaneFilter* p = new PlaneFilter();
    app.add_filter(p);

    app.import_mesh("data/Block.mesh");
    app.build_models();

    p->set_plane_offset(0.9);
    auto f = p->get_plane_world_offset();

    getchar();
}
