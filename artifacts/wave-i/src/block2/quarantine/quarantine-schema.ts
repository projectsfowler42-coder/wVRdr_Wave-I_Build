import type { SourceRef, QuarantineReason } from "@/block2/truth/canonical-types";

export interface QuarantineItem {
  id: string;
  relatedTicker?: string;
  source: SourceRef;
  payloadHash: string;
  fetchTime: string;
  parseStatus: "raw" | "parsed" | "parse_failed";
  reason: QuarantineReason;
  sourceClass: "weak" | "scraped" | "legacy" | "manual" | "conflicted";
  originalPayload: unknown;
  notes?: string;
}
