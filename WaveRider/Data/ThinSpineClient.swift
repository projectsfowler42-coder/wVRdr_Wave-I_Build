import Foundation

/// Thin Spine API client. If apiBaseURL is empty, no network fetch occurs.
actor ThinSpineClient {
    let apiBaseURL: String

    init(apiBaseURL: String = "") {
        self.apiBaseURL = apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var hasConnector: Bool {
        !apiBaseURL.isEmpty
    }

    func fetchQuote(ticker: String) async throws -> QuoteResponse {
        guard hasConnector else { throw ThinSpineError.noConnector }
        guard let encodedTicker = ticker.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(apiBaseURL)/api/market/quotes?tickers=\(encodedTicker)") else {
            throw ThinSpineError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw ThinSpineError.badResponse
        }
        return try JSONDecoder().decode(QuoteResponse.self, from: data)
    }

    enum ThinSpineError: LocalizedError {
        case noConnector
        case invalidURL
        case badResponse

        var errorDescription: String? {
            switch self {
            case .noConnector: return "NO VERIFIED LIVE SOURCE ATTACHED."
            case .invalidURL: return "INVALID API URL."
            case .badResponse: return "BAD RESPONSE FROM API."
            }
        }
    }
}
