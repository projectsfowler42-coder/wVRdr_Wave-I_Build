import SwiftUI

struct ReservesView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()
                VStack(alignment: .leading, spacing: 14) {
                    sectionLabel("OUTSIDE RESERVES")
                    ForEach(store.accountRails) { rail in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(rail.institutionName).font(.system(size: 14, weight: .bold, design: .monospaced)).foregroundStyle(.white)
                                Spacer()
                                truthBadge(rail.truthClass)
                            }
                            metaRow("AMOUNT", String(Int(rail.amount).formatted()))
                            metaRow("RATE", String(format: "%.2f", rail.rate))
                            metaRow("STATUS", rail.status)
                            metaRow("ROLE", rail.role)
                            Text(rail.sourceNote).font(.system(size: 8, weight: .medium, design: .monospaced)).foregroundStyle(.white.opacity(0.3))
                        }
                        .padding(14)
                        .background(Color.white.opacity(0.03))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    let total = store.accountRails.reduce(0) { $0 + $1.amount }
                    metaRow("TOTAL RESERVES", String(Int(total).formatted()))
                    Spacer()
                }
                .padding(18)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("BACK") { dismiss() }.font(.system(size: 10, weight: .bold, design: .monospaced))
                }
            }
        }
    }
}
