export const SEARCH_ALGORITHMS = [
  { value: 'bfs', label: 'Breadth-First Search (BFS)' },
  { value: 'dfs', label: 'Depth-First Search (DFS)' },
  { value: 'iddfs', label: 'Iterative Deepening DFS (IDDFS)' },
  { value: 'bidirectional', label: 'Bidirectional Search' },
  { value: 'ucs', label: 'Uniform Cost Search (UCS)' },
  { value: 'greedy', label: 'Greedy Best-First Search' },
  { value: 'astar', label: 'A* Search' },
];

function buildPath(parents, goalNode) {
  if (!goalNode) {
    return [];
  }

  const path = [];
  let currentNode = goalNode;

  while (currentNode) {
    path.push(currentNode);
    currentNode = parents.get(currentNode) || null;
  }

  return path.reverse();
}

function buildPathEdges(path) {
  const pathEdges = [];

  for (let i = 1; i < path.length; i += 1) {
    pathEdges.push(`${path[i - 1]}-${path[i]}`);
  }

  return pathEdges;
}

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

function buildWeightedAdjacencyMap(elements) {
  const adjacency = new Map();

  elements.forEach((element) => {
    const { id, source, target, weight } = element.data;
    if (id && !source) {
      adjacency.set(id, adjacency.get(id) || []);
    }
    if (source && target) {
      adjacency.set(source, adjacency.get(source) || []);
      adjacency.set(target, adjacency.get(target) || []);
      adjacency.get(source).push({
        target,
        weight: Number.isFinite(Number(weight)) ? Number(weight) : 1,
        edgeId: `${source}-${target}`,
      });
    }
  });

  adjacency.forEach((neighbors) => {
    neighbors.sort((left, right) => {
      if (left.weight !== right.weight) {
        return left.weight - right.weight;
      }

      return left.target.localeCompare(right.target);
    });
  });

  return adjacency;
}

function buildReverseAdjacencyMap(adjacency) {
  const reverse = new Map();

  adjacency.forEach((neighbors, node) => {
    reverse.set(node, reverse.get(node) || []);
    neighbors.forEach((neighbor) => {
      reverse.set(neighbor, reverse.get(neighbor) || []);
      reverse.get(neighbor).push(node);
    });
  });

  reverse.forEach((neighbors) => neighbors.sort());
  return reverse;
}

function getHeuristicValue(heuristics, nodeId) {
  const value = heuristics?.[nodeId];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function buildWeightedFrontierView(frontier) {
  return frontier.map((entry) => entry.node);
}

function sortPriorityFrontier(frontier) {
  frontier.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    if (left.cost !== right.cost) {
      return left.cost - right.cost;
    }

    return left.node.localeCompare(right.node);
  });
}

function createStep({
  node,
  via,
  visited,
  traversedEdges,
  frontier,
  goalNode,
  goalFound,
  goalPath,
  goalPathEdges,
  cost,
  heuristic,
  priority,
}) {
  return {
    node,
    via,
    visited: Array.from(visited),
    traversedEdges: [...traversedEdges],
    frontier,
    goalNode: goalNode || null,
    goalFound,
    goalPath,
    goalPathEdges,
    cost,
    heuristic,
    priority,
  };
}

