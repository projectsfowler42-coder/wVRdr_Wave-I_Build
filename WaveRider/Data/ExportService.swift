import Foundation

enum ExportService {
    static func exportJSON(records: [DataScrapeRecord]) -> Data? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try? encoder.encode(records)
    }

    static func exportCSV(records: [DataScrapeRecord]) -> String {
        let keys = [
            "id", "createdAt", "localTimeZone", "summary", "sourceNote",
            "exportStatus", "truthClass", "sourceMode"
        ]
        var rows = [keys.joined(separator: ",")]
        for r in records {
            let values: [String] = [
                r.id.uuidString,
                String(format: "%.0f", r.createdAt),
                csvEscape(r.localTimeZone),
                csvEscape(r.summary),
                csvEscape(r.sourceNote),
                csvEscape(r.exportStatus),
                r.truthClass.rawValue,
                csvEscape(r.sourceMode)
            ]
            rows.append(values.joined(separator: ","))
        }
        return rows.joined(separator: "\n")
    }

    private static func csvEscape(_ value: String) -> String {
        let escaped = value.replacingOccurrences(of: "\"", with: "\"\"")
        return "\"\(escaped)\""
    }

    static func writeTemporaryFile(name: String, data: Data) -> URL? {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do {
            try data.write(to: url, options: .atomic)
            return url
        } catch {
            return nil
        }
    }
}
