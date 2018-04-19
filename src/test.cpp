#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>
#include <peeling_filter.h>
#include "json.hpp"
#include <fstream>

using namespace std;
using namespace HexaLab;
using json = nlohmann::json; // for json reading

int main() {    
  printf("Size of Hexa %lu\n",sizeof(Hexa));
  printf("Size of Face %lu\n",sizeof(Face));
  printf("Size of Edge %lu\n",sizeof(Edge));
  printf("Size of Vert %lu\n",sizeof(Vert));
  printf("Size of Dart %lu\n",sizeof(Dart));
  
  std::ifstream istr("../datasets/index.json");
  if(!istr.is_open()) {
    printf("Failing to opening dataset index"); 
    exit(-1);
  }
  json job;
  istr >> job;
  json srcVec=job["sources"];
  int meshCnt=0;
  int failCnt=0;
  for(size_t i=0;i<srcVec.size();i++)
  {
    printf("Dataset %lu %lu \n",i, srcVec[i]["paper"].size());
    json paper = srcVec[i]["paper"];
    string path = srcVec[i]["path"];
    string title = paper["title"];
    json dataVec= srcVec[i]["data"];
    printf("-- title %s\n",title.c_str());
    
    App app;
    for(size_t j=0;j<dataVec.size();++j)
    {
      ++meshCnt;
      string filename = dataVec[j];
      const string basepath="../datasets/";
      //bool ret = app.import_mesh("../datasets/Skeleton-driven Adaptive Hexahedral Meshing of Tubular Shapes/dinopet_graded.mesh");
      bool ret = app.import_mesh(basepath+path+"/"+filename);
      app.update_models();
      if (!ret) {
          ++failCnt;
      }
      PeelingFilter pf;
      pf.on_mesh_set(*app.get_mesh());
      
      fflush(stdout);
    }    
  }
  printf("%i meshes in the archive (%i fails to load)\n", meshCnt, failCnt);
  printf("Press enter to exit.\n");
  getchar();
}
