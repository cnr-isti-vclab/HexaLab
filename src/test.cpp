#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>

using namespace std;
using namespace Eigen;
using namespace HexaLab;

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