function runUnweightedSearch(adjacency, algorithm, startNode, goalNode) {
  const visited = new Set();
  const steps = [];
  const traversedEdges = [];
  const traversedEdgeSet = new Set();
  const parents = new Map([[startNode, null]]);
  let foundGoal = false;
  let goalPath = [];
  let goalPathEdges = [];

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
      const frontier = stack.map((entry) => entry.node);
      const isGoal = Boolean(goalNode) && node === goalNode;

      if (isGoal) {
        foundGoal = true;
        goalPath = buildPath(parents, goalNode);
        goalPathEdges = buildPathEdges(goalPath);
      }

      steps.push(createStep({
        node,
        via,
        visited,
        traversedEdges,
        frontier,
        goalNode,
        goalFound: isGoal,
        goalPath,
        goalPathEdges,
        cost: goalPath.length > 0 ? goalPath.length - 1 : visited.size - 1,
        heuristic: 0,
        priority: 0,
      }));

      if (isGoal) {
        break;
      }

      for (let index = neighbors.length - 1; index >= 0; index -= 1) {
        const neighbor = neighbors[index];
        if (!visited.has(neighbor)) {
          if (!parents.has(neighbor)) {
            parents.set(neighbor, node);
          }
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
      const frontier = queue.map((entry) => entry.node);
      const isGoal = Boolean(goalNode) && node === goalNode;

      if (isGoal) {
        foundGoal = true;
        goalPath = buildPath(parents, goalNode);
        goalPathEdges = buildPathEdges(goalPath);
      }

      steps.push(createStep({
        node,
        via,
        visited,
        traversedEdges,
        frontier,
        goalNode,
        goalFound: isGoal,
        goalPath,
        goalPathEdges,
        cost: goalPath.length > 0 ? goalPath.length - 1 : visited.size - 1,
        heuristic: 0,
        priority: 0,
      }));

      if (isGoal) {
        break;
      }

      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          if (!parents.has(neighbor)) {
            parents.set(neighbor, node);
          }
          queue.push({ node: neighbor, via: `${node}-${neighbor}` });
        }
      });
    }
  }

  return {
    steps,
    totalVisited: visited.size,
    goalFound: foundGoal,
    goalPath,
    goalPathEdges,
    solutionCost: goalPath.length > 0 ? goalPath.length - 1 : null,
  };
}

function runIterativeDeepeningSearch(adjacency, startNode, goalNode) {
  const maxDepth = Math.max(adjacency.size - 1, 0);
  const steps = [];
  const globalVisited = new Set();
  const traversedEdges = [];
  const traversedEdgeSet = new Set();
  let foundGoal = false;
  let goalPath = [];
  let goalPathEdges = [];
  let solutionCost = null;

  const runDepthLimitedDfs = (node, depth, limit, parents, pathVisited, activeStack) => {
    if (foundGoal) {
      return;
    }

    pathVisited.add(node);
    globalVisited.add(node);

    const frontier = activeStack.map((entry) => entry.node);
    const isGoal = Boolean(goalNode) && node === goalNode;

    if (isGoal) {
      foundGoal = true;
      goalPath = buildPath(parents, goalNode);
      goalPathEdges = buildPathEdges(goalPath);
      solutionCost = goalPath.length - 1;
    }

    steps.push(createStep({
      node,
      via: activeStack.length > 0 ? activeStack[activeStack.length - 1].via : null,
      visited: globalVisited,
      traversedEdges,
      frontier,
      goalNode,
      goalFound: isGoal,
      goalPath,
      goalPathEdges,
      cost: depth,
      heuristic: 0,
      priority: limit,
    }));

    if (isGoal || depth >= limit) {
      pathVisited.delete(node);
      return;
    }

    const neighbors = adjacency.get(node) || [];
    for (let index = neighbors.length - 1; index >= 0; index -= 1) {
      const neighbor = neighbors[index];
      if (pathVisited.has(neighbor)) {
        continue;
      }

      const via = `${node}-${neighbor}`;
      if (!traversedEdgeSet.has(via)) {
        traversedEdgeSet.add(via);
        traversedEdges.push(via);
      }

      if (!parents.has(neighbor)) {
        parents.set(neighbor, node);
      }

      activeStack.push({ node: neighbor, via });
      runDepthLimitedDfs(neighbor, depth + 1, limit, parents, pathVisited, activeStack);
      activeStack.pop();

      if (foundGoal) {
        pathVisited.delete(node);
        return;
      }
    }

    pathVisited.delete(node);
  };

  for (let limit = 0; limit <= maxDepth; limit += 1) {
    const parents = new Map([[startNode, null]]);
    runDepthLimitedDfs(startNode, 0, limit, parents, new Set(), []);

    if (foundGoal) {
      break;
    }
  }

  return {
    steps,
    totalVisited: globalVisited.size,
    goalFound: foundGoal,
    goalPath,
    goalPathEdges,
    solutionCost,
  };
}

