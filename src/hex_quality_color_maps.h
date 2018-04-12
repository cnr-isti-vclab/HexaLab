#ifndef HEX_QUALITY_COLOR_MAPS_H
#define HEX_QUALITY_COLOR_MAPS_H

#include <Eigen/Dense>
#include "hex_quality.h"

namespace HexaLab
{

/**
 * This file provides convenient functions to map each quality metric back and forth from its native
 * range to a normalized [0,1] range where 0 means lowest quality and 1 means highest quality.
 *
 * For metrics with unbounded ranges we use the maximum and minimum quality elements in the mesh to
 * define "relative" bounds.
 *
*/

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

enum
{         // QUALITY METRIC NAME    | RANGE       | ACCEPTABLE RANGE
          // --------------------------------------------------------
    DIA,  // Diagonal               | [0,inf)     | [0.65,1]
    DIM,  // Dimension              | [0,inf)     |
    DIS,  // Distortion             | (-inf,inf)  | [0.5,1]
    ER,   // Edge Ratio             | [1,inf)     |
    J,    // Jacobian               | (-inf,inf)  | [0,inf)
    MER,  // Maximum Edge Ratio     | [1,inf)     | [1,1.3]
    MAAF, // Maximum Asp. Frobenius | [1,inf)     | [1,3]
    MEAF, // Mean Asp. Frobenius    | [1,inf)     | [1,3]
    ODD,  // Oddy                   | [0,inf)     | [0,0.5]
    RSS,  // Relative Size Squared  | [0,1]       | [0.5,1]
    SJ,   // Scaled Jaobian         | [-1,inf)    | [0.5,1]
    SHA,  // Shape                  | [0,1]       | [0.3,1]
    SHAS, // Shape and Size         | [0,1]       | [0.2,1]
    SHE,  // Shear                  | [0,1]       | [0.3,1]
    SHES, // Shear and Size         | [0,1]       | [0.2,1]
    SKE,  // Skew                   | [0,inf)     | [0,0.5]
    STR,  // Stretch                | [0,inf)     | [0.25,1]
    TAP,  // Taper                  | [0,inf)     | [0,0.5]
    VOL   // Volume                 | (-inf,inf)  | [0,inf)
};

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

float from_native_to_normalized_range(const int   metric,
                                      const float q,
                                      const float q_min = -std::numeric_limits<float>::infinity(),
                                      const float q_max =  std::numeric_limits<float>::infinity())
{
    switch(metric)
    {
        case DIA : return q/q_max;
        case DIM : return q/q_max;
        case DIS : return (q-q_min)/(q_max-q_min);
        case ER  : return (q_max-q)/(q_max-1.f);
        case J   : return (q-q_min)/(q_max-q_min);
        case MER : return (q_max-q)/(q_max-1.f);
        case MAAF: return (q_max-q)/(q_max-1.f);
        case MEAF: return (q_max-q)/(q_max-1.f);
        case ODD : return (q_max-q)/q_max;
        case RSS : return q;
        case SJ  : return (q+1.f)/(q_max+1.f);
        case SHA : return q;
        case SHAS: return q;
        case SHE : return q;
        case SHES: return q;
        case SKE : return (q_max-q)/q_max;
        case STR : return q/q_max;
        case TAP : return (q_max-q)/q_max;
        case VOL : return (q-q_min)/(q_max-q_min);
    }
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

float from_normalized_to_native_range(const int   metric,
                                      const float q,
                                      const float q_min = -std::numeric_limits<float>::infinity(),
                                      const float q_max =  std::numeric_limits<float>::infinity())
{
    switch(metric)
    {
        case DIA : return q*q_max;
        case DIM : return q*q_max;
        case DIS : return q_min+q*(q_max-q_min);
        case ER  : return 1.f+(1.f-q)*(q_max-1.f);
        case J   : return q_min+q*(q_max-q_min);
        case MER : return 1.f+(1.f-q)*(q_max-1.f);
        case MAAF: return 1.f+(1.f-q)*(q_max-1.f);
        case MEAF: return 1.f+(1.f-q)*(q_max-1.f);
        case ODD : return (1.f-q)*q_max;
        case RSS : return q;
        case SJ  : return -1.f+q*(q_max+1.f);
        case SHA : return q;
        case SHAS: return q;
        case SHE : return q;
        case SHES: return q;
        case SKE : return (1.f-q)*q_max;
        case STR : return q*q_max;
        case TAP : return (1.f-q)*q_max;
        case VOL : return q_min+q*(q_max-q_min);
    }
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

}

#endif // HEX_QUALITY_COLOR_MAPS_H
