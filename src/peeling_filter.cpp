#include <peeling_filter.h>

namespace HexaLab {
    void PeelingFilter::filter(Mesh& _mesh) 
    {       
      if (!this->enabled)
          return;
      assert(_mesh.hexas.size()==HexaDepth.size());
      for (unsigned int i = 0; i < _mesh.hexas.size(); ++i) {
          if(HexaDepth[i] < this->depth_threshold)
            _mesh.mark_hexa(_mesh.hexas[i]);
      }
    }
    
    void PeelingFilter::on_mesh_set(Mesh& _mesh) {
      
      printf("PeelingFilter %i %i on_mesh_set\n",_mesh.hexas.size(),HexaDepth.size());
      mesh = &_mesh;
      const size_t hn=this->mesh->hexas.size();
      HexaDepth.clear();
      HexaDepth.resize(hn,-1);
      vector<int> toBeProcessed,toBeProcessedNext;
      for(size_t i=0;i<mesh->faces.size();++i)
      {
        if(mesh->navigate(mesh->faces[i]).is_face_boundary())
          HexaDepth[mesh->navigate(mesh->faces[i]).hexa_index()]=0;
      }
      
      for(size_t i=0;i<hn;++i) 
        if (HexaDepth[i]<0)
          toBeProcessed.push_back(i);
      int curDepth=0;
      while(!toBeProcessed.empty())
      {
        curDepth++;
        toBeProcessedNext.clear();
        for(int i:toBeProcessed)
        {
          auto navStart = mesh->navigate(mesh->hexas[i]);
          assert(HexaDepth[i]==-1);
          int minInd=std::numeric_limits<int>::max();
          auto nav=navStart;
          int faceCnt=0;
          do {
            faceCnt++;
            assert(!nav.is_face_boundary());            
            int otherDepth = HexaDepth[nav.flip_hexa().hexa_index()];
            assert(otherDepth == -1 || otherDepth<=curDepth);
            if(otherDepth>=0 && otherDepth < curDepth && otherDepth<minInd) minInd=otherDepth;            
            nav=nav.next_hexa_face();
          } while(!(nav==navStart));
          assert(faceCnt==6);
          if(minInd < std::numeric_limits<int>::max())
            HexaDepth[i]=minInd+1;
          else 
            toBeProcessedNext.push_back(i);                      
        }
        std::swap(toBeProcessed,toBeProcessedNext); 
      }
      this->max_depth = curDepth;
      if (this->depth_threshold > curDepth) 
        this->depth_threshold = curDepth;
      printf("Max Depth %i ",curDepth);
      for(size_t i=0;i<hn;++i) { 
        assert (HexaDepth[i]>=0); 
      }
    }
    
};

