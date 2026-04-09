import React from "react";
import type { HarvestRunState } from "@/block2/truth/canonical-types";

interface HarvestButtonProps {
  state: HarvestRunState;
  onClick: () => void;
  disabled?: boolean;
}

export function HarvestButton({ state, onClick, disabled }: HarvestButtonProps) {
  const label = state === "running" ? "[Harvesting…]" : "[Harvest Data]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "running"}
      className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 font-medium shadow-sm backdrop-blur"
      aria-live="polite"
    >
      {label}
    </button>
  );
}

export default HarvestButton;
