function getNodeData(element) {
  return element?.data?.source ? null : element?.data ?? null;
}

function getEdgeData(element) {
  return element?.data?.source && element?.data?.target ? element.data : null;
}

function getDefaultTreeRoot(elements = []) {
  const nodeIds = [];
  const inDegreeMap = new Map();

  elements.forEach((element) => {
    const node = getNodeData(element);
    if (!node?.id) {
      return;
    }

    nodeIds.push(node.id);
    inDegreeMap.set(node.id, 0);
  });

  elements.forEach((element) => {
    const edge = getEdgeData(element);
    if (!edge?.target || !inDegreeMap.has(edge.target)) {
      return;
    }

    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
  });

  const rootNode = nodeIds.find((nodeId) => (inDegreeMap.get(nodeId) || 0) === 0);
  return rootNode || nodeIds[0] || null;
}

function createBreadthFirstTransform(direction) {
  if (direction === 'left-to-right') {
    return (_node, position) => ({
      x: position.y,
      y: position.x,
    });
  }

  return (_node, position) => position;
}

function createTreeLayoutConfig(baseLayout, elements, treeLayout) {
  const {
    rootNode = 'auto',
    direction = 'top-to-bottom',
    spacingFactor = 1.4,
    fitPadding = 30,
    sortMode = 'alphabetical',
  } = treeLayout || {};

  const resolvedRoot = rootNode === 'auto' ? getDefaultTreeRoot(elements) : rootNode;
  const layout = {
    ...baseLayout,
    name: 'breadthfirst',
    directed: true,
    circle: false,
    grid: false,
    avoidOverlap: true,
    spacingFactor,
    padding: fitPadding,
    roots: resolvedRoot ? [resolvedRoot] : undefined,
    transform: createBreadthFirstTransform(direction),
  };

  if (sortMode === 'alphabetical') {
    layout.depthSort = (nodeA, nodeB) => {
      const labelA = nodeA.data('label') || nodeA.id();
      const labelB = nodeB.data('label') || nodeB.id();
      return String(labelA).localeCompare(String(labelB));
    };
  }

  return layout;
}

export function getGraphNodeOptions(elements = []) {
  return elements
    .map((element) => getNodeData(element))
    .filter(Boolean)
    .map((node) => ({
      value: node.id,
      label: node.label || node.id,
    }));
}

export function createLayoutConfig({
  layoutName,
  elements = [],
  treeLayout,
  animate = true,
  animationDuration = 400,
  fit = true,
  padding = 50,
}) {
  const baseLayout = {
    name: layoutName,
    animate,
    animationDuration,
    fit,
    padding,
  };

  if (layoutName === 'breadthfirst') {
    return createTreeLayoutConfig(baseLayout, elements, treeLayout);
  }

  if (layoutName === 'cose') {
    return {
      ...baseLayout,
      nodeRepulsion: () => 4500,
      idealEdgeLength: () => 50,
    };
  }

  return baseLayout;
}

export function getViewportConfig(layoutName, treeLayout) {
  if (layoutName !== 'breadthfirst') {
    return {
      minZoom: 0.2,
      maxZoom: 3,
      fitPadding: 50,
    };
  }

  const {
    minZoom = 0.8,
    fitPadding = 30,
  } = treeLayout || {};

  return {
    minZoom,
    maxZoom: 3,
    fitPadding,
  };
}
