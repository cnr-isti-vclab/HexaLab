#include <app.h>
#include <plane_filter.h>
#include <quality_filter.h>
#include "json.hpp"
#include <fstream>

using namespace std;
using namespace HexaLab;
using json = nlohmann::json; // for json reading

int main() {    
  std::ifstream istr("../datasets/index.json");
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
    
    for(size_t j=0;j<dataVec.size();++j)
    {
      ++meshCnt;
      string filename = dataVec[j];
      App app;
      string basepath="../datasets/";
      bool ret = app.import_mesh(basepath+path+"/"+filename);
      if(!ret) ++failCnt;
    }    
  }
  printf("%i meshes in the archive (%i fails to load)\n",meshCnt,failCnt);
}
