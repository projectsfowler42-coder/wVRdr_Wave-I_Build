import Foundation
import SwiftUI

/// Central observable state for the entire Wave-I cockpit.
@MainActor
final class WaveIStore: ObservableObject {
    @Published var ibkrReadiness: IBKRReadiness
    @Published var positions: [PositionSnapshot]
    @Published var fundingEvents: [FundingEvent]
    @Published var accountRails: [AccountRail]
    @Published var actionStatus: ActionStatus = .idle

    @Published var selectedBucket: InstrumentBucket = .green
    @Published var selectedTicker: String = "BKLN"

    @Published var lastQuote: QuoteResponse.Quote?
    @Published var quoteTruthClass: TruthClass = .degraded

    let wal = DataScrapeWAL()
    let client: ThinSpineClient
    let apiBaseURL: String

    init(apiBaseURL: String = "") {
        self.apiBaseURL = apiBaseURL
        self.client = ThinSpineClient(apiBaseURL: apiBaseURL)

        self.ibkrReadiness = IBKRReadiness(
            truthClass: .degraded,
            notes: "All items start UNKNOWN. Manually verify each before deployment.",
            items: [
                ReadinessItem(key: "loginConfirmed", label: "Login confirmed"),
                ReadinessItem(key: "accountActive", label: "Account active"),
                ReadinessItem(key: "fundingPathReady", label: "Funding path ready"),
                ReadinessItem(key: "cashAvailableVisible", label: "Cash available visible"),
                ReadinessItem(key: "settledCashVisible", label: "Settled cash visible"),
                ReadinessItem(key: "buyingPowerVisible", label: "Buying power visible"),
                ReadinessItem(key: "marketDataUsable", label: "Market data / quote feed usable"),
                ReadinessItem(key: "orderPreviewTested", label: "Order preview tested"),
                ReadinessItem(key: "tradingPermissionsConfirmed", label: "Trading permissions confirmed"),
                ReadinessItem(key: "extendedHoursSettingKnown", label: "Extended-hours setting known"),
                ReadinessItem(key: "noBlockingRestrictions", label: "No blocking restrictions")
            ],
            lastVerifiedAt: nil
        )

        self.positions = [
            PositionSnapshot(
                ticker: "BKLN",
                shares: 97,
                account: "Schwab",
                truthClass: .degraded,
                estimatedPrice: nil,
                estimatedMarketValue: nil,
                sourceNote: "Invesco Senior Loan ETF. Custody: Schwab execution rail.",
                lastVerifiedAt: nil
            )
        ]

        self.fundingEvents = [
            FundingEvent(
                source: "First-tier funding release",
                destination: "Schwab",
                amount: 30000,
                targetDate: "2026-04-28",
                status: "EXPECTED",
                settledStatus: "Unknown until verified",
                truthClass: .degraded,
                sourceNote: "Wave-I first-tier release. Target: 2026-04-28."
            )
        ]

        self.accountRails = [
            AccountRail(
                role: "OUTSIDE_RESERVE",
                institutionName: "E*TRADE",
                amount: 20000,
                rate: 3.75,
                status: "ACTIVE",
                truthClass: .degraded,
                sourceNote: "E*TRADE outside reserve. $20K @ 3.75%."
            ),
            AccountRail(
                role: "OUTSIDE_RESERVE",
                institutionName: "Marcus",
                amount: 10000,
                rate: 3.65,
                status: "ACTIVE",
                truthClass: .degraded,
                sourceNote: "Marcus (Goldman Sachs) outside reserve. $10K @ 3.65%."
            )
        ]
    }

    var selectedInstrument: Instrument? {
        InstrumentRegistry.find(selectedTicker)
    }

    var selectedPosition: PositionSnapshot? {
        positions.first { $0.ticker == selectedTicker }
    }

    var instrumentsForBucket: [Instrument] {
        selectedBucket == .blue ? InstrumentRegistry.blue : InstrumentRegistry.green
    }

