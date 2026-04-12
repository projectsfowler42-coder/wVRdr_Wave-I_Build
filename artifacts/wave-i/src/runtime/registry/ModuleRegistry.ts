import modulePointers from "@/runtime/registry/module-pointers.json";
import type { ModulePointer } from "@/contracts/module.contract";

const MODULE_POINTERS = modulePointers as ModulePointer[];

export function listRegisteredModules(): ModulePointer[] {
  return [...MODULE_POINTERS];
}

export function getRegisteredModule(moduleName: string): ModulePointer | undefined {
  return MODULE_POINTERS.find((module) => module.module_name === moduleName);
}
