#ifndef HEX_QUALITY_H
#define HEX_QUALITY_H

#include <vector>
#include <algorithm>
#include <Eigen/Dense>

/**
 * This file want to act as an include-only, minimal dependency (only eigen) replacement for the well known 
 * Sandia Verdict Geometric Quality Library 
 * See:
 * 
 *      Stimpson, C. J., Ernst, C. D., Knupp, P., Pébay, P. P., & Thompson, D. (2007). 
 *      The Verdict library reference manual. 
 *      Sandia National Laboratories Technical Report, 9.
 */

namespace HexaLab {
using namespace Eigen;
using namespace std;
/*
 * All the metrics in this section are defined on a hexahedral element as shown
 * 
 *       P7------P6
 *      / |     / |
 *    P4------P5  |
 *    |   |    |  |
 *    |  P3 -- |  P2
 *    | /      | / 
 *    P0------P1
 * 
 */
 
static float scaled_jacobian(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
    const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7) {
    // edges
    Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
    Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
    Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
    Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

    // cross-derivatives
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    L0.normalize();     L4.normalize();     L8.normalize();
    L1.normalize();     L5.normalize();     L9.normalize();
    L2.normalize();     L6.normalize();     L10.normalize();
    L3.normalize();     L7.normalize();     L11.normalize();
    X1.normalize();     X2.normalize();     X3.normalize();

    // normalized jacobian matrices determinants
    float alpha[9] =
    {
        L0.dot(L3.cross(L4)),
        L1.dot(-L0.cross(L5)),
        L2.dot(-L1.cross(L6)),
        -L3.dot(-L2.cross(L7)),
        L11.dot(L8.cross(-L4)),
        -L8.dot(L9.cross(-L5)),
        -L9.dot(L10.cross(-L6)),
        -L10.dot(-L11.cross(-L7)),
        X1.dot(X2.cross(X3))
    };

    float msj = *std::min_element(alpha, alpha + 9);

    if (msj > 1.01) 
      msj = -1.0;
    return msj;
}

static float diagonal_ratio(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
    const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7) {
  
  float diags[4] = 
  { 
    (p6 - p0).norm(),
    (p7 - p1).norm(),
    (p4 - p2).norm(),
    (p5 - p3).norm()
  };

  return *std::max_element(diags, diags + 4)/ *std::min_element(diags, diags + 4);
}

static float edge_ratio(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                            const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7) {
  float edges[12] = 
  { 
    (p1 - p0).norm(), 
    (p2 - p1).norm(), 
    (p3 - p2).norm(), 
    (p0 - p3).norm(), 
    
    (p4 - p0).norm(),
    (p5 - p1).norm(),
    (p6 - p2).norm(),
    (p7 - p3).norm(),
    
    (p5 - p4).norm(),
    (p6 - p5).norm(),
    (p7 - p6).norm(),
    (p4 - p7).norm() 
  };

  return *std::max_element(edges, edges + 12)/ *std::min_element(edges, edges + 12);
}

} // end namespace

#endif // HEX_QUALITY_H
