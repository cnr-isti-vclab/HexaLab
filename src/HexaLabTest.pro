DEPENDPATH += . ../eigen ../include
INCLUDEPATH += . ../eigen ../include
CONFIG += console stl c++11

TEMPLATE = app
# Mac specific Config required to avoid to make application bundles
CONFIG -= app_bundle

SOURCES += app.cpp \
  builder.cpp \ 
  loader.cpp \
  mesh_navigator.cpp \
  plane_filter.cpp \
  quality_filter.cpp \
  test.cpp \
  hexalab_js.cpp 

HEADERS = ../include/app.h \
  ../include/builder.h\
  ../include/loader.h\
  ../include/mesh_navigator.h\
  ../include/ifilter.h\
  ../include/plane_filter.h \
  ../include/quality_filter.h 
