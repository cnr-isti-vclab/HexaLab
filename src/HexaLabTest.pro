DEPENDPATH += . ./eigen .
INCLUDEPATH += . ./eigen .
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

HEADERS = app.h \
  builder.h\
  loader.h\
  mesh_navigator.h\
  ifilter.h\
  mesh.h \
  model.h \
  dart.h \
  plane_filter.h \
  quality_filter.h 
