import Foundation

/// Write-Ahead Log for Data Scrape records.
/// Persists to JSON file in the app's documents directory.
final class DataScrapeWAL {
    private let fileName = "wvrdr_scrape_wal.json"

    private var fileURL: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent(fileName)
    }

    func loadAll() -> [DataScrapeRecord] {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return [] }
        do {
            let data = try Data(contentsOf: fileURL)
            return try JSONDecoder().decode([DataScrapeRecord].self, from: data)
        } catch {
            return []
        }
    }

    func append(_ record: DataScrapeRecord) {
        var records = loadAll()
        records.insert(record, at: 0)
        save(records)
    }

    func clear() {
        save([])
    }

    private func save(_ records: [DataScrapeRecord]) {
        do {
            let data = try JSONEncoder().encode(records)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            // WAL write failures are surfaced by export/scrape status at call sites when needed.
        }
    }
}
