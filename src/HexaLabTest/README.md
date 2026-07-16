HexaLabTest is a simple command line tool that allows to test the correctness of the hexahedral meshes included in the datasets. It also generates the `index_clean.json` file that is used by HexaLab to show the list of available datasets.

## How to build and run HexaLabTest
Issue the standard cmake command sequence here:
```
mkdir build
cd build
cmake ..
make
cd ..
build/HexaLabTest
```