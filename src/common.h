#pragma once

#include <stdio.h>
#include <stdint.h>
#include <assert.h>

#define HL_LOG(...) ::printf(__VA_ARGS__)	

#define HL_ASSERT(cond) assert(cond)
//if (!(cond)) { return false; }

#define HL_ASSERT_LOG(cond, ...) if (!(cond)) { ::printf(__VA_ARGS__); assert(false); return false; }

#include <chrono>

namespace HexaLab {

using js_ptr = uintptr_t;

using Index = int32_t;

inline std::chrono::time_point<std::chrono::high_resolution_clock> sample_time() {
    return std::chrono::high_resolution_clock::now();
}

inline int milli_from_sample(std::chrono::time_point<std::chrono::high_resolution_clock> t1) {
    auto t2 = std::chrono::high_resolution_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count();
}

}