function runBidirectionalSearch(adjacency, startNode, goalNode) {
  const reverseAdjacency = buildReverseAdjacencyMap(adjacency);
  const steps = [];
  const traversedEdges = [];
  const traversedEdgeSet = new Set();
  const forwardVisited = new Set([startNode]);
  const backwardVisited = new Set([goalNode]);
  const forwardParents = new Map([[startNode, null]]);
  const backwardParents = new Map([[goalNode, null]]);
  let forwardFrontier = [startNode];
  let backwardFrontier = [goalNode];
  let foundGoal = false;
  let meetingNode = startNode === goalNode ? startNode : null;
  let goalPath = startNode === goalNode ? [startNode] : [];
  let goalPathEdges = startNode === goalNode ? [] : [];
  let solutionCost = startNode === goalNode ? 0 : null;

  const buildBidirectionalPath = (meetNode) => {
    const forwardPath = buildPath(forwardParents, meetNode);
    const backwardPath = [];
    let cursor = backwardParents.get(meetNode) || null;

    while (cursor) {
      backwardPath.push(cursor);
      cursor = backwardParents.get(cursor) || null;
    }

    return [...forwardPath, ...backwardPath];
  };

  const pushStep = (node, via, frontier) => {
    steps.push(createStep({
      node,
      via,
      visited: new Set([...forwardVisited, ...backwardVisited]),
      traversedEdges,
      frontier,
      goalNode,
      goalFound: foundGoal,
      goalPath,
      goalPathEdges,
      cost: solutionCost ?? traversedEdges.length,
      heuristic: 0,
      priority: 0,
    }));
  };

  if (meetingNode) {
    pushStep(startNode, null, []);
  }

  while (!foundGoal && forwardFrontier.length > 0 && backwardFrontier.length > 0) {
    const nextForward = [];
    for (const node of forwardFrontier) {
      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (forwardVisited.has(neighbor)) {
          continue;
        }

        const via = `${node}-${neighbor}`;
        forwardVisited.add(neighbor);
        forwardParents.set(neighbor, node);
        nextForward.push(neighbor);

        if (!traversedEdgeSet.has(via)) {
          traversedEdgeSet.add(via);
          traversedEdges.push(via);
        }

        if (backwardVisited.has(neighbor)) {
          foundGoal = true;
          meetingNode = neighbor;
          goalPath = buildBidirectionalPath(meetingNode);
          goalPathEdges = buildPathEdges(goalPath);
          solutionCost = goalPath.length - 1;
        }

        pushStep(neighbor, via, [...nextForward, ...backwardFrontier]);

        if (foundGoal) {
          break;
        }
      }

      if (foundGoal) {
        break;
      }
    }

    if (foundGoal) {
      break;
    }
    forwardFrontier = nextForward;

    const nextBackward = [];
    for (const node of backwardFrontier) {
      const neighbors = reverseAdjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (backwardVisited.has(neighbor)) {
          continue;
        }

        const via = `${neighbor}-${node}`;
        backwardVisited.add(neighbor);
        backwardParents.set(neighbor, node);
        nextBackward.push(neighbor);

        if (!traversedEdgeSet.has(via)) {
          traversedEdgeSet.add(via);
          traversedEdges.push(via);
        }

        if (forwardVisited.has(neighbor)) {
          foundGoal = true;
          meetingNode = neighbor;
          goalPath = buildBidirectionalPath(meetingNode);
          goalPathEdges = buildPathEdges(goalPath);
          solutionCost = goalPath.length - 1;
        }

        pushStep(neighbor, via, [...forwardFrontier, ...nextBackward]);

        if (foundGoal) {
          break;
        }
      }

      if (foundGoal) {
        break;
      }
    }

    backwardFrontier = nextBackward;
  }

  return {
    steps,
    totalVisited: new Set([...forwardVisited, ...backwardVisited]).size,
    goalFound: foundGoal,
    goalPath,
    goalPathEdges,
    solutionCost,
  };
}

