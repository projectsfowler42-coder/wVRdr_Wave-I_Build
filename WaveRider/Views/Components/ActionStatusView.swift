import SwiftUI

struct ActionStatusView: View {
    let item: ActionStatus

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle().fill(dotColor).frame(width: 5, height: 5)
                Text(item.action + " / " + item.status.rawValue)
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.7))
            }
            Text(item.message)
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.4))
                .lineLimit(2)
            Text("LOCAL " + item.localTimestamp + "  UTC " + item.utcTimestamp)
                .font(.system(size: 7, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.25))
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.03))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var dotColor: Color {
        switch item.status {
        case .idle: return .white.opacity(0.3)
        case .running: return .orange
        case .success: return Color(red: 0, green: 1, blue: 1)
        case .noConnector: return .orange
        case .noRecord: return .yellow
        case .failed: return .red
        case .active: return Color(red: 0, green: 1, blue: 1)
        }
    }
}
