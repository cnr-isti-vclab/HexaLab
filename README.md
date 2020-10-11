## [HexaLab.net](http://www.hexalab.net): an online viewer for hexahedral meshes

**[Matteo Bracci](https://github.com/c4stan)<sup>x</sup>, [Marco Tarini](http://vcg.isti.cnr.it/~tarini/)<sup>1,2,x</sup>, [Nico Pietroni](http://vcg.isti.cnr.it/~pietroni)<sup>1,4</sup>, [Marco Livesu](http://pers.ge.imati.cnr.it/livesu/)<sup>3</sup>, [Paolo Cignoni](http://vcg.isti.cnr.it/~cignoni)<sup>1</sup>**

[Computer-Aided Design, Volume 110, May 2019](https://doi.org/10.1016/j.cad.2018.12.003)

[DOI:10.1016/j.cad.2018.12.003](https://doi.org/10.1016/j.cad.2018.12.003)

(_[preprint](https://arxiv.org/pdf/1806.06639) available on [arxiv](https://arxiv.org/abs/1806.06639)_)

Copyright 2018
[Visual Computing Lab](http://vcg.isti.cnr.it)
[ISTI](http://www.isti.cnr.it) - [CNR](http://www.cnr.it)

Live view on [www.hexalab.net](http://www.hexalab.net)

HexaLab is a WebGL application for real time visualization, exploration and assessment of hexahedral meshes. HexaLab can be used by simply opening www.hexalab.net. This visualization tool targets both users and scholars. Practitioners who employ hexmeshes for Finite Element Analysis, can readily check mesh quality and assess its usability for simulation. Researchers involved in mesh generation may use HexaLab to perform a detailed analysis of the mesh structure, isolating weak points and testing new solutions to improve on the state of the art and generate high quality images. To this end, we support a wide variety of visualization and volume inspection tools. The system also offers immediate access to a repository containing all the publicly available meshes produced with the most recent techniques for hex mesh generation. We believe HexaLab, providing a common tool for visualizing, assessing and distributing results, will push forward the recent strive for replicability in our scientific community. The system supports hexahedral models in the popular `.mesh` and `.vtk` ASCII formats. 

HexaLab aims also to easily present the results of recent papers on hex meshing by directly including them in its own repository when provided by the authors. The datasets presented are copyrighted by the respective paper authors. Look in the [`datasets`](https://github.com/cnr-isti-vclab/HexaLab/tree/master/datasets) folder for more info.

### Release Notes
- **2020.10** Complete rewrote of the core data structures. Now it is much faster and it uses a fraction of memory. 
All datasets, even the ones composed by more than 600k cells, can be loaded. 
- **2020.07** added "LoopyCuts: Practical Feature-Preserving..."
- **2019.06** added "Feature Preserving Octree-Based..."
- **2019.05** added "Dual Sheet Meshing...", "Symmetric Moving Frames...", "Hexahedral Mesh Generation via Constrained"
- **2019.01** added "Singularity Structure Simplification of Hexahedral..."
- **2019.01** added "Selective Padding for Polycube‐Based Hexahedral Mes..."
- **2018.10** added "A global approach to multi-axis swept..." and "Fuzzy clustering based pseudo-swept ...
- **2018.06** added "All-Hex Mesh Generation via Volumetric PolyCube"
- **2018.05** added "PolyCut: Monotone Graph-Cuts for PolyCube Base" and  "Explicit Cylindrical Maps for General..."
- **2018.01** First public version, released with the preprint on [arxiv](https://arxiv.org/abs/1806.06639)

---

- <sup>x</sup> Joint first authors
- <sup>1</sup> [ISTI](http://www.isti.cnr.it) - [CNR](http://www.cnr.it)
- <sup>2</sup> [Università degli Studi di Milano ("La Statale")](http://www.unimi.it)
- <sup>3</sup> [IMATI](http://www.imati.cnr.it/) - [CNR](http://www.cnr.it)
- <sup>4</sup> [University of Technology, Sidney](https://www.uts.edu.au/)
