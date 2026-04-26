import SwiftUI

/// WAVE-I BLOCK-3: TruthBadge
/// Compact integrity badge for Truth Spine status.
///
/// This view is presentation-only. It displays the supplied `TruthClass` without
/// deriving scores, thresholds, trading signals, or wallet state.
struct TruthBadge: View {
    let truthClass: TruthClass

    var body: some View {
        HStack(spacing: 7) {
            Circle()
                .fill(truthClass.color)
                .frame(width: 7, height: 7)
                .shadow(color: truthClass.color.opacity(0.82), radius: 6, x: 0, y: 0)

            Text(truthClass.rawValue)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .tracking(1.1)
                .foregroundStyle(truthClass.color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule(style: .continuous)
                .fill(truthClass.color.opacity(0.12))
        )
        .overlay(
            Capsule(style: .continuous)
                .strokeBorder(truthClass.color.opacity(0.54), lineWidth: 1)
        )
        .accessibilityLabel("Truth class \(truthClass.rawValue)")
    }
}

#Preview("TruthBadge / All States") {
    ZStack {
        Color.black.ignoresSafeArea()

        VStack(alignment: .leading, spacing: 12) {
            TruthBadge(truthClass: .live)
            TruthBadge(truthClass: .degraded)
            TruthBadge(truthClass: .stale)
            TruthBadge(truthClass: .failed)
        }
        .padding(24)
    }
}
