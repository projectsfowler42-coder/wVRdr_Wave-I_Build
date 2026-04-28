import Foundation

enum InstrumentBucket: String, Codable, Hashable, CaseIterable {
    case blue  = "BLUE"
    case green = "GREEN"

    var tag: String {
        switch self {
        case .blue:  return "[B]"
        case .green: return "[G]"
        }
    }
}

struct Instrument: Identifiable, Codable, Hashable {
    var id: String { ticker }
    let ticker: String
    let name: String
    let bucket: InstrumentBucket
    let assetType: String
    let exchange: String
    let role: String
}

struct KnownHolding {
    let shares: Int
    let account: String
}

enum InstrumentRegistry {

    static let all: [Instrument] = [
        Instrument(ticker: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "RESERVE"),
        Instrument(ticker: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "RESERVE"),
        Instrument(ticker: "SHV", name: "iShares Short Treasury Bond ETF", bucket: .blue, assetType: "ETF", exchange: "NASDAQ", role: "RESERVE"),
        Instrument(ticker: "TFLO", name: "iShares Treasury Floating Rate Bond ETF", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "RESERVE"),
        Instrument(ticker: "USFR", name: "WisdomTree Floating Rate Treasury Fund", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "RESERVE"),
        Instrument(ticker: "JAAA", name: "Janus Henderson AAA CLO ETF", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "MINT", name: "PIMCO Enhanced Short Maturity Active ETF", bucket: .blue, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "BKLN", name: "Invesco Senior Loan ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "PRIMARY"),
        Instrument(ticker: "SRLN", name: "SPDR Blackstone Senior Loan ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "HYG", name: "iShares iBoxx $ High Yield Corporate Bond ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "SJNK", name: "SPDR Bloomberg Short Term High Yield Bond ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "JBBB", name: "Janus Henderson B-BBB CLO ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "JEPI", name: "JPMorgan Equity Premium Income ETF", bucket: .green, assetType: "ETF", exchange: "NYSE Arca", role: "INCOME"),
        Instrument(ticker: "JEPQ", name: "JPMorgan Nasdaq Equity Premium Income ETF", bucket: .green, assetType: "ETF", exchange: "NASDAQ", role: "INCOME"),
        Instrument(ticker: "O", name: "Realty Income Corporation", bucket: .green, assetType: "REIT", exchange: "NYSE", role: "INCOME"),
        Instrument(ticker: "VICI", name: "VICI Properties Inc", bucket: .green, assetType: "REIT", exchange: "NYSE", role: "INCOME")
    ]

    static var blue: [Instrument] { all.filter { $0.bucket == .blue } }
    static var green: [Instrument] { all.filter { $0.bucket == .green } }

    static func find(_ ticker: String) -> Instrument? {
        all.first { $0.ticker == ticker }
    }

    static let knownHoldings: [String: KnownHolding] = [
        "BKLN": KnownHolding(shares: 97, account: "Schwab")
    ]

    static func holding(for ticker: String) -> KnownHolding? {
        knownHoldings[ticker]
    }

    static func sourceTruth(_ source: String?) -> TruthClass {
        guard let s = source?.lowercased() else { return .degraded }
        switch s {
        case "live": return .live
        case "stale": return .stale
        case "fallback": return .degraded
        default: return .degraded
        }
    }
}
