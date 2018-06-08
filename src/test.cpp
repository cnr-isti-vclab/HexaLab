#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>
#include <peeling_filter.h>
#include <pick_filter.h>
#include "json.hpp"
#include <fstream>

using namespace std;
using namespace HexaLab;
using json = nlohmann::json; // for json reading

int main() {
    printf ( "Size of Hexa %lu\n", sizeof ( Hexa ) );
    printf ( "Size of Face %lu\n", sizeof ( Face ) );
    printf ( "Size of Edge %lu\n", sizeof ( Edge ) );
    printf ( "Size of Vert %lu\n", sizeof ( Vert ) );
    printf ( "Size of Dart %lu\n", sizeof ( Dart ) );
    
    // Testing all the meshes in the repository:
    // The repository is indexed by a JSON that contains an array named 'sources' that contains papers. 
    // each paper has a 'data' that is an array of mesh names; 
    
    std::ifstream istr ( "../datasets/index.json" );
    if ( !istr.is_open() ) {
        printf ( "Failing to opening dataset index" );
        exit ( -1 );
    }

    json repositoryJSON;
    istr >> repositoryJSON;
    json paperArrayJSON = repositoryJSON["sources"];
    int meshCnt = 0;
    size_t hexMin= UINT_MAX;
    size_t hexMax = 0;
    int failCnt = 0;
    App app;

    for ( size_t i = 0; i < paperArrayJSON.size(); i++ ) {
//      for ( size_t i = 0; i < 1; i++ ) {
        printf ( "Dataset %lu %lu \n", i, paperArrayJSON[i]["paper"].size() );
        json paper = paperArrayJSON[i]["paper"];
        string path = paperArrayJSON[i]["path"];
        string title = paper["title"];
        json dataVec = paperArrayJSON[i]["data"];
        printf ( "-- title %s\n", title.c_str() );

        for ( size_t j = 0; j < dataVec.size(); ++j ) {
            printf ("Mesh %lu/%lu on dataset %lu/%lu\n",j+1,dataVec.size(),i+1,paperArrayJSON.size());
            ++meshCnt;
            string filename = dataVec[j];
            const string basepath = "../datasets/";
            bool ret = app.import_mesh ( basepath + path + "/" + filename );
            printf("     Hex %4lu\n",app.get_mesh()->hexas.size());
            hexMin=std::min(hexMin,app.get_mesh()->hexas.size());
            hexMax=std::max(hexMax,app.get_mesh()->hexas.size());
//            app.set_geometry_mode(GeometryMode::Smooth);
//            app.update_models();
            
            if ( !ret ) {
                ++failCnt;
            }

//            PeelingFilter pf;
//            pf.on_mesh_set ( *app.get_mesh() );
           
            fflush ( stdout );
        }
    }

    printf ( "%i meshes in the archive (%i fails to load)\n", meshCnt, failCnt );
    printf ( "Range %lu - %lu\n", hexMin,hexMax);
    printf ( "Press enter to exit.\n" );
}
