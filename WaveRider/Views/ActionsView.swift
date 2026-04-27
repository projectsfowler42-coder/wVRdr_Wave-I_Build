import SwiftUI

struct ActionsView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss
    @State private var confirmReset = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()

                VStack(alignment: .leading, spacing: 14) {
                    sectionLabel("ACTIONS")

                    actionRow("REFRESH", "Fetch quote for selected instrument.", tone: .cyan) {
                        Task { await store.refresh() }
                        dismiss()
                    }
                    actionRow("SCRAPE", "Capture cockpit state to local WAL.", tone: .cyan) {
                        store.scrape()
                        dismiss()
                    }
                    actionRow("VERIFY", "Save IBKR readiness checklist state.", tone: .cyan) {
                        store.verify()
                        dismiss()
                    }
                    actionRow("EXPORT", "Open Proof module for export.", tone: .ghost) {
                        dismiss()
                    }
                    actionRow("RESET SEED", "Restore built-in 4/28 seed state.", tone: .destructive) {
                        confirmReset = true
                    }
                    actionRow("ADVANCED", "Reserved for configuration.", tone: .ghost) {}

                    Spacer()

                    ActionStatusView(item: store.actionStatus)
                }
                .padding(18)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("BACK") { dismiss() }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                }
            }
            .alert("RESET SEED", isPresented: $confirmReset) {
                Button("CANCEL", role: .cancel) {}
                Button("RESET", role: .destructive) {
                    store.resetSeed()
                    dismiss()
                }
            } message: {
                Text("This restores the built-in 4/28 seed state. WAL records are preserved.")
            }
        }
    }

    private enum RowTone { case cyan, ghost, destructive }

    private func actionRow(_ label: String, _ desc: String, tone: RowTone, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(label)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .tracking(1)
                        .foregroundStyle(toneColor(tone))
                    Text(desc)
                        .font(.system(size: 8, weight: .medium, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.35))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.2))
            }
            .padding(12)
            .background(Color.white.opacity(0.03))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(toneColor(tone).opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func toneColor(_ tone: RowTone) -> Color {
        switch tone {
        case .cyan: return Color(red: 0, green: 1, blue: 1)
        case .ghost: return .white.opacity(0.5)
        case .destructive: return .red
        }
    }
}
