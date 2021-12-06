# Datasets
This folder contains a collection of 599 hexahedral meshes that have been presented in 21 papers and made available by the respective authors. All the datasets are copyrighted by their authors. For any use different from displaying them inside HexaLab you should contact the authors.
Current datasets come from the following papers:

- [All-Hex Mesh Generation via Volumetric PolyCube Deformation (2011)](https://doi.org/10.1111/j.1467-8659.2011.02015.x)
- [All-Hex Meshing Using Singularity-Restricted Field (2012)](http://doi.org/10.1145/2366145.2366196)
- [PolyCut: Monotone Graph-Cuts for PolyCube Base-Complex Construction (2013)](https://doi.org/10.1145/2508363.2508388)
- [ℓ1-Based Construction of Polycube Maps from Complex Shapes (2014)](https://doi.org/10.1145/2602141)
- [Practical Hex-Mesh Optimization via Edge-Cone Rectification (2015)](http://doi.org/10.1145/2766905)
- [All-Hex Meshing Using Closed-Form Induced Polycube (2016)](http://doi.org/10.1145/2897824.2925957)
- [Efficient Volumetric PolyCube-Map Construction (2016)](http://doi.org/10.1111/cgf.13007)
- [Polycube simplification for coarse layouts of surfaces and volumes (2016)](http://doi.org/10.1111/cgf.12959 )
- [Skeleton-driven Adaptive Hexahedral Meshing of Tubular Shapes (2016)](http://doi.org/10.1111/cgf.13021)
- [Structured Volume Decomposition via Generalized Sweeping (2016)](http://doi.org/10.1109/TVCG.2015.2473835)
- [A global approach to multi-axis swept mesh generation (2017)](https://doi.org/10.1016/j.proeng.2017.09.817)
- [Explicit Cylindrical Maps for General Tubular Shapes (2017)](https://doi.org/10.1016/j.cad.2017.05.002)
- [Hexahedral Mesh Generation via Constrained Quadrilateralization (2017)](http://doi.org/10.1371/journal.pone.0177603)
- [Fuzzy clustering based pseudo-swept volume decomposition for hexahedral meshing (2018)](https://doi.org/10.1016/j.cad.2017.10.001)
- [Selective Padding for Polycube‐Based Hexahedral Meshing (2019)](https://doi.org/10.1111/cgf.13593)
- [Singularity Structure Simplification of Hexahedral Mesh via Weighted Ranking (2019)](https://arxiv.org/abs/1901.00238)
- [Dual Sheet Meshing: An Interactive Approach to Robust Hexahedralization (2019)](https://diglib.eg.org/handle/10.1111/cgf13617)
- [Symmetric Moving Frames (2019)](https://www.cs.cmu.edu/~kmcrane/Projects/SymmetricMovingFrames/index.html)
- [Feature Preserving Octree-Based Hexahedral Meshing (2019)](https://gaoxifeng.github.io/)
- [LoopyCuts: Practical Feature-Preserving Block Decomposition for Strongly Hex-Dominant Meshing (2020)](https://github.com/mlivesu/LoopyCuts)
- [Cut-enhanced PolyCube-Maps for Feature-aware All-Hex Meshing (2020)](https://guohaoxiang.github.io/projects/ce_polycube.html)

## How to contribute
We really welcome datasets from existing papers, and we are collecting the ones we find available on the web. If you have some models related to a published paper you have two ways to contribute:
1) raise an [issue](https://github.com/cnr-isti-vclab/HexaLab/issues) asking for a dataset/paper to be included providing doi of the paper and the link to the dataset;
2) add it by yourself: clone the repo, add a folder as named as your paper with all the needed `.mesh` models, add an entry in the `index.json` file with all the needed info (title, authors, list of models, etc), and finally raise a pull request.
