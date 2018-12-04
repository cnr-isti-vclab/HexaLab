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

inline float matrix_norm(Eigen::Matrix3Xf A, double to_the_power_of)
{
    return pow(A.col(0).norm(), to_the_power_of) +
           pow(A.col(1).norm(), to_the_power_of) +
           pow(A.col(2).norm(), to_the_power_of);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(diagonal)
{
    float diags[4] =
    {
      (p6 - p0).norm(),
      (p7 - p1).norm(),
      (p4 - p2).norm(),
      (p5 - p3).norm()
    };

    return *std::min_element(diags, diags + 4) / *std::max_element(diags, diags + 4);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(volume)
{
    // principal axes
    Vector3f X1 = (p1 - p0) + (p2 - p3) + (p5 - p4) + (p6 - p7);
    Vector3f X2 = (p3 - p0) + (p2 - p1) + (p7 - p4) + (p6 - p5);
    Vector3f X3 = (p4 - p0) + (p5 - p1) + (p6 - p2) + (p7 - p3);

    return X1.dot(X2.cross(X3))/64.f;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(jacobian)
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

HL_QUALITY_MEASURE_DEF(dimension)
{
    //TODO
    return -1;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(distortion)
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

    return jacobian*8.f/volume(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(edge_ratio)
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

HL_QUALITY_MEASURE_DEF(maximum_edge_ratio)
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

HL_QUALITY_MEASURE_DEF(maximum_aspect_frobenius)
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

    // jacobian matrices determinants
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

    Eigen::Matrix3f A[9];
    // A0
    A[0](0,0) = L0[0];  A[0](0,1) = L3[1];  A[0](0,2) = L4[2];
    A[0](1,0) = L0[0];  A[0](1,1) = L3[1];  A[0](1,2) = L4[2];
    A[0](2,0) = L0[0];  A[0](2,1) = L3[1];  A[0](2,2) = L4[2];
    // A1
    A[1](0,0) = L1[0];  A[1](0,1) =-L0[1];  A[1](0,2) = L5[2];
    A[1](1,0) = L1[0];  A[1](1,1) =-L0[1];  A[1](1,2) = L5[2];
    A[1](2,0) = L1[0];  A[1](2,1) =-L0[1];  A[1](2,2) = L5[2];
    // A2
    A[2](0,0) = L2[0];  A[2](0,1) =-L1[1];  A[2](0,2) = L6[2];
    A[2](1,0) = L2[0];  A[2](1,1) =-L1[1];  A[2](1,2) = L6[2];
    A[2](2,0) = L2[0];  A[2](2,1) =-L1[1];  A[2](2,2) = L6[2];
    // A3
    A[3](0,0) =-L3[0];  A[3](0,1) =-L2[1];  A[3](0,2) = L7[2];
    A[3](1,0) =-L3[0];  A[3](1,1) =-L2[1];  A[3](1,2) = L7[2];
    A[3](2,0) =-L3[0];  A[3](2,1) =-L2[1];  A[3](2,2) = L7[2];
    // A4
    A[4](0,0) = L11[0]; A[4](0,1) = L8[1];  A[4](0,2) =-L4[2];
    A[4](1,0) = L11[0]; A[4](1,1) = L8[1];  A[4](1,2) =-L4[2];
    A[4](2,0) = L11[0]; A[4](2,1) = L8[1];  A[4](2,2) =-L4[2];
    // A5
    A[5](0,0) =-L8[0];  A[5](0,1) = L9[1];  A[5](0,2) =-L5[2];
    A[5](1,0) =-L8[0];  A[5](1,1) = L9[1];  A[5](1,2) =-L5[2];
    A[5](2,0) =-L8[0];  A[5](2,1) = L9[1];  A[5](2,2) =-L5[2];
    // A6
    A[6](0,0) =-L9[0];  A[6](0,1) = L10[1]; A[6](0,2) =-L6[2];
    A[6](1,0) =-L9[0];  A[6](1,1) = L10[1]; A[6](1,2) =-L6[2];
    A[6](2,0) =-L9[0];  A[6](2,1) = L10[1]; A[6](2,2) =-L6[2];
    // A7
    A[7](0,0) =-L10[0]; A[7](0,1) =-L11[1]; A[7](0,2) =-L7[2];
    A[7](1,0) =-L10[0]; A[7](1,1) =-L11[1]; A[7](1,2) =-L7[2];
    A[7](2,0) =-L10[0]; A[7](2,1) =-L11[1]; A[7](2,2) =-L7[2];
    // A8
    A[8](0,0) = X1[0];  A[8](0,1) = X2[1];  A[8](0,2) = X3[2];
    A[8](1,0) = X1[0];  A[8](1,1) = X2[1];  A[8](1,2) = X3[2];
    A[8](2,0) = X1[0];  A[8](2,1) = X2[1];  A[8](2,2) = X3[2];

    float k[9];
    for(int i=0; i<9; ++i)
    {
        if (alpha[i] <= std::numeric_limits<float>::min())
        {
            return std::numeric_limits<float>::max();
        }
        k[i] = matrix_norm(A[i],1) * matrix_norm(A[i].inverse(),1);
    }
    return 1./3. * *std::max_element(k,k+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(mean_aspect_frobenius)
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

    // jacobian matrices determinants
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

    Eigen::Matrix3f A[9];
    // A0
    A[0](0,0) = L0[0];  A[0](0,1) = L3[1];  A[0](0,2) = L4[2];
    A[0](1,0) = L0[0];  A[0](1,1) = L3[1];  A[0](1,2) = L4[2];
    A[0](2,0) = L0[0];  A[0](2,1) = L3[1];  A[0](2,2) = L4[2];
    // A1
    A[1](0,0) = L1[0];  A[1](0,1) =-L0[1];  A[1](0,2) = L5[2];
    A[1](1,0) = L1[0];  A[1](1,1) =-L0[1];  A[1](1,2) = L5[2];
    A[1](2,0) = L1[0];  A[1](2,1) =-L0[1];  A[1](2,2) = L5[2];
    // A2
    A[2](0,0) = L2[0];  A[2](0,1) =-L1[1];  A[2](0,2) = L6[2];
    A[2](1,0) = L2[0];  A[2](1,1) =-L1[1];  A[2](1,2) = L6[2];
    A[2](2,0) = L2[0];  A[2](2,1) =-L1[1];  A[2](2,2) = L6[2];
    // A3
    A[3](0,0) =-L3[0];  A[3](0,1) =-L2[1];  A[3](0,2) = L7[2];
    A[3](1,0) =-L3[0];  A[3](1,1) =-L2[1];  A[3](1,2) = L7[2];
    A[3](2,0) =-L3[0];  A[3](2,1) =-L2[1];  A[3](2,2) = L7[2];
    // A4
    A[4](0,0) = L11[0]; A[4](0,1) = L8[1];  A[4](0,2) =-L4[2];
    A[4](1,0) = L11[0]; A[4](1,1) = L8[1];  A[4](1,2) =-L4[2];
    A[4](2,0) = L11[0]; A[4](2,1) = L8[1];  A[4](2,2) =-L4[2];
    // A5
    A[5](0,0) =-L8[0];  A[5](0,1) = L9[1];  A[5](0,2) =-L5[2];
    A[5](1,0) =-L8[0];  A[5](1,1) = L9[1];  A[5](1,2) =-L5[2];
    A[5](2,0) =-L8[0];  A[5](2,1) = L9[1];  A[5](2,2) =-L5[2];
    // A6
    A[6](0,0) =-L9[0];  A[6](0,1) = L10[1]; A[6](0,2) =-L6[2];
    A[6](1,0) =-L9[0];  A[6](1,1) = L10[1]; A[6](1,2) =-L6[2];
    A[6](2,0) =-L9[0];  A[6](2,1) = L10[1]; A[6](2,2) =-L6[2];
    // A7
    A[7](0,0) =-L10[0]; A[7](0,1) =-L11[1]; A[7](0,2) =-L7[2];
    A[7](1,0) =-L10[0]; A[7](1,1) =-L11[1]; A[7](1,2) =-L7[2];
    A[7](2,0) =-L10[0]; A[7](2,1) =-L11[1]; A[7](2,2) =-L7[2];
    // A8
    A[8](0,0) = X1[0];  A[8](0,1) = X2[1];  A[8](0,2) = X3[2];
    A[8](1,0) = X1[0];  A[8](1,1) = X2[1];  A[8](1,2) = X3[2];
    A[8](2,0) = X1[0];  A[8](2,1) = X2[1];  A[8](2,2) = X3[2];

    float q=0.0;
    for(int i=0; i<9; ++i)
    {
        if (alpha[i] <= std::numeric_limits<float>::min())
        {
            return std::numeric_limits<float>::max();
        }
        q += matrix_norm(A[i],1) * matrix_norm(A[i].inverse(),1);
    }
    return q/8.0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(oddy)
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

    // jacobian matrices determinants
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

    Eigen::Matrix3f A[9];
    // A0
    A[0](0,0) = L0[0];  A[0](0,1) = L3[1];  A[0](0,2) = L4[2];
    A[0](1,0) = L0[0];  A[0](1,1) = L3[1];  A[0](1,2) = L4[2];
    A[0](2,0) = L0[0];  A[0](2,1) = L3[1];  A[0](2,2) = L4[2];
    // A1
    A[1](0,0) = L1[0];  A[1](0,1) =-L0[1];  A[1](0,2) = L5[2];
    A[1](1,0) = L1[0];  A[1](1,1) =-L0[1];  A[1](1,2) = L5[2];
    A[1](2,0) = L1[0];  A[1](2,1) =-L0[1];  A[1](2,2) = L5[2];
    // A2
    A[2](0,0) = L2[0];  A[2](0,1) =-L1[1];  A[2](0,2) = L6[2];
    A[2](1,0) = L2[0];  A[2](1,1) =-L1[1];  A[2](1,2) = L6[2];
    A[2](2,0) = L2[0];  A[2](2,1) =-L1[1];  A[2](2,2) = L6[2];
    // A3
    A[3](0,0) =-L3[0];  A[3](0,1) =-L2[1];  A[3](0,2) = L7[2];
    A[3](1,0) =-L3[0];  A[3](1,1) =-L2[1];  A[3](1,2) = L7[2];
    A[3](2,0) =-L3[0];  A[3](2,1) =-L2[1];  A[3](2,2) = L7[2];
    // A4
    A[4](0,0) = L11[0]; A[4](0,1) = L8[1];  A[4](0,2) =-L4[2];
    A[4](1,0) = L11[0]; A[4](1,1) = L8[1];  A[4](1,2) =-L4[2];
    A[4](2,0) = L11[0]; A[4](2,1) = L8[1];  A[4](2,2) =-L4[2];
    // A5
    A[5](0,0) =-L8[0];  A[5](0,1) = L9[1];  A[5](0,2) =-L5[2];
    A[5](1,0) =-L8[0];  A[5](1,1) = L9[1];  A[5](1,2) =-L5[2];
    A[5](2,0) =-L8[0];  A[5](2,1) = L9[1];  A[5](2,2) =-L5[2];
    // A6
    A[6](0,0) =-L9[0];  A[6](0,1) = L10[1]; A[6](0,2) =-L6[2];
    A[6](1,0) =-L9[0];  A[6](1,1) = L10[1]; A[6](1,2) =-L6[2];
    A[6](2,0) =-L9[0];  A[6](2,1) = L10[1]; A[6](2,2) =-L6[2];
    // A7
    A[7](0,0) =-L10[0]; A[7](0,1) =-L11[1]; A[7](0,2) =-L7[2];
    A[7](1,0) =-L10[0]; A[7](1,1) =-L11[1]; A[7](1,2) =-L7[2];
    A[7](2,0) =-L10[0]; A[7](2,1) =-L11[1]; A[7](2,2) =-L7[2];
    // A8
    A[8](0,0) = X1[0];  A[8](0,1) = X2[1];  A[8](0,2) = X3[2];
    A[8](1,0) = X1[0];  A[8](1,1) = X2[1];  A[8](1,2) = X3[2];
    A[8](2,0) = X1[0];  A[8](2,1) = X2[1];  A[8](2,2) = X3[2];

    float oddy[9];
    for(int i=0; i<9; ++i)
    {
        if (alpha[i] <= std::numeric_limits<float>::min())
        {
            return std::numeric_limits<float>::max();
        }
        oddy[i] = (matrix_norm(A[i].transpose()*A[i],2) - matrix_norm(A[i],4)/3.) / pow(alpha[i],4./3.);
    }
    return *std::max_element(oddy,oddy+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(relative_size_squared)
{
    float avgV = *(float*)arg;
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

HL_QUALITY_MEASURE_DEF(scaled_jacobian)
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

    if (msj > 1.01f) msj = -1.f;
    return msj;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shape)
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
        shape[i] = std::pow(alpha[i], 2.f/3.f) / A[i];
    }

    return 3.f * *std::min_element(shape, shape+9);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shape_and_size)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,arg) * shape(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shear)
{
    float msj = scaled_jacobian(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
    return std::max(msj,0.f);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(shear_and_size)
{
    return relative_size_squared(p0,p1,p2,p3,p4,p5,p6,p7,arg) * shear(p0,p1,p2,p3,p4,p5,p6,p7,nullptr);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(skew)
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

HL_QUALITY_MEASURE_DEF(stretch)
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
    float sqrt3 = 1.732050807568877f;

    return sqrt3 * (Lmin / Dmax);
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

HL_QUALITY_MEASURE_DEF(taper)
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

}
} // end namespace
