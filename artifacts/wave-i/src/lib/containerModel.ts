import type { ActiveContainerClass } from "@/lib/portfolio";

export const ACTIVE_CONTAINERS: ActiveContainerClass[] = ["WHITE", "MINT", "BLUE", "GREEN"];

export function containerLabel(container: ActiveContainerClass): string {
  switch (container) {
    case "WHITE":
      return "|W| WHITE";
    case "MINT":
      return "|M| MINT";
    case "BLUE":
      return "[B] BLUE";
    case "GREEN":
      return "[G] GREEN";
  }
}

export function containerParentLabel(container: ActiveContainerClass): string {
  if (container === "MINT") return "inside [G] GREEN";
  return "—";
}

export function containerAccent(container: ActiveContainerClass): {
  text: string;
  border: string;
  dim: string;
} {
  switch (container) {
    case "WHITE":
      return {
        text: "text-slate-300",
        border: "border-slate-300/30",
        dim: "bg-slate-300/10",
      };
    case "MINT":
      return {
        text: "text-emerald-300",
        border: "border-emerald-300/30",
        dim: "bg-emerald-300/10",
      };
    case "BLUE":
      return {
        text: "text-blue",
        border: "border-blue/40",
        dim: "bg-blue-dim",
      };
    case "GREEN":
      return {
        text: "text-green",
        border: "border-green/40",
        dim: "bg-green-dim",
      };
  }
}
