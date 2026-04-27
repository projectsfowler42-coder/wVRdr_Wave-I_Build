import SwiftUI

struct FundingView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionLabel("FUNDING EVENTS")

                        ForEach(store.fundingEvents) { event in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("$\(Int(event.amount).formatted())")
                                        .font(.system(size: 20, weight: .bold, design: .monospaced))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    truthBadge(event.truthClass)
                                }

                                metaRow("SOURCE", event.source)
                                metaRow("DESTINATION", event.destination)
                                metaRow("TARGET", event.targetDate)
                                metaRow("STATUS", event.status)
                                metaRow("SETTLED", event.settledStatus)

                                Text(event.sourceNote)
                                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                                    .foregroundStyle(.white.opacity(0.3))
                            }
                            .padding(14)
                            .background(Color.white.opacity(0.03))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .strokeBorder(event.truthClass.color.opacity(0.2), lineWidth: 1)
                            )
                        }
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
}
