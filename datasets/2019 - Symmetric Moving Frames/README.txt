Symmetric Moving Frames - Hexahedral Meshes
===========================================

This archive contains hexahedral meshes for models appearing in the article

     "Symmetric Moving Frames"
     Etienne Corman and Keenan Crane
     ACM Transactions on Graphics (2019)

The meshes were created by first generating 3D cross fields using the technique
described in the paper; these fields were then parameterized via CubeCover
[Nieser et al 2011] using the CoMiSo integer solver [Bommes et al 2012] and
extracted via HexEx [Lyon et al 2016].  Thanks to Heng Liu and David Bommes
for performing the parameterization and mesh extraction.

Meshes are stored as VTK files encoding 3D vertex positions (POINTS) and cell
connectivity (CELLS).

