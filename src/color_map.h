#pragma once

#include <Eigen/Dense>
#include <vector>
#include <common.h>

namespace HexaLab {
	using namespace std;
	using namespace Eigen;

	class ColorMap {
	public:
		enum class Palette {
			Parula = 0,
			Jet,
			RedBlue
		};

		ColorMap() : ColorMap(default_palette) {};
		ColorMap(ColorMap::Palette palette);
		
		Vector3f get(float value);
		Palette get_enum() { return this->palette_enum; }

	private:
		static Palette default_palette;
		const vector<Vector3f>* palette;
		Palette palette_enum;
	};
}
