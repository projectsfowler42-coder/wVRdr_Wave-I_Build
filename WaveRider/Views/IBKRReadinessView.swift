import SwiftUI

struct IBKRReadinessView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionLabel("SCHWAB READINESS")
                        HStack {
                            Text(store.ibkrReadiness.isUnverified ? "UNVERIFIED" : store.ibkrReadiness.label)
                                .font(.system(size: 20, weight: .bold, design: .monospaced))
                                .foregroundStyle(.white)
                            Spacer()
                            truthBadge(store.ibkrReadiness.truthClass)
                        }
                        if let ts = store.ibkrReadiness.lastVerifiedAt {
                            Text("LAST VERIFIED: \(Timestamps.localSydney(from: Date(timeIntervalSince1970: ts)))")
                                .font(.system(size: 8, weight: .medium, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.3))
                        }
                        ForEach(Array(store.ibkrReadiness.items.enumerated()), id: \.element.id) { index, item in
                            Button { store.toggleCheckItem(id: item.id) } label: {
                                HStack(spacing: 10) {
                                    Text("\(index + 1)")
                                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.3))
                                        .frame(width: 20)
                                    Text(item.label)
                                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.8))
                                    Spacer()
                                    Text(item.state.rawValue)
                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                        .foregroundStyle(stateColor(item.state))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(stateColor(item.state).opacity(0.1))
                                        .clipShape(Capsule())
                                        .overlay(Capsule().strokeBorder(stateColor(item.state).opacity(0.4), lineWidth: 1))
                                }
                                .padding(.vertical, 6)
                            }
                            .buttonStyle(.plain)
                        }
                        Button { store.verify() } label: {
                            Text("VERIFY")
                                .font(.system(size: 10, weight: .black, design: .monospaced))
                                .tracking(1.8)
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color(red: 0, green: 1, blue: 1))
                                .clipShape(Capsule())
                        }
                        .padding(.top, 10)
                    }
                    .padding(18)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("BACK") { dismiss() }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                }
            }
        }
    }

    private func stateColor(_ state: CheckItemState) -> Color {
        switch state {
        case .ok: return Color(red: 0, green: 1, blue: 1)
        case .no: return .red
        case .unknown: return .white.opacity(0.3)
        }
    }
}
