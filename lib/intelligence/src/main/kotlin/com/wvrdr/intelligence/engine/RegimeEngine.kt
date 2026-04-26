package com.wvrdr.intelligence.engine

import com.wvrdr.intelligence.models.TruthClass
import com.wvrdr.intelligence.models.TruthEnvelope
import java.time.Instant

/**
 * WAVE-I BLOCK-2.5 REGIME ENGINE
 * Implements 70/20/10 weighting for High-Stakes Regime Switching.
 * Guarded by Zero-Faith Fallback logic.
 */
class RegimeEngine {

    /**
     * Calculates the Composite Stress Index.
     * Weights: 70% Market Spread, 20% Liquidity Flow, 10% Geopolitical Sentinel.
     */
    fun calculateComposite(
        market: TruthEnvelope<Double>,
        liquidity: TruthEnvelope<Double>,
        geopolitical: TruthEnvelope<Double>
    ): TruthEnvelope<Double> {

        // 1. TRUTH AUDIT: Determine the weakest link in the truth chain.
        // If the 70% driver (market) is FAILED, the entire output is FAILED.
        val derivedTruth = when {
            market.truthClass == TruthClass.FAILED -> TruthClass.FAILED
            market.truthClass == TruthClass.STALE || geopolitical.truthClass == TruthClass.STALE -> TruthClass.STALE
            market.truthClass == TruthClass.DEGRADED -> TruthClass.DEGRADED
            else -> TruthClass.LIVE
        }

        // 2. WEIGHTED CALCULATION (70/20/10)
        // Note: Geopolitical weight ramps if DEFCON > 5 (Logic contained in Sentinel)
        val score = (market.value * 0.70) +
            (liquidity.value * 0.20) +
            (geopolitical.value * 0.10)

        // 3. ENVELOPE GENERATION
        // Wrapped for handoff to the Swift/TypeScript frontend.
        return TruthEnvelope(
            value = score,
            sourceId = "RE-BLOCK-2.5-ALPHA",
            timestamp = Instant.now().toEpochMilli(),
            truthClass = derivedTruth
        ).validate() // Manual Bridge Guard check (auto-downgrade > 60s)
    }
}
