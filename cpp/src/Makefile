CC=emcc
# A few notes on the options:
#
# -s PRECISE_F32=1 is needed because of a strange bug involving the assignments 
#           of floats. Actually asm.js uses doubles for most computation, 
#           this flags ensure a behavoiur more similar to the expected one.
# --bind    needed for exporting the functions from cpp to js.
# -s DEMANGLE_SUPPORT=1 More consistent naming of the cpp functions is preserved 
#           in asm.js. Useful for cpp stacktrace inside the browser. 
# Reasonable memory options: 
# 
# -s ALLOW_MEMORY_GROWTH=1 
# -s TOTAL_MEMORY=536870912
# -s TOTAL_MEMORY=1073741824 


CFLAGS= -I ../include -I ../eigen -s TOTAL_MEMORY=536870912 --memory-init-file 0 -std=c++11 -s PRECISE_F32=1 -s DEMANGLE_SUPPORT=1 --bind  -s LINKABLE=1 -Os

OBJ = hexalab_js.bc \
      app.bc \
      builder.bc \
      loader.bc \
      plane_filter.bc \
      quality_filter.bc \
      mesh_navigator.bc

LIBS = 

%.bc: %.cpp
	$(CC) -c -o $@ $< $(CFLAGS)

hexalab_asm.js: $(OBJ) $(LIBS)
	$(CC) -o ../../js/generated/$@ $^ $(CFLAGS)

clean:
	rm -f *.bc ../../js/generated/*.js 
