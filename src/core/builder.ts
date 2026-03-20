import type {
  BindingSemantics,
  HarnessAdapterId,
  HarnessImageLineage,
  HarnessImageMetadata,
  PlacementContract,
  RebindingContract,
  WorkspaceBinding,
  WorkspaceBindingRule,
} from "./types.js";

export const DEFAULT_COMPONENT_ROOTS = {
  config: "config",
  workspace: "workspace",
  workspaces: "workspaces",
  reports: "reports",
  state: "state",
} as const;

const DEFAULT_PERSISTED_MANIFEST_PATH = ".harness-manifest.json";

export function createImageMetadata(packId: string, adapter: HarnessAdapterId): HarnessImageMetadata {
  return {
    imageId: packId,
    adapter,
  };
}

export function createInitialLineage(): HarnessImageLineage {
  return {
    parentImage: null,
    layerOrder: [],
  };
}

export function createResolvedLineage(
  packId: string,
  parentImage: HarnessImageLineage["parentImage"]
): HarnessImageLineage {
  if (parentImage === null) {
    return createInitialLineage();
  }

  return {
    parentImage,
    layerOrder: [parentImage.imageId, packId],
  };
}

export function createBindingSemantics(workspaces: readonly WorkspaceBinding[]): BindingSemantics {
  const workspaceRules: WorkspaceBindingRule[] = workspaces.map((workspace) => ({
    agentId: workspace.agentId,
    logicalPath: workspace.logicalPath,
    targetRelativePath: workspace.isDefault ? "workspace" : workspace.logicalPath,
    configTargets: workspace.isDefault
      ? ["agents.defaults.workspace", `agents.list[${workspace.agentId}].workspace`]
      : [`agents.list[${workspace.agentId}].workspace`],
    required: true,
  }));

  return {
    workspaces: workspaceRules,
  };
}

export function createPlacementContract(): PlacementContract {
  return {
    reservedRoots: [
      DEFAULT_COMPONENT_ROOTS.config,
      DEFAULT_COMPONENT_ROOTS.workspace,
      DEFAULT_COMPONENT_ROOTS.workspaces,
      DEFAULT_COMPONENT_ROOTS.reports,
      DEFAULT_COMPONENT_ROOTS.state,
    ],
    componentRoots: { ...DEFAULT_COMPONENT_ROOTS },
    persistedManifestPath: DEFAULT_PERSISTED_MANIFEST_PATH,
  };
}

export function createRebindingContract(bindings: BindingSemantics): RebindingContract {
  return {
    workspaceTargetMode: "absolute-path",
    mutableConfigTargets: [...new Set(bindings.workspaces.flatMap((binding) => binding.configTargets))],
  };
}
