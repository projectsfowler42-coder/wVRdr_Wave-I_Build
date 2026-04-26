import Foundation
import SwiftUI

/// WAVE-I BLOCK-2.5: The Truth Spine
/// Defines the integrity of any piece of telemetry in the system.
enum TruthClass: String, Codable, Hashable {
    case live     = "LIVE"     // Fresh, primary source data (Cyan)
    case degraded = "DEGRADED" // Partial or proxy data (Orange)
    case stale    = "STALE"    // Cache fallback or aged data (Yellow)
    case failed   = "FAILED"   // Connection loss or error (Red)

    /// Provides the NASA-grade color coding for the HUD.
    var color: Color {
        switch self {
        case .live:     return Color(red: 0, green: 1, blue: 1) // Cyan
        case .degraded: return .orange
        case .stale:    return .yellow
        case .failed:   return .red
        }
    }
}

/// A universal wrapper for any piece of data, enforcing Truth Spine compliance.
struct TruthEnvelope<T: Codable & Hashable>: Codable, Hashable {
    let value: T
    let sourceId: String
    let timestamp: TimeInterval // Unix epoch
    var truthClass: TruthClass

    /// Calculates the age of the data in seconds.
    var ageSeconds: TimeInterval {
        Date().timeIntervalSince1970 - timestamp
    }
}
