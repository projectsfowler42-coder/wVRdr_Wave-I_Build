import SwiftUI

struct CockpitTile: View {
    let label: String
    let truthClass: TruthClass
    let detail: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(label)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .tracking(1.2)
                        .foregroundStyle(.white.opacity(0.6))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Spacer(minLength: 4)
                    Circle()
                        .fill(truthClass.color)
                        .frame(width: 6, height: 6)
                        .shadow(color: truthClass.color.opacity(0.7), radius: 4)
                }

                Text(detail)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)

                Text(truthClass.rawValue)
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .tracking(1)
                    .foregroundStyle(truthClass.color)
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
            .background(Color(red: 0.02, green: 0.03, blue: 0.045).opacity(0.96))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(truthClass.color.opacity(0.22), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
