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
 *    |  P3----|--P2
 *    | /      | / 
 *    P0------P1
 * 
 */

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float diagonal_ratio(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                            const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    float diags[4] =
    {
      (p6 - p0).norm(),
      (p7 - p1).norm(),
      (p4 - p2).norm(),
      (p5 - p3).norm()
    };

    return *std::max_element(diags, diags + 4) / *std::min_element(diags, diags + 4);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float volume(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                    const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    return X1.dot(X2.cross(X3))/64.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float jacobian(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                      const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // edges
    Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
    Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
    Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
    Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    // normalized jacobian matrices determinants
    float alpha[9] =
    {
         L0.dot ( L3.cross ( L4) ),
         L1.dot (-L0.cross ( L5) ),
         L2.dot (-L1.cross ( L6) ),
        -L3.dot (-L2.cross ( L7) ),
         L11.dot( L8.cross (-L4) ),
        -L8.dot ( L9.cross (-L5) ),
        -L9.dot ( L10.cross(-L6) ),
        -L10.dot(-L11.cross(-L7) ),

        (X1.dot(X2.cross(X3)))/64.f
    };

    return *std::min_element(alpha, alpha + 9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float dimension(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                       const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    //TODO
    return -1;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float distortion(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                        const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // edges
    Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
    Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
    Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
    Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

    // normalized jacobian matrices determinants
    float alpha[8] =
    {
         L0.dot ( L3.cross ( L4) ),
         L1.dot (-L0.cross ( L5) ),
         L2.dot (-L1.cross ( L6) ),
        -L3.dot (-L2.cross ( L7) ),
         L11.dot( L8.cross (-L4) ),
        -L8.dot ( L9.cross (-L5) ),
        -L9.dot ( L10.cross(-L6) ),
        -L10.dot(-L11.cross(-L7) ),
    };

    float jacobian = *std::min_element(alpha, alpha + 8);

    return jacobian*8.0/volume(p0,p1,p2,p3,p4,p5,p6,p7);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float edge_ratio(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                        const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
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

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float maximum_edge_ratio(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                                const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    float lengths[3] =
    {
        X1.norm(),
        X2.norm(),
        X3.norm()
    };

    if (lengths[0] < std::numeric_limits<float>::min()||
        lengths[1] < std::numeric_limits<float>::min()||
        lengths[2] < std::numeric_limits<float>::min())
    {
        return std::numeric_limits<float>::max();
    }

    float max_ratios[3] =
    {
        std::max( lengths[0]/lengths[1] , lengths[1]/lengths[0] ),
        std::max( lengths[0]/lengths[2] , lengths[2]/lengths[0] ),
        std::max( lengths[1]/lengths[2] , lengths[2]/lengths[1] ),
    };

    return *std::max_element(max_ratios, max_ratios+3);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float maximum_aspect_frobenius(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                                      const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // TODO
    return 1.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float mean_aspect_frobenius(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                                   const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // TODO
    return 1.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float oddy(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                  const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // TODO
    return 0.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float relative_size_squared(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                                   const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7,
                                   const float avgV)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    float D = X1.dot(X2.cross(X3))/(64.f*avgV);

    if (avgV <  std::numeric_limits<float>::min() ||
           D <= std::numeric_limits<float>::min())
    {
        return 0;
    }

    return std::pow(std::min(D,1.f/D), 2);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float scaled_jacobian(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                             const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // edges
    Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
    Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
    Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
    Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

    // principal axes
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
        L0.dot ( L3.cross ( L4) ),
        L1.dot (-L0.cross ( L5) ),
        L2.dot (-L1.cross ( L6) ),
       -L3.dot (-L2.cross ( L7) ),
        L11.dot( L8.cross (-L4) ),
       -L8.dot ( L9.cross (-L5) ),
       -L9.dot ( L10.cross(-L6) ),
       -L10.dot(-L11.cross(-L7) ),
        X1.dot ( X2.cross ( X3) )
    };

    float msj = *std::min_element(alpha, alpha + 9);

    if (msj > 1.01) msj = -1.0;
    return msj;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float shape(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                   const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // edges
    Vector3f L0 = p1 - p0;    Vector3f L4 = p4 - p0;    Vector3f L8 = p5 - p4;
    Vector3f L1 = p2 - p1;    Vector3f L5 = p5 - p1;    Vector3f L9 = p6 - p5;
    Vector3f L2 = p3 - p2;    Vector3f L6 = p6 - p2;    Vector3f L10 = p7 - p6;
    Vector3f L3 = p3 - p0;    Vector3f L7 = p7 - p3;    Vector3f L11 = p7 - p4;

    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    // normalized jacobian matrices determinants
    float alpha[9] =
    {
        L0.dot ( L3.cross ( L4) ),
        L1.dot (-L0.cross ( L5) ),
        L2.dot (-L1.cross ( L6) ),
       -L3.dot (-L2.cross ( L7) ),
        L11.dot( L8.cross (-L4) ),
       -L8.dot ( L9.cross (-L5) ),
       -L9.dot ( L10.cross(-L6) ),
       -L10.dot(-L11.cross(-L7) ),
        X1.dot ( X2.cross ( X3) )
    };

    // normalized jacobian matrices determinants
    float A[9] =
    {
        L0.norm() *L0.norm()  + L3.norm() *L3.norm()  + L4.norm()*L4.norm(),
        L1.norm() *L1.norm()  + L0.norm() *L0.norm()  + L5.norm()*L5.norm(),
        L2.norm() *L2.norm()  + L1.norm() *L1.norm()  + L6.norm()*L6.norm(),
        L3.norm() *L3.norm()  + L2.norm() *L2.norm()  + L7.norm()*L7.norm(),
        L11.norm()*L11.norm() + L8.norm() *L8.norm()  + L4.norm()*L4.norm(),
        L8.norm() *L8.norm()  + L9.norm() *L9.norm()  + L5.norm()*L5.norm(),
        L9.norm() *L9.norm()  + L10.norm()*L10.norm() + L6.norm()*L6.norm(),
        L10.norm()*L10.norm() + L11.norm()*L11.norm() + L7.norm()*L7.norm(),
        X1.norm() *X1.norm()  + X2.norm() *X2.norm()  + X3.norm()*X3.norm()
    };

    for(int i=0; i<9; ++i)
    {
        if (alpha[i] <= std::numeric_limits<float>::min() ||
                A[i] <= std::numeric_limits<float>::min())
        {
            return 0;
        }
    }

    float shape[9];
    for(int i=0; i<9; ++i)
    {
        shape[i] = std::pow(alpha[i], 2.0/3.0) / A[i];
    }

    return 3.f * *std::min_element(shape, shape+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float shape_and_size(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                            const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7,
                            const float avgV)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,avgV) * shape(p0,p1,p2,p3,p4,p5,p6,p7);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float shear(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                   const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    float msj = scaled_jacobian(p0,p1,p2,p3,p4,p5,p6,p7);
    return std::max(msj,0.f);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float shear_and_size(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                            const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7,
                            const float avgV)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,avgV) * shear(p0,p1,p2,p3,p4,p5,p6,p7);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float skew(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                  const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    if (X1.norm() <= std::numeric_limits<float>::min()||
        X2.norm() <= std::numeric_limits<float>::min()||
        X3.norm() <= std::numeric_limits<float>::min())
    {
        return std::numeric_limits<float>::max();
    }

    X1.normalize();
    X2.normalize();
    X3.normalize();

    float skew[3] =
    {
        std::fabs( X1.dot(X2) ),
        std::fabs( X1.dot(X3) ),
        std::fabs( X2.dot(X3) ),
    };

    return *std::max_element(skew, skew + 3);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float stretch(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                     const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
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

    float diags[4] =
    {
      (p6 - p0).norm(),
      (p7 - p1).norm(),
      (p4 - p2).norm(),
      (p5 - p3).norm()
    };

    float Lmin  = *std::min_element(edges, edges + 12);
    float Dmax  = *std::min_element(diags, diags + 4);
    float sqrt3 = 1.732050807568877;

    return sqrt3 * (Lmin / Dmax);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float taper(const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, const Vector3f& p3,
                   const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, const Vector3f& p7)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    // cross derivatives
    Vector3f X12 = (p2 - p3) - (p1 - p0) + (p6 - p7) - (p5 - p4);
    Vector3f X13 = (p5 - p1) - (p4 - p0) + (p6 - p2) - (p7 - p3);
    Vector3f X23 = (p7 - p4) - (p3 - p0) + (p6 - p5) - (p2 - p1);

    float norm[3] =
    {
        X1.norm(),
        X2.norm(),
        X3.norm()
    };

    for(int i=0; i<3; ++i)
    {
        if (norm[i] < std::numeric_limits<float>::min())
        {
            return std::numeric_limits<float>::max();
        }
    }

    float T[3] =
    {
        X12.norm() / std::min(norm[0],norm[1]),
        X13.norm() / std::min(norm[0],norm[2]),
        X23.norm() / std::min(norm[1],norm[2])
    };

    return *std::max_element(T, T+3);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

} // end namespace

#endif // HEX_QUALITY_H
