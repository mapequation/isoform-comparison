export function calcStatistics(
  nodes: {
    path: string | number[];
    flow?: number;
    stateId?: number;
    layerId?: number;
  }[]
) {
  const flowDistribution: { [key: number]: number } = {};
  const layerIds = new Set();
  const topModules = new Set();
  let numLevels = 0;

  nodes.forEach((node) => {
    const topModule = Number(node.path[0]);
    topModules.add(topModule);
    numLevels = Math.max(numLevels, node.path.length);

    if (!flowDistribution[topModule]) {
      flowDistribution[topModule] = 0;
    }
    flowDistribution[topModule] += node.flow ?? 0;

    if (node.layerId !== undefined) {
      layerIds.add(node.layerId);
    }
  });

  const isMultilayer = nodes?.[0]["layerId"] !== undefined;
  const isStateNetwork = nodes?.[0]["stateId"] !== undefined;
  const numLayers = layerIds.size > 0 ? layerIds.size : undefined;

  return {
    flowDistribution,
    isMultilayer,
    isStateNetwork,
    numLayers,
    numTopModules: topModules.size,
    numLevels,
  };
}
