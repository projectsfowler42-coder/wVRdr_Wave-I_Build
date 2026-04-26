package com.wvrdr.intelligence.models

import java.time.Instant

/**
 * Value wrapper carrying source, timestamp, and truth classification.
 */
data class TruthEnvelope<T>(
    val value: T,
    val sourceId: String,
    val timestamp: Long,
    val truthClass: TruthClass
) {
    /**
     * Manual Bridge Guard: auto-downgrade LIVE envelopes older than 60 seconds.
     */
    fun validate(nowMillis: Long = Instant.now().toEpochMilli()): TruthEnvelope<T> {
        val ageMillis = nowMillis - timestamp
        return if (truthClass == TruthClass.LIVE && ageMillis > 60_000L) {
            copy(truthClass = TruthClass.STALE)
        } else {
            this
        }
    }
}
