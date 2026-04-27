import Foundation
import SwiftUI

/// WAVE-I: Truth Spine — the integrity classification of every data point.
/// The app must never lie, infer, or silently assume.
enum TruthClass: String, Codable, Hashable, CaseIterable {
    case live     = "LIVE"
    case degraded = "DEGRADED"
    case stale    = "STALE"
    case failed   = "FAILED"

    var color: Color {
        switch self {
        case .live:     return Color(red: 0, green: 1, blue: 1)
        case .degraded: return .orange
        case .stale:    return .yellow
        case .failed:   return .red
        }
    }

    var background: Color {
        color.opacity(0.10)
    }

    var border: Color {
        color.opacity(0.54)
    }
}

/// Derives the worst truth class from a collection of truth classes.
func deriveTruthClass(_ classes: [TruthClass]) -> TruthClass {
    if classes.contains(.failed) { return .failed }
    if classes.contains(.stale) { return .stale }
    if classes.contains(.degraded) { return .degraded }
    return .live
}
