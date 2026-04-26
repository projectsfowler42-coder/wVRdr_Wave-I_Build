import SwiftUI

/// WAVE-I BLOCK-3: TelemetricTile
/// A glass-cockpit telemetry surface for any Truth Spine compliant data point.
///
/// This view is deliberately presentation-only. It does not calculate price triggers,
/// thresholds, scores, trading decisions, or wallet logic. It renders the supplied
/// `TruthEnvelope` exactly as received.
struct TelemetricTile<T: Codable & Hashable>: View {
    let title: String
    let envelope: TruthEnvelope<T>
    let valueFormatter: (T) -> String
    let unit: String?

    init(
        title: String,
        envelope: TruthEnvelope<T>,
        unit: String? = nil,
        valueFormatter: @escaping (T) -> String
    ) {
        self.title = title
        self.envelope = envelope
        self.unit = unit
        self.valueFormatter = valueFormatter
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title.uppercased())
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .tracking(1.4)
                        .foregroundStyle(.white.opacity(0.64))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)

                    Text(envelope.sourceId.uppercased())
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .tracking(0.9)
                        .foregroundStyle(.white.opacity(0.42))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                }

                Spacer(minLength: 12)

                TruthBadge(truthClass: envelope.truthClass)
            }

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(valueFormatter(envelope.value))
                    .font(.system(size: 34, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.54)
                    .contentTransition(.numericText())
                    .monospacedDigit()

                if let unit {
                    Text(unit.uppercased())
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .tracking(1.1)
                        .foregroundStyle(envelope.truthClass.color.opacity(0.92))
                        .lineLimit(1)
                }
            }

            Divider()
                .overlay(envelope.truthClass.color.opacity(0.42))

            HStack(spacing: 10) {
                TelemetryMetaPill(label: "AGE", value: formattedAge)
                TelemetryMetaPill(label: "EPOCH", value: formattedTimestamp)
            }
        }
        .padding(18)
        .background(tileBackground)
        .overlay(tileBorder)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: envelope.truthClass.color.opacity(0.20), radius: 18, x: 0, y: 0)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilitySummary)
    }

    private var formattedAge: String {
        let age = max(0, envelope.ageSeconds)

        if age < 1 {
            return "0S"
        }

        if age < 60 {
            return "\(Int(age.rounded(.down)))S"
        }

        if age < 3_600 {
            return "\(Int((age / 60).rounded(.down)))M"
        }

        return "\(Int((age / 3_600).rounded(.down)))H"
    }

    private var formattedTimestamp: String {
        String(format: "%.0f", envelope.timestamp)
    }

    private var tileBackground: some View {
        RoundedRectangle(cornerRadius: 22, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        Color.black.opacity(0.94),
                        Color(red: 0.025, green: 0.035, blue: 0.05).opacity(0.98)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var tileBorder: some View {
        RoundedRectangle(cornerRadius: 22, style: .continuous)
            .strokeBorder(envelope.truthClass.color.opacity(0.74), lineWidth: 1)
    }

    private var accessibilitySummary: String {
        "\(title), \(valueFormatter(envelope.value))\(unit.map { " \($0)" } ?? ""), source \(envelope.sourceId), truth \(envelope.truthClass.rawValue), age \(formattedAge)"
    }
}

private struct TelemetryMetaPill: View {
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 5) {
            Text(label)
                .foregroundStyle(.white.opacity(0.42))

            Text(value)
                .foregroundStyle(.white.opacity(0.82))
        }
        .font(.system(size: 10, weight: .semibold, design: .monospaced))
        .tracking(0.9)
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(
            Capsule(style: .continuous)
                .fill(.white.opacity(0.055))
        )
        .overlay(
            Capsule(style: .continuous)
                .strokeBorder(.white.opacity(0.10), lineWidth: 1)
        )
        .lineLimit(1)
    }
}

#Preview("TelemetricTile / LIVE") {
    ZStack {
        Color.black.ignoresSafeArea()

        TelemetricTile(
            title: "MINT PRICE",
            envelope: TruthEnvelope(
                value: 20.73,
                sourceId: "PRIMARY_FEED",
                timestamp: Date().timeIntervalSince1970,
                truthClass: .live
            ),
            unit: "USD"
        ) { value in
            String(format: "%.2f", value)
        }
        .padding(24)
    }
}

#Preview("TelemetricTile / STALE") {
    ZStack {
        Color.black.ignoresSafeArea()

        TelemetricTile(
            title: "MINT PRICE",
            envelope: TruthEnvelope(
                value: 20.73,
                sourceId: "STALE_RESCUE",
                timestamp: Date().addingTimeInterval(-4_200).timeIntervalSince1970,
                truthClass: .stale
            ),
            unit: "USD"
        ) { value in
            String(format: "%.2f", value)
        }
        .padding(24)
    }
}
