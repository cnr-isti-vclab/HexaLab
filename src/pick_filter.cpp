#include <pick_filter.h>

#include <float.h>
#include <math.h>

#define HL_PICK_FILTER_DEFAULT_ENABLED true

namespace HexaLab {
    void PickFilter::filter(Mesh& mesh) {
        if (!this->enabled)
            return;
        
        HL_ASSERT(this->mesh == &mesh);

        for (size_t i = 0; i < this->filtered_hexas.size(); ++i) {
            mesh.mark(mesh.hexas[this->filtered_hexas[i]]);
        }
    }

    void PickFilter::on_mesh_set(Mesh& mesh) {
        this->enabled = HL_PICK_FILTER_DEFAULT_ENABLED;
        this->mesh = &mesh;
        this->filtered_hexas.clear();
    }

    Index PickFilter::filter_hexa(Vector3f origin, Vector3f direction) {
        float  min_t = FLT_MAX;
        size_t min_i = SIZE_MAX;
        for (size_t i = 0; i < this->mesh->hexas.size(); ++i) {
            if (this->mesh->is_marked(this->mesh->hexas[i])) continue;
            float _min_t, _max_t;
            if (this->hexa_ray_test(this->mesh->hexas[i], origin, direction, &_min_t, &_max_t)) {
                if (min_t > _min_t) {
                    min_t = _min_t;
                    min_i = i;
                }
            }
        }
        if (min_i != SIZE_MAX) {
            HL_LOG("[Pick Filter]: Closest raycast intersection with hexa %d\n", min_i);
            this->filtered_hexas.push_back(min_i);
            std::sort(this->filtered_hexas.begin(), this->filtered_hexas.end());
            return min_i;
        } else {
            HL_LOG("[Pick Filter]: Raycast miss\n");
        }
        return -1;
    }

    void PickFilter::filter_hexa_idx(Index idx) {
        this->filtered_hexas.push_back(idx);
        std::sort(this->filtered_hexas.begin(), this->filtered_hexas.end());
    }

    Index PickFilter::unfilter_hexa(Vector3f origin, Vector3f direction) {
        float  max_t = -FLT_MAX;
        size_t max_i = SIZE_MAX;
        for (size_t i = 0; i < this->mesh->hexas.size(); ++i) {
            if (!this->mesh->is_marked(this->mesh->hexas[i])) continue;
            float _min_t, _max_t;
            if (this->hexa_ray_test(this->mesh->hexas[i], origin, direction, &_min_t, &_max_t)) {
                if (max_t < _max_t) {
                    max_t = _max_t;
                    max_i = i;
                }
            }
        }
        if (max_i != SIZE_MAX) {
            HL_LOG("[Pick Filter]: Farthest raycast intersection with hexa %d\n", max_i);
            this->filtered_hexas.erase(std::find(this->filtered_hexas.begin(), this->filtered_hexas.end(), max_i));
            return max_i;
        } else {
            HL_LOG("[Pick Filter]: Raycast miss\n");
        }
        return -1;
    }

// floating point comparison that should account for floating point error
#define CMP(x, y) (fabsf(x - y) <= FLT_EPSILON * fmaxf(1.0f, fmaxf(fabsf(x), fabsf(y))))

    bool PickFilter::hexa_ray_test(Hexa& hexa, Vector3f origin, Vector3f direction, float* _min_t, float* _max_t) {
        // Extract the face planes
        struct {
            Vector3f norm;
            Dart* dart;
        } planes[6];
        MeshNavigator nav = this->mesh->navigate(hexa);
        Face& face = nav.face();
        for (size_t f = 0; f < 6; ++f) {
            MeshNavigator n2 = this->mesh->navigate(nav.face());
            float normal_sign;
            if (n2.hexa() == nav.hexa()) {
                normal_sign = 1;
            } else {
                normal_sign = -1;
                n2 = n2.flip_hexa().flip_edge();
            }
            planes[f].norm = n2.face().normal * normal_sign;
            planes[f].dart = &n2.dart();
            nav = nav.next_hexa_face();
        }

        float min_t = FLT_MAX;
        float max_t = -FLT_MAX;
        bool miss = true;

        for (size_t i = 0; i < 6; ++i) {
            // Compute intersection point with the plane
            float d = direction.dot(planes[i].norm);
            if (CMP(d, 0.f)) continue;    // ray parallel to plane
            MeshNavigator nav = this->mesh->navigate(*planes[i].dart);
            Vector3f a = nav.vert().position - origin;
            float b = a.dot(planes[i].norm);
            float t = b / d;
            if (t < 0) continue;    // the intersection happens behind the origin (with respect to direction)
            Vector3f p = origin + direction * t;
            // Inside-outside the face test
            bool inside = true;
            for (size_t j = 0; j < 4; ++j) {
                Vector3f v0 = nav.vert().position;
                nav = nav.rotate_on_face();
                Vector3f v1 = nav.vert().position;
                Vector3f e = v1 - v0;
                Vector3f c = p - v0;
                if ( planes[i].norm.dot( e.cross( c ) ) < 0 ) {
                    inside = false;
                    break;
                }
            }
            if (!inside) continue;

            miss = false;
            if (min_t > t) min_t = t;
            if (max_t < t) max_t = t;
        }

        if (miss) return false;

        *_min_t = min_t;
        *_max_t = max_t;

        return true;
    }
}