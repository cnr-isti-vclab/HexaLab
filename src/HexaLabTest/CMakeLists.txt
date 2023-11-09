cmake_minimum_required(VERSION 3.1.0)

project(HexaLabTest)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")
set(SOURCES
    ../app.cpp
    ../builder.cpp
    ../mesh.cpp
    ../loader.cpp
    ../plane_filter.cpp
    ../quality_filter.cpp
    ../test.cpp
    ../color_map.cpp
    ../hexalab_js.cpp
    ../peeling_filter.cpp
    ../pick_filter.cpp
)

set(HEADERS
    ../app.h
    ../builder.h
    ../loader.h
    ../mesh.h
    ../model.h
    ../plane_filter.h
    ../quality_filter.h
    ../peeling_filter.h
    ../hex_quality.h
    ../pick_filter.h
    ../common.h
    ../hex_quality_color_maps.h
)

include_directories(
    ..
    ../../src/eigen
)

add_executable(HexaLabTest ${SOURCES} ${HEADERS})