    func refresh() async {
        setStatus(action: "REFRESH", status: .running, message: "FETCHING…")

        guard await client.hasConnector else {
            lastQuote = nil
            quoteTruthClass = .degraded
            setStatus(
                action: "REFRESH",
                status: .noConnector,
                message: "NO VERIFIED LIVE SOURCE ATTACHED. LOCAL DATA REFRESHED. READINESS UNCHANGED."
            )
            return
        }

        do {
            let response = try await client.fetchQuote(ticker: selectedTicker)
            if let q = response.quotes.first {
                lastQuote = q
                quoteTruthClass = InstrumentRegistry.sourceTruth(q.source)

                if let idx = positions.firstIndex(where: { $0.ticker == selectedTicker }) {
                    positions[idx].estimatedPrice = q.price
                    positions[idx].estimatedMarketValue = q.price * Double(positions[idx].shares)
                    positions[idx].truthClass = quoteTruthClass
                    positions[idx].lastVerifiedAt = q.ts
                }

                setStatus(action: "REFRESH", status: .success, message: "LIVE QUOTE RECEIVED FOR \(q.ticker).")
            } else {
                quoteTruthClass = .failed
                setStatus(action: "REFRESH", status: .failed, message: "NO QUOTE RETURNED FOR \(selectedTicker).")
            }
        } catch {
            quoteTruthClass = .failed
            setStatus(action: "REFRESH", status: .failed, message: error.localizedDescription)
        }
    }

    func scrape() {
        setStatus(action: "SCRAPE", status: .running, message: "CAPTURING STATE…")

        let snapshot = buildSnapshotJSON()
        let record = DataScrapeRecord(
            createdAt: Date().timeIntervalSince1970,
            summary: "Wave-I cockpit scrape — \(selectedTicker) @ \(ibkrReadiness.label).",
            sourceNote: "Local scrape from iOS app.",
            truthClass: deriveTruthClass([ibkrReadiness.truthClass, quoteTruthClass]),
            rawJson: snapshot
        )
        wal.append(record)
        setStatus(action: "SCRAPE", status: .success, message: "STATE CAPTURED TO LOCAL WAL.")
    }

    func verify() {
        ibkrReadiness.lastVerifiedAt = Date().timeIntervalSince1970
        setStatus(action: "VERIFY", status: .success, message: "BROKER READINESS SAVED. \(ibkrReadiness.label).")
    }

    func resetSeed() {
        let fresh = WaveIStore(apiBaseURL: apiBaseURL)
        self.ibkrReadiness = fresh.ibkrReadiness
        self.positions = fresh.positions
        self.fundingEvents = fresh.fundingEvents
        self.accountRails = fresh.accountRails
        self.selectedBucket = .green
        self.selectedTicker = "BKLN"
        self.lastQuote = nil
        self.quoteTruthClass = .degraded
        setStatus(action: "RESET SEED", status: .success, message: "SEED STATE RESTORED.")
    }

    func toggleCheckItem(id: String) {
        guard let idx = ibkrReadiness.items.firstIndex(where: { $0.id == id }) else { return }
        switch ibkrReadiness.items[idx].state {
        case .unknown: ibkrReadiness.items[idx].state = .ok
        case .ok: ibkrReadiness.items[idx].state = .no
        case .no: ibkrReadiness.items[idx].state = .unknown
        }
    }

    func setStatus(action: String, status: ActionStatusCode, message: String) {
        actionStatus = ActionStatus(
            action: action,
            status: status,
            message: message,
            localTimestamp: Timestamps.localSydney(),
            utcTimestamp: Timestamps.utc()
        )
    }

    private func buildSnapshotJSON() -> String {
        struct Snapshot: Codable {
            let selectedTicker: String
            let selectedBucket: String
            let ibkrReadiness: IBKRReadiness
            let positions: [PositionSnapshot]
            let fundingEvents: [FundingEvent]
            let accountRails: [AccountRail]
            let quoteTruthClass: TruthClass
            let localTimestamp: String
            let utcTimestamp: String
        }

        let snap = Snapshot(
            selectedTicker: selectedTicker,
            selectedBucket: selectedBucket.rawValue,
            ibkrReadiness: ibkrReadiness,
            positions: positions,
            fundingEvents: fundingEvents,
            accountRails: accountRails,
            quoteTruthClass: quoteTruthClass,
            localTimestamp: Timestamps.localSydney(),
            utcTimestamp: Timestamps.utc()
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(snap) else { return "{}" }
        return String(data: data, encoding: .utf8) ?? "{}"
    }
}

enum Timestamps {
    private static let sydneyZone = TimeZone(identifier: "Australia/Sydney")!

    static func localSydney(from date: Date = Date()) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH:mm:ss"
        f.timeZone = sydneyZone
        return f.string(from: date)
    }

    static func utc(from date: Date = Date()) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd HH:mm:ss'Z'"
        f.timeZone = TimeZone(identifier: "UTC")
        return f.string(from: date)
    }
}
