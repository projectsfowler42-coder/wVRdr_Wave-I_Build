import SwiftUI

func sectionLabel(_ text: String) -> some View {
    Text(text)
        .font(.system(size: 10, weight: .bold, design: .monospaced))
        .tracking(1.8)
        .foregroundStyle(.white.opacity(0.45))
}

func metaRow(_ label: String, _ value: String) -> some View {
    HStack {
        Text(label)
            .font(.system(size: 9, weight: .medium, design: .monospaced))
            .foregroundStyle(.white.opacity(0.4))
        Spacer()
        Text(value)
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(.white.opacity(0.8))
    }
}

func truthBadge(_ truthClass: TruthClass) -> some View {
    HStack(spacing: 5) {
        Circle()
            .fill(truthClass.color)
            .frame(width: 5, height: 5)
            .shadow(color: truthClass.color.opacity(0.7), radius: 4)
        Text(truthClass.rawValue)
            .font(.system(size: 9, weight: .bold, design: .monospaced))
            .tracking(1)
            .foregroundStyle(truthClass.color)
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 4)
    .background(truthClass.background)
    .clipShape(Capsule())
    .overlay(Capsule().strokeBorder(truthClass.border, lineWidth: 1))
}
