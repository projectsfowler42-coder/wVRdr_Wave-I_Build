import SwiftUI

struct CockpitRootView: View {
    @EnvironmentObject var store: WaveIStore
    @AppStorage("wvrdr_dark_mode") private var isDark: Bool = true

    @State private var showIBKR = false
    @State private var showInstrument = false
    @State private var showFunding = false
    @State private var showReserves = false
    @State private var showProof = false
    @State private var showActions = false

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)

    var body: some View {
        NavigationStack {
            ZStack {
                backgroundColor.ignoresSafeArea()

                VStack(spacing: 0) {
                    headerSection
                        .padding(.horizontal, 14)
                        .padding(.top, 8)

                    ActionStatusView(item: store.actionStatus)
                        .padding(.horizontal, 14)
                        .padding(.top, 6)

                    LazyVGrid(columns: columns, spacing: 10) {
                        CockpitTile(label: "IBKR", truthClass: store.ibkrReadiness.truthClass, detail: store.ibkrReadiness.isUnverified ? "UNVERIFIED" : store.ibkrReadiness.label) { showIBKR = true }
                        CockpitTile(label: store.selectedTicker, truthClass: store.quoteTruthClass, detail: quoteDetail) { showInstrument = true }
                        CockpitTile(label: "FUNDING", truthClass: store.fundingEvents.first?.truthClass ?? .degraded, detail: fundingDetail) { showFunding = true }
                        CockpitTile(label: "RESERVES", truthClass: deriveTruthClass(store.accountRails.map(\.truthClass)), detail: reservesDetail) { showReserves = true }
                        CockpitTile(label: "PROOF", truthClass: .degraded, detail: "\(store.wal.loadAll().count) RECORDS") { showProof = true }
                        CockpitTile(label: "ACTIONS", truthClass: .degraded, detail: "6 COMMANDS") { showActions = true }
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 12)

                    mainActionStrip
                        .padding(.horizontal, 14)
                        .padding(.top, 12)

                    Spacer(minLength: 0)
                }
            }
            .sheet(isPresented: $showIBKR) { IBKRReadinessView().environmentObject(store) }
            .sheet(isPresented: $showInstrument) { InstrumentView().environmentObject(store) }
            .sheet(isPresented: $showFunding) { FundingView().environmentObject(store) }
            .sheet(isPresented: $showReserves) { ReservesView().environmentObject(store) }
            .sheet(isPresented: $showProof) { ProofView().environmentObject(store) }
            .sheet(isPresented: $showActions) { ActionsView().environmentObject(store) }
        }
    }

    private var headerSection: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text("wVRdr~ WAVE-I")
                    .font(.system(size: 16, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                Text("4/28 DEPLOYMENT COCKPIT")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(.white.opacity(0.45))
            }
            Spacer()
            Button { isDark.toggle() } label: {
                Image(systemName: isDark ? "sun.max.fill" : "moon.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.55))
                    .padding(8)
                    .background(Color.white.opacity(0.06))
                    .clipShape(Circle())
            }
        }
    }

    private var mainActionStrip: some View {
        HStack(spacing: 8) {
            actionButton("REFRESH", tone: .cyan) { Task { await store.refresh() } }
            actionButton("SCRAPE", tone: .cyan) { store.scrape() }
        }
    }

    private func actionButton(_ label: String, tone: ActionTone, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 9, weight: .black, design: .monospaced))
                .tracking(1.8)
                .foregroundStyle(tone == .cyan ? Color.black : Color.white.opacity(0.65))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(tone == .cyan ? Color(red: 0, green: 1, blue: 1) : Color.white.opacity(0.06))
                .clipShape(Capsule())
                .overlay(Capsule().strokeBorder(tone == .cyan ? Color.clear : Color.white.opacity(0.12), lineWidth: 1))
        }
    }

    private enum ActionTone { case cyan, ghost }

    private var quoteDetail: String {
        if let q = store.lastQuote { return "$\(String(format: "%.2f", q.price))" }
        if let h = InstrumentRegistry.holding(for: store.selectedTicker) { return "\(h.shares) SHARES" }
        return "VERIFY"
    }

    private var fundingDetail: String {
        guard let f = store.fundingEvents.first else { return "—" }
        return "$\(Int(f.amount).formatted()) \(f.status)"
    }

    private var reservesDetail: String {
        let total = store.accountRails.reduce(0) { $0 + $1.amount }
        return "$\(Int(total).formatted())"
    }

    private var backgroundColor: Color { Color(red: 0.02, green: 0.025, blue: 0.04) }
}