function runWeightedSearch(adjacency, algorithm, startNode, goalNode, heuristics) {
  const visited = new Set();
  const steps = [];
  const traversedEdges = [];
  const traversedEdgeSet = new Set();
  const parents = new Map([[startNode, null]]);
  const bestCosts = new Map([[startNode, 0]]);
  let foundGoal = false;
  let goalPath = [];
  let goalPathEdges = [];
  let solutionCost = null;

  const frontier = [{
    node: startNode,
    via: null,
    cost: 0,
    heuristic: getHeuristicValue(heuristics, startNode),
    priority: algorithm === 'greedy' ? getHeuristicValue(heuristics, startNode) : algorithm === 'astar'
      ? getHeuristicValue(heuristics, startNode)
      : 0,
  }];

  while (frontier.length > 0) {
    sortPriorityFrontier(frontier);
    const current = frontier.shift();
    const { node, via, cost, heuristic, priority } = current;

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);
    if (via && !traversedEdgeSet.has(via)) {
      traversedEdgeSet.add(via);
      traversedEdges.push(via);
    }

    const neighbors = adjacency.get(node) || [];
    const isGoal = node === goalNode;

    if (isGoal) {
      foundGoal = true;
      goalPath = buildPath(parents, goalNode);
      goalPathEdges = buildPathEdges(goalPath);
      solutionCost = cost;
    }

    steps.push(createStep({
      node,
      via,
      visited,
      traversedEdges,
      frontier: buildWeightedFrontierView(frontier),
      goalNode,
      goalFound: isGoal,
      goalPath,
      goalPathEdges,
      cost,
      heuristic,
      priority,
    }));

    if (isGoal) {
      break;
    }

    neighbors.forEach((neighbor) => {
      if (visited.has(neighbor.target)) {
        return;
      }

      const nextCost = cost + neighbor.weight;
      const nextHeuristic = getHeuristicValue(heuristics, neighbor.target);
      const currentBest = bestCosts.get(neighbor.target);

      if (currentBest !== undefined && nextCost >= currentBest) {
        return;
      }

      bestCosts.set(neighbor.target, nextCost);
      parents.set(neighbor.target, node);

      let nextPriority = nextCost;
      if (algorithm === 'greedy') {
        nextPriority = nextHeuristic;
      } else if (algorithm === 'astar') {
        nextPriority = nextCost + nextHeuristic;
      }

      frontier.push({
        node: neighbor.target,
        via: neighbor.edgeId,
        cost: nextCost,
        heuristic: nextHeuristic,
        priority: nextPriority,
      });
    });
  }

  return {
    steps,
    totalVisited: visited.size,
    goalFound: foundGoal,
    goalPath,
    goalPathEdges,
    solutionCost,
  };
}

export function getNodeIds(elements) {
  return elements
    .filter((element) => element.data?.id && !element.data?.source)
    .map((element) => element.data.id)
    .sort();
}

export function createSearchSimulation(elements, algorithm, startNode, goalNode, heuristics = {}) {
  const adjacency = buildAdjacencyMap(elements);

  if (!adjacency.has(startNode)) {
    return {
      error: `Starting node "${startNode}" does not exist in the current graph.`,
      steps: [],
      totalVisited: 0,
    };
  }

  if (goalNode && !adjacency.has(goalNode)) {
    return {
      error: `Goal node "${goalNode}" does not exist in the current graph.`,
      steps: [],
      totalVisited: 0,
    };
  }

  if ((algorithm === 'ucs' || algorithm === 'greedy' || algorithm === 'astar' || algorithm === 'bidirectional') && !goalNode) {
    return {
      error: `Select a goal node to run ${algorithm.toUpperCase()}.`,
      steps: [],
      totalVisited: 0,
    };
  }

  let result;
  if (algorithm === 'bfs' || algorithm === 'dfs') {
    result = runUnweightedSearch(adjacency, algorithm, startNode, goalNode);
  } else if (algorithm === 'iddfs') {
    result = runIterativeDeepeningSearch(adjacency, startNode, goalNode);
  } else if (algorithm === 'bidirectional') {
    result = runBidirectionalSearch(adjacency, startNode, goalNode);
  } else {
    result = runWeightedSearch(buildWeightedAdjacencyMap(elements), algorithm, startNode, goalNode, heuristics);
  }

  return {
    error: null,
    steps: result.steps,
    totalVisited: result.totalVisited,
    goalNode: goalNode || null,
    goalFound: result.goalFound,
    goalPath: result.goalPath,
    goalPathEdges: result.goalPathEdges,
    solutionCost: result.solutionCost,
  };
}
