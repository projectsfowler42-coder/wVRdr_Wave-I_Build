package com.wvrdr.intelligence.models

/**
 * Truth state for Wave-I data envelopes.
 */
enum class TruthClass {
    LIVE,
    DEGRADED,
    STALE,
    FAILED
}
