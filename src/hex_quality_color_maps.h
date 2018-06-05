#ifndef HEX_QUALITY_COLOR_MAPS_H
#define HEX_QUALITY_COLOR_MAPS_H

#include <Eigen/Dense>

#include <common.h>
#include <hex_quality.h>

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

enum class QualityMeasureEnum
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

static float normalize_quality_measure(QualityMeasureEnum metric,
                                       const float q,
                                       const float q_min = -std::numeric_limits<float>::infinity(),
                                       const float q_max =  std::numeric_limits<float>::infinity())
{
    switch(metric)
    {
        case QualityMeasureEnum::DIA : return q/q_max;
        case QualityMeasureEnum::DIM : return q/q_max;
        case QualityMeasureEnum::DIS : return (q-q_min)/(q_max-q_min);
        case QualityMeasureEnum::ER  : return (q_max-q)/(q_max-1.f);
        case QualityMeasureEnum::J   : return (q-q_min)/(q_max-q_min);
        case QualityMeasureEnum::MER : return (q_max-q)/(q_max-1.f);
        case QualityMeasureEnum::MAAF: return (q_max-q)/(q_max-1.f);
        case QualityMeasureEnum::MEAF: return (q_max-q)/(q_max-1.f);
        case QualityMeasureEnum::ODD : return (q_max-q)/q_max;
        case QualityMeasureEnum::RSS : return q;
        case QualityMeasureEnum::SJ  : return (q>1.00001) ? 0.f : std::max(q,0.f);
        case QualityMeasureEnum::SHA : return q;
        case QualityMeasureEnum::SHAS: return q;
        case QualityMeasureEnum::SHE : return q;
        case QualityMeasureEnum::SHES: return q;
        case QualityMeasureEnum::SKE : return (q_max-q)/q_max;
        case QualityMeasureEnum::STR : return q/q_max;
        case QualityMeasureEnum::TAP : return (q_max-q)/q_max;
        case QualityMeasureEnum::VOL : return (q-q_min)/(q_max-q_min);
    }
    return 0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static float denormalize_quality_measure(QualityMeasureEnum metric,
                                       const float q,
                                       const float q_min = -std::numeric_limits<float>::infinity(),
                                       const float q_max =  std::numeric_limits<float>::infinity())
{
    switch(metric)
    {
        case QualityMeasureEnum::DIA : return q*q_max;
        case QualityMeasureEnum::DIM : return q*q_max;
        case QualityMeasureEnum::DIS : return q_min+q*(q_max-q_min);
        case QualityMeasureEnum::ER  : return 1.f+(1.f-q)*(q_max-1.f);
        case QualityMeasureEnum::J   : return q_min+q*(q_max-q_min);
        case QualityMeasureEnum::MER : return 1.f+(1.f-q)*(q_max-1.f);
        case QualityMeasureEnum::MAAF: return 1.f+(1.f-q)*(q_max-1.f);
        case QualityMeasureEnum::MEAF: return 1.f+(1.f-q)*(q_max-1.f);
        case QualityMeasureEnum::ODD : return (1.f-q)*q_max;
        case QualityMeasureEnum::RSS : return q;
        case QualityMeasureEnum::SJ  : return q;
        case QualityMeasureEnum::SHA : return q;
        case QualityMeasureEnum::SHAS: return q;
        case QualityMeasureEnum::SHE : return q;
        case QualityMeasureEnum::SHES: return q;
        case QualityMeasureEnum::SKE : return (1.f-q)*q_max;
        case QualityMeasureEnum::STR : return q*q_max;
        case QualityMeasureEnum::TAP : return (1.f-q)*q_max;
        case QualityMeasureEnum::VOL : return q_min+q*(q_max-q_min);
    }
    return 0;
}

//::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

static quality_measure_fun* get_quality_measure_fun(QualityMeasureEnum measure)
{
    quality_measure_fun* fun = nullptr;
    switch(measure)
    {
        case QualityMeasureEnum::SJ:   fun = &QualityMeasureFun::scaled_jacobian;          break;
        case QualityMeasureEnum::DIA:  fun = &QualityMeasureFun::diagonal;                 break;
        case QualityMeasureEnum::ER:   fun = &QualityMeasureFun::edge_ratio;               break;
        case QualityMeasureEnum::DIM:  fun = &QualityMeasureFun::dimension;                break;
        case QualityMeasureEnum::DIS:  fun = &QualityMeasureFun::distortion;               break;
        case QualityMeasureEnum::J:    fun = &QualityMeasureFun::jacobian;                 break;
        case QualityMeasureEnum::MER:  fun = &QualityMeasureFun::maximum_edge_ratio;       break;
        case QualityMeasureEnum::MAAF: fun = &QualityMeasureFun::maximum_aspect_frobenius; break;
        case QualityMeasureEnum::MEAF: fun = &QualityMeasureFun::mean_aspect_frobenius;    break;
        case QualityMeasureEnum::ODD:  fun = &QualityMeasureFun::oddy;                     break;
        case QualityMeasureEnum::RSS:  fun = &QualityMeasureFun::relative_size_squared;    break;
        case QualityMeasureEnum::SHA:  fun = &QualityMeasureFun::shape;                    break;
        case QualityMeasureEnum::SHAS: fun = &QualityMeasureFun::shape_and_size;           break;
        case QualityMeasureEnum::SHE:  fun = &QualityMeasureFun::shear;                    break;
        case QualityMeasureEnum::SHES: fun = &QualityMeasureFun::shear_and_size;           break;
        case QualityMeasureEnum::SKE:  fun = &QualityMeasureFun::skew;                     break;
        case QualityMeasureEnum::STR:  fun = &QualityMeasureFun::stretch;                  break;
        case QualityMeasureEnum::TAP:  fun = &QualityMeasureFun::taper;                    break;
        case QualityMeasureEnum::VOL:  fun = &QualityMeasureFun::volume;                   break;
        default: HL_LOG("Invalid QualityMeasureEnum value: %d\n", measure);                break;
    }
    return fun;
}

}

#endif // HEX_QUALITY_COLOR_MAPS_H
