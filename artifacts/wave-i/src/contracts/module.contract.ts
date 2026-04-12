export type ModuleLifecycleState =
  | "booting"
  | "ready"
  | "degraded"
  | "failed"
  | "disabled"
  | "quarantined";

export interface ModulePointer {
  module_name: string;
  module_version: string;
  contract_version: string;
  path: string;
  status: "active" | "candidate" | "quarantined" | "retired";
}

export interface ModuleManifest extends ModulePointer {
  purpose: string;
  inputs: string[];
  outputs: string[];
  allowed_states: ModuleLifecycleState[];
  error_states: string[];
  compatibility_policy: string;
  rollback_behavior: string;
}
