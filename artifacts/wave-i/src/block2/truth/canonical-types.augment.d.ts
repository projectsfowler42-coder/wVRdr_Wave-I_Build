import type { SourceLabel, TruthClass } from "@/block2/truth/canonical-types";

declare module "@/block2/truth/canonical-types" {
  export interface TruthFieldProvenance {
    fieldName: string;
    sourceLabel: SourceLabel;
    truthClass: TruthClass;
    asOf: string;
    inputs: string[];
  }
}
