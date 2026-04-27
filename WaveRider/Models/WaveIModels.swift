import Foundation

// MARK: - Action Status

enum ActionStatusCode: String, Codable {
    case idle        = "IDLE"
    case running     = "RUNNING"
    case success     = "SUCCESS"
    case noConnector = "NO CONNECTOR"
    case noRecord    = "NO RECORD"
    case failed      = "FAILED"
    case active      = "ACTIVE"
}

struct ActionStatus: Codable, Hashable {
    var action: String
    var status: ActionStatusCode
    var message: String
    var localTimestamp: String
    var utcTimestamp: String

    static let idle = ActionStatus(
        action: "—",
        status: .idle,
        message: "SYSTEM IDLE",
        localTimestamp: "—",
        utcTimestamp: "—"
    )
}

// MARK: - IBKR Readiness

enum CheckItemState: String, Codable, Hashable {
    case ok      = "OK"
    case no      = "NO"
    case unknown = "UNKNOWN"
}

struct ReadinessItem: Identifiable, Codable, Hashable {
    let id: String
    let label: String
    var state: CheckItemState

    init(key: String, label: String, state: CheckItemState = .unknown) {
        self.id = key
        self.label = label
        self.state = state
    }
}

struct IBKRReadiness: Codable, Hashable {
    var truthClass: TruthClass
    var notes: String
    var items: [ReadinessItem]
    var lastVerifiedAt: Double?

    var readyCount: Int { items.filter { $0.state == .ok }.count }
    var knownCount: Int { items.filter { $0.state == .ok || $0.state == .no }.count }
    var total: Int { items.count }

    var label: String {
        if knownCount == 0 { return "—/\(total)" }
        if readyCount == total { return "READY" }
        return "\(readyCount)/\(total)"
    }

    var isUnverified: Bool { knownCount == 0 }
}

// MARK: - Position

struct PositionSnapshot: Codable, Hashable, Identifiable {
    var id: String { ticker }
    let ticker: String
    var shares: Int
    var account: String
    var truthClass: TruthClass
    var estimatedPrice: Double?
    var estimatedMarketValue: Double?
    var sourceNote: String
    var lastVerifiedAt: Double?
}

// MARK: - Funding Event

struct FundingEvent: Codable, Hashable, Identifiable {
    let id: UUID
    var source: String
    var destination: String
    var amount: Double
    var targetDate: String
    var status: String
    var settledStatus: String
    var truthClass: TruthClass
    var sourceNote: String
    var lastVerifiedAt: Double?

    init(
        source: String,
        destination: String,
        amount: Double,
        targetDate: String,
        status: String,
        settledStatus: String,
        truthClass: TruthClass,
        sourceNote: String,
        lastVerifiedAt: Double? = nil
    ) {
        self.id = UUID()
        self.source = source
        self.destination = destination
        self.amount = amount
        self.targetDate = targetDate
        self.status = status
        self.settledStatus = settledStatus
        self.truthClass = truthClass
        self.sourceNote = sourceNote
        self.lastVerifiedAt = lastVerifiedAt
    }
}

// MARK: - Account Rail (Reserves)

struct AccountRail: Codable, Hashable, Identifiable {
    var id: String { institutionName }
    var role: String
    var institutionName: String
    var amount: Double
    var rate: Double
    var status: String
    var truthClass: TruthClass
    var sourceNote: String
    var lastVerifiedAt: Double?
}

// MARK: - Quote Response (Thin Spine API)

struct QuoteResponse: Codable {
    let quotes: [Quote]
    let count: Int
    let updatedAt: String

    struct Quote: Codable {
        let ticker: String
        let name: String
        let price: Double
        let previousClose: Double
        let change: Double
        let changePct: Double
        let extendedPrice: Double?
        let extendedChangePct: Double?
        let marketState: String
        let trailingYieldPct: Double?
        let fiftyTwoWeekHigh: Double
        let fiftyTwoWeekLow: Double
        let volume: Int
        let currency: String
        let source: String
        let staleSecs: Int
        let ts: Double
    }
}

// MARK: - Data Scrape Record

struct DataScrapeRecord: Codable, Identifiable, Hashable {
    let id: UUID
    let createdAt: Double
    let localTimeZone: String
    let summary: String
    let sourceNote: String
    var exportStatus: String
    let truthClass: TruthClass
    let sourceMode: String
    let rawJson: String

    init(
        createdAt: Double,
        summary: String,
        sourceNote: String,
        exportStatus: String = "LOCAL_ONLY",
        truthClass: TruthClass,
        sourceMode: String = "SCRAPE",
        rawJson: String
    ) {
        self.id = UUID()
        self.createdAt = createdAt
        self.localTimeZone = "Australia/Sydney"
        self.summary = summary
        self.sourceNote = sourceNote
        self.exportStatus = exportStatus
        self.truthClass = truthClass
        self.sourceMode = sourceMode
        self.rawJson = rawJson
    }
}
