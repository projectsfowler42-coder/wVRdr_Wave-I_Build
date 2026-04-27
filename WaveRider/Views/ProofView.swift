import SwiftUI

struct ProofView: View {
    @EnvironmentObject var store: WaveIStore
    @Environment(\.dismiss) private var dismiss
    @State private var shareItems: [Any] = []
    @State private var showShare = false

    private var records: [DataScrapeRecord] { store.wal.loadAll() }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.025, blue: 0.04).ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionLabel("WAL PROOF RECORDS")

                        if records.isEmpty {
                            Text("NO RECORDS.")
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundStyle(.yellow)
                                .padding(.vertical, 20)
                        } else {
                            ForEach(records) { record in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(Timestamps.localSydney(from: Date(timeIntervalSince1970: record.createdAt)))
                                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                                            .foregroundStyle(.white.opacity(0.6))
                                        Spacer()
                                        truthBadge(record.truthClass)
                                    }
                                    Text(record.summary)
                                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.7))
                                    Text(record.exportStatus)
                                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.3))
                                }
                                .padding(12)
                                .background(Color.white.opacity(0.03))
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                        }

                        HStack(spacing: 8) {
                            exportButton("EXPORT JSON") { exportJSON() }
                            exportButton("EXPORT CSV") { exportCSV() }
                        }
                        .padding(.top, 10)
                    }
                    .padding(18)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("BACK") { dismiss() }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                }
            }
            .sheet(isPresented: $showShare) {
                ActivityView(items: shareItems)
            }
        }
    }

    private func exportButton(_ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 9, weight: .black, design: .monospaced))
                .tracking(1)
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color(red: 0, green: 1, blue: 1))
                .clipShape(Capsule())
        }
    }

    private func exportJSON() {
        guard !records.isEmpty else {
            store.setStatus(action: "EXPORT", status: .noRecord, message: "NO RECORDS TO EXPORT.")
            return
        }
        guard let data = ExportService.exportJSON(records: records),
              let url = ExportService.writeTemporaryFile(name: "wvrdr_wal_export.json", data: data) else {
            store.setStatus(action: "EXPORT", status: .failed, message: "JSON EXPORT FAILED.")
            return
        }
        shareItems = [url]
        showShare = true
        store.setStatus(action: "EXPORT", status: .success, message: "JSON READY FOR SHARE.")
    }

    private func exportCSV() {
        guard !records.isEmpty else {
            store.setStatus(action: "EXPORT", status: .noRecord, message: "NO RECORDS TO EXPORT.")
            return
        }
        let csv = ExportService.exportCSV(records: records)
        guard let data = csv.data(using: .utf8),
              let url = ExportService.writeTemporaryFile(name: "wvrdr_wal_export.csv", data: data) else {
            store.setStatus(action: "EXPORT", status: .failed, message: "CSV EXPORT FAILED.")
            return
        }
        shareItems = [url]
        showShare = true
        store.setStatus(action: "EXPORT", status: .success, message: "CSV READY FOR SHARE.")
    }
}

struct ActivityView: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
