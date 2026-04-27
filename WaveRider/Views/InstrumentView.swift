import SwiftUI

struct InstrumentView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        sectionLabel("BUCKET")

                        Picker("Bucket", selection: $store.selectedBucket) {
                            Text("[B] BLUE").tag(InstrumentBucket.blue)
                            Text("[G] GREEN").tag(InstrumentBucket.green)
                        }
                        .pickerStyle(.segmented)
                        .onChange(of: store.selectedBucket) { _, newBucket in
                            let instruments = newBucket == .blue ? InstrumentRegistry.blue : InstrumentRegistry.green
                            if let first = instruments.first {
                                store.selectedTicker = first.ticker
                            }
                        }

                        sectionLabel("INSTRUMENT")

                        ForEach(store.instrumentsForBucket) { inst in
                            Button {
                                store.selectedTicker = inst.ticker
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(inst.ticker)
                                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                                            .foregroundStyle(store.selectedTicker == inst.ticker ? Color(red: 0, green: 1, blue: 1) : .white)
                                        Text(inst.name)
                                            .font(.system(size: 9, weight: .medium, design: .monospaced))
                                            .foregroundStyle(.white.opacity(0.45))
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                    if store.selectedTicker == inst.ticker {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(Color(red: 0, green: 1, blue: 1))
                                            .font(.system(size: 14))
                                    }
                                }
                                .padding(.vertical, 8)
                            }
                            .buttonStyle(.plain)
                        }

                        Divider().overlay(Color.white.opacity(0.1))

                        sectionLabel("POSITION")

                        if let holding = InstrumentRegistry.holding(for: store.selectedTicker) {
                            metaRow("SHARES", "\(holding.shares)")
                            metaRow("ACCOUNT", holding.account)
                            if let pos = store.selectedPosition, let price = pos.estimatedPrice {
                                metaRow("PRICE", "$\(String(format: "%.2f", price))")
                                if let mv = pos.estimatedMarketValue {
                                    metaRow("MKT VALUE", "$\(String(format: "%.2f", mv))")
                                }
                            } else {
                                metaRow("PRICE", "VERIFY")
                                metaRow("MKT VALUE", "VERIFY")
                            }
                            truthBadge(store.selectedPosition?.truthClass ?? .degraded)
                        } else {
                            metaRow("SHARES", "VERIFY / none tracked")
                            truthBadge(.degraded)
                        }

                        if let q = store.lastQuote, q.ticker == store.selectedTicker {
                            Divider().overlay(Color.white.opacity(0.1))
                            sectionLabel("LATEST QUOTE")
                            metaRow("PRICE", "$\(String(format: "%.2f", q.price))")
                            metaRow("PREV CLOSE", "$\(String(format: "%.2f", q.previousClose))")
                            metaRow("CHANGE", "\(String(format: "%.2f", q.changePct))%")
                            metaRow("MARKET STATE", q.marketState)
                            metaRow("VOLUME", "\(q.volume)")
                            metaRow("SOURCE", q.source.uppercased())
                            truthBadge(store.quoteTruthClass)
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
