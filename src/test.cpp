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
    printf ( "Size of Hexa %lu\n", sizeof ( Cell ) );
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
    std::string minMeshName, maxMeshName;
    int failCnt = 0;
    App app;
    for ( size_t i = 0; i < paperArrayJSON.size(); i++ ) {
//    { size_t i= 9;
        printf ( "Dataset %lu %lu \n", i, paperArrayJSON[i]["paper"].size() );
        json paper = paperArrayJSON[i]["paper"];
        string path = paperArrayJSON[i]["path"];
        string title = paper["title"];
        json dataVec = paperArrayJSON[i]["data"];
        printf ( "-- title %s\n", title.c_str() );

      for ( size_t j = 0; j < dataVec.size(); ++j ) {
//        { size_t j= 2;
            printf ("Mesh %lu/%lu on dataset %lu/%lu\n",j+1,dataVec.size(),i+1,paperArrayJSON.size());fflush ( stdout );
            ++meshCnt;
            string filename = dataVec[j];
            const string basepath = "../datasets/";
            app.set_quality_measure( QualityMeasureEnum::SJ );
            bool ret = app.import_mesh ( basepath + path + "/" + filename );
            if(!ret) {
              failCnt++;
              meshCnt--;
              printf("\n\n ************** FAILURE ***************\n in loading mesh  %s\n\n",filename.c_str());
            }
            printf("     Hex %4lu\n",app.get_mesh()->cells.size());fflush ( stdout );
            if(hexMin>app.get_mesh()->cells.size()) {
              hexMin=app.get_mesh()->cells.size();
              minMeshName= basepath + path + "/" + filename;
            } 
            if(hexMax<app.get_mesh()->cells.size()) {
              hexMax=app.get_mesh()->cells.size();
              maxMeshName= basepath + path + "/" + filename;
            }
            hexMax=std::max(hexMax,app.get_mesh()->cells.size());
            //app.set_quality_measure( QualityMeasureEnum::ODD );
            fflush ( stdout );
        }
    }

    printf ( "%i meshes in the archive (%i fails to load)\n", meshCnt, failCnt );
    printf ( "Range of Meshes\n"
             "   Min %10lu hex (%s) \n"
             "   Max %10lu hex (%s) \n", hexMin, minMeshName.c_str(),hexMax,maxMeshName.c_str());
    printf ( "Press enter to exit.\n" );
}
