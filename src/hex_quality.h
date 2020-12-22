#pragma once

#include <vector>
#include <cmath>
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

#define HL_QUALITY_MEASURE_DEF(name) static float name (const Vector3f& p0, const Vector3f& p1, const Vector3f& p2, \
                                     const Vector3f& p3, const Vector3f& p4, const Vector3f& p5, const Vector3f& p6, \
                                     const Vector3f& p7, const void* arg)

typedef float (quality_measure_fun) (const Vector3f&, const Vector3f&, const Vector3f&, const Vector3f&, 
                                     const Vector3f&, const Vector3f&, const Vector3f&, const Vector3f&, 
                                     const void*);

namespace QualityMeasureFun {
/*
 * ATTENTION: All the metrics in this section are defined with the "irrational" order
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

inline
void norms(const Vector3f vec[], const int size, float norms[])
{
    for(int i=0; i<size; ++i) norms[i] = vec[i].norm();
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
void hex_edges(const Vector3f & p0, const Vector3f & p1, const Vector3f & p2, const Vector3f & p3,
               const Vector3f & p4, const Vector3f & p5, const Vector3f & p6, const Vector3f & p7,
               Vector3f L[], const bool normalized)
{
    L[0] = p1 - p0;    L[4] = p4 - p0;    L[8]  = p5 - p4;
    L[1] = p2 - p1;    L[5] = p5 - p1;    L[9]  = p6 - p5;
    L[2] = p3 - p2;    L[6] = p6 - p2;    L[10] = p7 - p6;
    L[3] = p3 - p0;    L[7] = p7 - p3;    L[11] = p7 - p4;

    if(normalized) for(int i=0; i<12; ++i) L[i].normalize();
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
void hex_principal_axes(const Vector3f & p0, const Vector3f & p1, const Vector3f & p2, const Vector3f & p3,
                        const Vector3f & p4, const Vector3f & p5, const Vector3f & p6, const Vector3f & p7,
                        Vector3f X[], const bool normalized)
{
    X[0] = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    X[1] = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    X[2] = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    if(normalized) for(int i=0; i<3; ++i) X[i].normalize();
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
void hex_cross_derivatives(const Vector3f & p0, const Vector3f & p1, const Vector3f & p2, const Vector3f & p3,
                           const Vector3f & p4, const Vector3f & p5, const Vector3f & p6, const Vector3f & p7,
                           Vector3f XX[], const bool normalized)
{
    XX[0] = (p2 - p3) - (p1 - p0) + (p6 - p7) - (p5 - p4); // X_01 and X_10
    XX[1] = (p5 - p1) - (p4 - p0) + (p6 - p2) - (p7 - p3); // X_02 and X_20
    XX[2] = (p7 - p4) - (p3 - p0) + (p6 - p5) - (p2 - p1); // X_12 and X_21

    if(normalized) for(int i=0; i<3; ++i) XX[i].normalize();
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
void hex_diagonals(const Vector3f & p0, const Vector3f & p1, const Vector3f & p2, const Vector3f & p3,
                   const Vector3f & p4, const Vector3f & p5, const Vector3f & p6, const Vector3f & p7,
                   Vector3f D[], const bool normalized)
{
    D[0] = p6 - p0;
    D[1] = p7 - p1;
    D[2] = p4 - p2;
    D[3] = p5 - p3;

    if(normalized) for(int i=0; i<4; ++i) D[i].normalize();
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
void hex_subtets(const Vector3f L[], const Vector3f X[], const int id, Vector3f tet[])
{
    switch(id)
    {
        case 0: tet[0]= L[0];  tet[1]= L[3];  tet[2]= L[4]; break;
        case 1: tet[0]= L[1];  tet[1]=-L[0];  tet[2]= L[5]; break;
        case 2: tet[0]= L[2];  tet[1]=-L[1];  tet[2]= L[6]; break;
        case 3: tet[0]=-L[3];  tet[1]=-L[2];  tet[2]= L[7]; break;
        case 4: tet[0]= L[11]; tet[1]= L[8];  tet[2]=-L[4]; break;
        case 5: tet[0]=-L[8];  tet[1]= L[9];  tet[2]=-L[5]; break;
        case 6: tet[0]=-L[9];  tet[1]= L[10]; tet[2]=-L[6]; break;
        case 7: tet[0]=-L[10]; tet[1]=-L[11]; tet[2]=-L[7]; break;
        case 8: tet[0]= X[0];  tet[1]= X[1];  tet[2]= X[2]; break;
    }
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
float determinant(const Vector3f & col0, const Vector3f & col1, const Vector3f & col2)
{
    return col0.dot(col1.cross(col2));
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

inline
float frobenius(const Vector3f & col0, const Vector3f & col1, const Vector3f & col2)
{
    float det = determinant(col0, col1, col2);
    if(det <= std::numeric_limits<float>::min()) return std::numeric_limits<float>::max();

    float term1 = col0.dot(col0) + col1.dot(col1) + col2.dot(col2);
    float term2 = (col0.cross(col1)).dot(col0.cross(col1)) +
                   (col1.cross(col2)).dot(col1.cross(col2)) +
                   (col2.cross(col0)).dot(col2.cross(col0));
    float frob  = sqrt(term1*term2)/det;
    return frob/3.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(diagonal)
{
    Vector3f D[4];
    float    D_norms[4];
    hex_diagonals(p0, p1, p2, p3, p4, p5, p6, p7, D, false);
    norms(D, 4, D_norms);
    return *std::min_element(D_norms, D_norms+4) / *std::max_element(D_norms, D_norms+4);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(dimension)
{
    return -1;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(distortion)
{
    return -1;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(edge_ratio)
{
    Vector3f L[12];
    float    L_norms[12];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    norms(L, 12, L_norms);
    return *std::max_element(L_norms, L_norms+12) / *std::min_element(L_norms, L_norms+12);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(jacobian)
{
    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);

    float sj[9];
    for(int i=0; i<9; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        sj[i] = determinant(tet[0], tet[1], tet[2]);
    }
    sj[8]/=64.0;
    return *std::min_element(sj,sj+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(maximum_edge_ratio)
{
    Vector3f X[3];
    float    X_norms[3];
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);
    norms(X, 3, X_norms);

    if (X_norms[0] < std::numeric_limits<float>::min()||
        X_norms[1] < std::numeric_limits<float>::min()||
        X_norms[2] < std::numeric_limits<float>::min())
    {
        return std::numeric_limits<float>::max();
    }

    float max_ratios[3] =
    {
        std::max(X_norms[0]/X_norms[1] , X_norms[1]/X_norms[0]),
        std::max(X_norms[0]/X_norms[2] , X_norms[2]/X_norms[0]),
        std::max(X_norms[1]/X_norms[2] , X_norms[2]/X_norms[1]),
    };

    return *std::max_element(max_ratios, max_ratios+3);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(maximum_aspect_frobenius)
{
    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);

    float frob[8];
    for(int i=0; i<8; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        frob[i] = frobenius(tet[0], tet[1], tet[2]);
        if(frob[i]==std::numeric_limits<float>::max()) return frob[i];
    }
    return *std::max_element(frob, frob+8);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(mean_aspect_frobenius)
{
    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);

    float frob = 0;
    for(int i=0; i<8; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        frob += frobenius(tet[0], tet[1], tet[2]);
    }
    return frob/8.0;}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(oddy)
{
    static float four_over_three = 4.0/3.0;

    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);

    float oddy[9];
    for(int i=0; i<9; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        float det = determinant(tet[0], tet[1], tet[2]);

        if(det > std::numeric_limits<float>::min())
        {
            float a11 = tet[0].dot(tet[0]);
            float a12 = tet[0].dot(tet[1]);
            float a13 = tet[0].dot(tet[2]);
            float a22 = tet[1].dot(tet[1]);
            float a23 = tet[1].dot(tet[2]);
            float a33 = tet[2].dot(tet[2]);

            float AtA_sqrd = a11*a11 + 2.0*a12*a12 + 2.0*a13*a13 + a22*a22 + 2.0*a23*a23 +a33*a33;
            float A_sqrd   = a11 + a22 + a33;

            oddy[i] = (AtA_sqrd - A_sqrd*A_sqrd/3.0) / pow(det,four_over_three);
        }
        else return std::numeric_limits<float>::max();
    }
    return *std::max_element(oddy,oddy+9);}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(relative_size_squared)
{
    float avgV = *(float*)arg;

    Vector3f X[3];
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);
    float D = determinant(X[0], X[1], X[2]) / (64.0*avgV);

    if(avgV<=std::numeric_limits<float>::min() || D<=std::numeric_limits<float>::min()) return 0;
    return std::pow(std::min(D, 1.f/D), 2);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(scaled_jacobian)
{
    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, true);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, true);

    float sj[9];
    for(int i=0; i<9; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        sj[i] = determinant(tet[0], tet[1], tet[2]);
    }
    float msj = *std::min_element(sj, sj+9);
    if(msj > 1.0001) return -1.0;
    return msj;}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shape)
{
    static float two_over_three = 2.0/3.0;

    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);

    float shape[9];
    for(int i=0; i<9; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        float det = determinant(tet[0], tet[1], tet[2]);
        if(det<=std::numeric_limits<float>::min()) return 0;
        float num = pow(det, two_over_three);
        float den = tet[0].dot(tet[0]) + tet[1].dot(tet[1]) + tet[2].dot(tet[2]);
        if(den<=std::numeric_limits<float>::min()) return 0;
        shape[i] = 3.0 * num/den;
    }
    return *std::min_element(shape, shape+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shape_and_size)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,arg) *
           shape(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shear)
{
    Vector3f L[12];
    Vector3f X[3];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, true);
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, true);

    float shear[9];
    for(int i=0; i<9; ++i)
    {
        Vector3f tet[3];
        hex_subtets(L, X, i, tet);
        shear[i] = determinant(tet[0], tet[1], tet[2]);
        if(shear[i]<=std::numeric_limits<float>::min()) return 0;
    }
    return *std::min_element(shear, shear+9);}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shear_and_size)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,arg) *
           shear(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(skew)
{
    Vector3f X[3];
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, true);

    if(X[0].norm() <= std::numeric_limits<float>::min()) return 0;
    if(X[1].norm() <= std::numeric_limits<float>::min()) return 0;
    if(X[2].norm() <= std::numeric_limits<float>::min()) return 0;

    float skew[3] =
    {
        std::fabs(X[0].dot(X[1])),
        std::fabs(X[0].dot(X[2])),
        std::fabs(X[1].dot(X[2]))
    };

    return *std::max_element(skew,skew+3);}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(stretch)
{
    static float sqrt3 = 1.732050807568877f;

    Vector3f L[12];
    float    L_norms[12];
    hex_edges(p0, p1, p2, p3, p4, p5, p6, p7, L, false);
    norms(L, 12, L_norms);

    Vector3f D[4];
    float    D_norms[4];
    hex_diagonals(p0, p1, p2, p3, p4, p5, p6, p7, D, false);
    norms(D, 4, D_norms);

    return sqrt3 * *std::min_element(L_norms, L_norms+12) /
                   *std::max_element(D_norms, D_norms+4);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(taper)
{
    Vector3f X[3];
    Vector3f XX[3];
    float    X_norms[3];
    float    XX_norms[3];
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);
    hex_cross_derivatives(p0, p1, p2, p3, p4, p5, p6, p7, XX, false);
    norms(X, 3, X_norms);
    norms(XX, 3, XX_norms);

    if(X_norms[0] <= std::numeric_limits<float>::min()) return std::numeric_limits<float>::max();
    if(X_norms[1] <= std::numeric_limits<float>::min()) return std::numeric_limits<float>::max();
    if(X_norms[2] <= std::numeric_limits<float>::min()) return std::numeric_limits<float>::max();

    float taper[3] =
    {
        XX_norms[0] / std::min(X_norms[0], X_norms[1]),
        XX_norms[1] / std::min(X_norms[0], X_norms[2]),
        XX_norms[2] / std::min(X_norms[1], X_norms[2]),
    };

    return *std::max_element(taper, taper+3);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(volume)
{
    Vector3f X[3];
    hex_principal_axes(p0, p1, p2, p3, p4, p5, p6, p7, X, false);
    return determinant(X[0],X[1],X[2])/64.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

}
} // end namespace
