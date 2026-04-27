import SwiftUI

@main
struct WaveIApp: App {
    @StateObject private var store = WaveIStore(apiBaseURL: "")
    @AppStorage("wvrdr_dark_mode") private var isDark: Bool = true

    var body: some Scene {
        WindowGroup {
            CockpitRootView()
                .environmentObject(store)
                .preferredColorScheme(isDark ? .dark : .light)
        }
    }
}
