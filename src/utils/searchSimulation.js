export const SEARCH_ALGORITHMS = [
  { value: 'bfs', label: 'Breadth-First Search (BFS)' },
  { value: 'dfs', label: 'Depth-First Search (DFS)' },
];

function buildAdjacencyMap(elements) {
  const adjacency = new Map();

  elements.forEach((element) => {
    const { id, source, target } = element.data;
    if (id && !source) {
      adjacency.set(id, adjacency.get(id) || []);
    }
    if (source && target) {
      adjacency.set(source, adjacency.get(source) || []);
      adjacency.set(target, adjacency.get(target) || []);
      adjacency.get(source).push(target);
    }
  });

  adjacency.forEach((neighbors) => neighbors.sort());
  return adjacency;
}

export function getNodeIds(elements) {
  return elements
    .filter((element) => element.data?.id && !element.data?.source)
    .map((element) => element.data.id)
    .sort();
}

export function createSearchSimulation(elements, algorithm, startNode) {
  const adjacency = buildAdjacencyMap(elements);

  if (!adjacency.has(startNode)) {
    return {
      error: `Starting node "${startNode}" does not exist in the current graph.`,
      steps: [],
      totalVisited: 0,
    };
  }

  const visited = new Set();
  const steps = [];
  const traversedEdges = [];
  const traversedEdgeSet = new Set();

  if (algorithm === 'dfs') {
    const stack = [{ node: startNode, via: null }];

    while (stack.length > 0) {
      const { node, via } = stack.pop();
      if (visited.has(node)) {
        continue;
      }

      visited.add(node);
      if (via && !traversedEdgeSet.has(via)) {
        traversedEdgeSet.add(via);
        traversedEdges.push(via);
      }
      const neighbors = adjacency.get(node) || [];
      const queuedNodes = stack.map((entry) => entry.node);

      steps.push({
        node,
        via,
        visited: Array.from(visited),
        traversedEdges: [...traversedEdges],
        frontier: queuedNodes,
      });

      for (let i = neighbors.length - 1; i >= 0; i -= 1) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          stack.push({ node: neighbor, via: `${node}-${neighbor}` });
        }
      }
    }
  } else {
    const queue = [{ node: startNode, via: null }];

    while (queue.length > 0) {
      const { node, via } = queue.shift();
      if (visited.has(node)) {
        continue;
      }

      visited.add(node);
      if (via && !traversedEdgeSet.has(via)) {
        traversedEdgeSet.add(via);
        traversedEdges.push(via);
      }
      const neighbors = adjacency.get(node) || [];
      const queuedNodes = queue.map((entry) => entry.node);

      steps.push({
        node,
        via,
        visited: Array.from(visited),
        traversedEdges: [...traversedEdges],
        frontier: queuedNodes,
      });

      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, via: `${node}-${neighbor}` });
        }
      });
    }
  }

  return {
    error: null,
    steps,
    totalVisited: visited.size,
  };
}
