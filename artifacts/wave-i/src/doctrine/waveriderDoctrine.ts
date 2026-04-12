export type DoctrineStatus = "present" | "partial" | "missing";

export interface DoctrineItem {
  name: string;
  source: string;
  status: DoctrineStatus;
  doctrine: string;
  repoState: string;
  nextSurface: string;
}

export const SYSTEM_SPINE: DoctrineItem[] = [
  {
    name: "Aggregator",
    source: "WaveRider Systematic Colation",
    status: "partial",
    doctrine: "Raw intake for ticks, flows, macro data, links, and operator notes.",
    repoState: "Quote board, market tape, research links, and the local instrument database exist, but intake is still narrow.",
    nextSurface: "Make intake scope and raw-feed provenance explicit in the shell.",
  },
  {
    name: "Gate",
    source: "WaveRider Systematic Colation",
    status: "missing",
    doctrine: "Enforced execution separation with a tactical brake before action.",
    repoState: "No operator-facing pause, timer, or approval checkpoint exists yet.",
    nextSurface: "Add a visible tactical brake and approval flow before any action protocol is promoted.",
  },
  {
    name: "Coach",
    source: "WaveRider Systematic Colation",
    status: "missing",
    doctrine: "Observation -> Evidence -> Context structuring without making the decision for the user.",
    repoState: "The shell has inspection surfaces, but no dedicated Coach-format output layer.",
    nextSurface: "Surface structured observations without auto-conclusions or advice language.",
  },
  {
    name: "System",
    source: "WaveRider Systematic Colation",
    status: "partial",
    doctrine: "Final user-controlled execution surface after intake and gating.",
    repoState: "The shell exists, but no dedicated action protocol or execution-ready handoff is represented.",
    nextSurface: "Define the last-mile operator action surface while preserving frontend-only truth.",
  },
];

export const OPERATOR_DISCIPLINE: DoctrineItem[] = [
  {
    name: "20-minute Tactical Brake",
    source: "WaveRider Systematic Colation",
    status: "missing",
    doctrine: "The user should be separated from immediate execution by a hard pause.",
    repoState: "No timer, interlock, or hold-state is present in the current shell.",
    nextSurface: "Promote the brake into a first-class operator widget.",
  },
  {
    name: "Explicit User Approval",
    source: "WaveRider Systematic Colation",
    status: "missing",
    doctrine: "Rules and observations require explicit approval before implementation.",
    repoState: "The shell is inspectable but does not yet model approval as a visible doctrine state.",
    nextSurface: "Track proposed, approved, rejected, and quarantined operator changes.",
  },
  {
    name: "No Silent Prioritization",
    source: "WaveRider Systematic Colation",
    status: "partial",
    doctrine: "Surface raw intake and contradictions rather than silently compressing them away.",
    repoState: "Truth, conflict, and quarantine panels exist, but the intake layer remains thinner than the imported doctrine.",
    nextSurface: "Show unresolved conflicts, failed ideas, and observational-only material more directly.",
  },
  {
    name: "Rule Library",
    source: "WaveRider Systematic Colation",
    status: "missing",
    doctrine: "User-authored rules should be preserved as a repository, not ad hoc memory.",
    repoState: "No visible local rules registry exists yet.",
    nextSurface: "Add a local rules register with provenance and approval state.",
  },
];

export const CONSTRAINT_STACK: DoctrineItem[] = [
  {
    name: "Constraint Engine",
    source: "WaveRider Full Conversation / Prop Firm Strategy",
    status: "missing",
    doctrine: "Daily loss, drawdown, and target rules must be explicit and first-class.",
    repoState: "No constraint model is exposed in the frontend shell.",
    nextSurface: "Represent prop-rule envelopes as visible doctrine objects.",
  },
  {
    name: "Constraint-aware PreCog",
    source: "WaveRider Full Conversation / Final Drop",
    status: "missing",
    doctrine: "State anticipation should adapt to the active rule structure before action.",
    repoState: "PreCog is referenced in imported docs but not represented in Wave-I.",
    nextSurface: "Expose predictive state switching as doctrine, not invisible magic.",
  },
  {
    name: "Monte Carlo Simulation Layer",
    source: "WaveRider Full Conversation / Final Drop",
    status: "missing",
    doctrine: "Robustness claims need distributions, failure curves, and simulated pass rates.",
    repoState: "No simulation ledger or result surface exists in the shell.",
    nextSurface: "Add a frontend-visible simulation registry before any certainty claims are shown.",
  },
  {
    name: "Playbook Compiler",
    source: "WaveRider Full Conversation / Prop Firm Strategy",
    status: "missing",
    doctrine: "Map portfolio behaviors into executable plays per regime and rule structure.",
    repoState: "No playbook surface is visible in the current shell.",
    nextSurface: "Represent plays, triggers, and failure modes as inspectable doctrine objects.",
  },
  {
    name: "Capital Translator",
    source: "WaveRider Full Conversation / Block-6 Capital Engine",
    status: "partial",
    doctrine: "Translate wallets, reserves, and deployment posture into capital behavior.",
    repoState: "M/W/B/G semantics and local holdings exist, but capital-engine language is not yet surfaced as doctrine.",
    nextSurface: "Promote wallet orchestration and reserve posture into an explicit capital panel.",
  },
  {
    name: "Meta Optimizer",
    source: "WaveRider Full Conversation / Final Drop",
    status: "missing",
    doctrine: "Score for survival quality and passability, not raw profit alone.",
    repoState: "No optimizer or scoring surface exists.",
    nextSurface: "Show optimization targets and why they are allowed to change.",
  },
  {
    name: "Risk Governor",
    source: "WaveRider Full Conversation / Prop Firm Strategy",
    status: "missing",
    doctrine: "Dynamic scaling and kill-switch logic must be visible and explainable.",
    repoState: "No operator-facing risk-governor state exists.",
    nextSurface: "Expose throttles, kill conditions, and cooldown states.",
  },
  {
    name: "Output Layer",
    source: "WaveRider Full Conversation / Prop Firm Strategy",
    status: "partial",
    doctrine: "The shell should emit a clear operator-ready blueprint rather than hidden internal state.",
    repoState: "War Room is usable, but there is no dedicated prop-pass or execution blueprint surface.",
    nextSurface: "Add a front-end blueprint panel that summarizes doctrine state honestly.",
  },
  {
    name: "Evolution Engine",
    source: "Final Drop / Block-6 Capital Engine",
    status: "missing",
    doctrine: "The system should learn from batch outcomes and update parameters over time.",
    repoState: "No evolution or adaptation ledger is represented in Wave-I.",
    nextSurface: "Track what is allowed to evolve, what is fixed, and why.",
  },
];
