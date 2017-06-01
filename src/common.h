#ifndef _HL_COMMON_H_
#define _HL_COMMON_H_

#include <stdio.h>
#include <stdint.h>
#include <assert.h>

#define HL_LOG(...) ::printf(__VA_ARGS__)	

#define HL_ASSERT(cond) assert(cond)
//if (!(cond)) { return false; }

#define HL_ASSERT_LOG(cond, ...) if (!(cond)) { ::printf(__VA_ARGS__); return false; }

#include <chrono>

namespace HexaLab {
	using js_ptr = uintptr_t;

	using Index = int32_t;

    inline std::chrono::steady_clock::time_point sample_time() {
        return std::chrono::high_resolution_clock::now();
    }

    inline int milli_from_sample(std::chrono::steady_clock::time_point t1) {
        auto t2 = std::chrono::high_resolution_clock::now();
        return std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count();
    }
}

#endif