import Foundation

/// A high-level data fetcher that enforces the "Robust, Resilient, Redundant" creed.
struct ResilientFetcher {

    // 3.5 second hard timeout to maintain situational awareness.
    private static let hardTimeoutNanoseconds: UInt64 = 3_500_000_000

    /**
     Executes the "Dead Man's Switch" logic.
     Races a primary data fetch against a 3.5s timeout.
     
     - Parameter primaryFetch: An async closure that attempts to fetch the LIVE data.
     - Parameter fallback: The last known good `TruthEnvelope` to use as a rescue state.
     - Returns: The freshest available data, guaranteed to return within the timeout.
     */
    static func race<T>(
        primaryFetch: @escaping () async throws -> TruthEnvelope<T>,
        fallback: TruthEnvelope<T>
    ) async -> TruthEnvelope<T> {
        
        do {
            return try await withTimeout(nanoseconds: hardTimeoutNanoseconds) {
                // Attempt to get the live data.
                var liveData = try await primaryFetch()

                // Post-fetch validation: Downgrade if the data is older than 60s.
                if liveData.truthClass == .live && liveData.ageSeconds > 60 {
                    liveData.truthClass = .stale
                }
                return liveData
            }
        } catch {
            // If the primary fetch fails or times out, pivot to the rescue state.
            print("[RESILIENCE] Primary source failed or timed out. Pivoting to STALE_RESCUE.")
            var rescueData = fallback
            rescueData.truthClass = .stale
            return rescueData
        }
    }

    /// A helper function to wrap any async task with a timeout.
    private static func withTimeout<T>(
        nanoseconds: UInt64,
        operation: @escaping () async throws -> T
    ) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            
            // Add the primary operation to the group.
            group.addTask {
                return try await operation()
            }
            
            // Add a timeout task that throws an error after the delay.
            group.addTask {
                try await Task.sleep(nanoseconds: nanoseconds)
                throw CancellationError()
            }

            // Await the first task to complete.
            let result = try await group.next()!
            
            // Cancel all other tasks and return the result.
            group.cancelAll()
            return result
        }
    }
}
