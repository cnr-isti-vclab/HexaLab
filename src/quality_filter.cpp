#include <quality_filter.h>

namespace HexaLab {
    void QualityFilter::filter(Mesh& mesh) {
        if (!this->enabled)
        	return;
        for (size_t i = 0; i < mesh.hexas.size(); ++i) {
        	//printf("%f\n", mesh.hexa_quality[i]);
            bool is_filtered;
        	switch(this->op) {
        	case Operator::Inside:
        		is_filtered = mesh.hexa_quality[i] < quality_threshold_min || mesh.hexa_quality[i] > quality_threshold_max;
        		break;
        	case Operator::Outside:
        		is_filtered = mesh.hexa_quality[i] > quality_threshold_min && mesh.hexa_quality[i] < quality_threshold_max;
        		break;
        	}
            if (is_filtered) {
                mesh.mark_hexa(mesh.hexas[i]);
            }
        }
    }
//    void QualityFilter::on_mesh_set(Mesh& _mesh) {
      
//      printf("QualityFilter %i %i on_mesh_set\n",_mesh.hexas.size(),HexaDepth.size());
//      mesh = &_mesh;
//      const size_t hn=this->mesh->hexas.size();
//      ScaledJacobian.clear();
//      ScaledJacobian.resize(hn,0);
//      for (auto i = 0; i < mesh->hexas.size(); ++i) {
//          ScaledJacobian[i];
//      }
      
      
      
    
}
