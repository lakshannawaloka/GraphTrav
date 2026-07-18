/**
 * Parses a string representation of an adjacency list into Cytoscape.js elements.
 * Supports:
 * 1. Arrow notation: A -> B, C, D
 * 2. Colon notation: A: B C D or A: B, C, D
 * 3. Space-separated: A B C D (First item is source, rest are targets)
 * 4. Weighted targets: A -> B(4), C(2.5) or A: B(4) C(2.5)
 * 5. JSON format: {"A": ["B", ["C", 4], {"target": "D", "weight": 2}]}
 *
 * It also filters out empty lines and comments (lines starting with # or //).
 */
function parseTargetToken(token) {
  const trimmedToken = String(token).trim();
  if (!trimmedToken) {
    return null;
  }

  const weightedMatch = trimmedToken.match(/^(.*?)\(([^()]+)\)$/);
  if (!weightedMatch) {
    return {
      target: trimmedToken,
      weight: undefined,
    };
  }

  const target = weightedMatch[1].trim();
  const weight = weightedMatch[2].trim();
  if (!target) {
    return null;
  }

  return {
    target,
    weight: weight || undefined,
  };
}

function createEdgeData(source, target, weight) {
  const normalizedWeight = weight === undefined || weight === null || String(weight).trim() === ''
    ? undefined
    : String(weight).trim();

  return {
    id: `${source}-${target}`,
    source,
    target,
    ...(normalizedWeight !== undefined
      ? {
          weight: normalizedWeight,
          weightLabel: normalizedWeight,
        }
      : {}),
  };
}

function parseJsonTargetEntry(entry) {
  if (Array.isArray(entry)) {
    const [target, weight] = entry;
    const parsedTarget = String(target ?? '').trim();
    if (!parsedTarget) {
      return null;
    }

    return {
      target: parsedTarget,
      weight: weight,
    };
  }

  if (entry && typeof entry === 'object') {
    const rawTarget = entry.target ?? entry.node ?? entry.id;
    const parsedTarget = String(rawTarget ?? '').trim();
    if (!parsedTarget) {
      return null;
    }

    return {
      target: parsedTarget,
      weight: entry.weight,
    };
  }

  return parseTargetToken(entry);
}

export function parseAdjacencyList(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { elements: [], error: null, info: "Empty input. Start typing or choose a preset." };
  }

  // Try JSON parsing first
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      const nodes = new Set();
      const edges = [];

      for (const [source, targets] of Object.entries(obj)) {
        const src = source.trim();
        if (!src) continue;
        nodes.add(src);

        const targetList = Array.isArray(targets) ? targets : [targets];
        for (const targetEntry of targetList) {
          const parsedTarget = parseJsonTargetEntry(targetEntry);
          if (!parsedTarget?.target) continue;
          const { target: tgt, weight } = parsedTarget;
          nodes.add(tgt);
          edges.push({
            data: createEdgeData(src, tgt, weight)
          });
        }
      }

      const elements = [
        ...Array.from(nodes).map(node => ({ data: { id: node, label: node } })),
        ...edges
      ];

      return { elements, error: null, info: `Successfully parsed JSON graph with ${nodes.size} nodes and ${edges.length} edges.` };
    } catch (e) {
      // If it looks like JSON but fails, report error
      if (trimmed.endsWith('}')) {
        return { elements: [], error: `Invalid JSON format: ${e.message}`, info: null };
      }
      // Otherwise fall through to line-by-line parsing
    }
  }

  // Line-by-line parsing
  const lines = trimmed.split('\n');
  const nodes = new Set();
  const edges = [];
  const edgeTracker = new Set(); // to avoid duplicates

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    // Skip empty lines and comments
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) {
      continue;
    }

    let source = '';
    let targetsStr = '';

    // Check for "->" delimiter
    if (rawLine.includes('->')) {
      const parts = rawLine.split('->');
      source = parts[0].trim();
      targetsStr = parts.slice(1).join('->').trim();
    }
    // Check for ":" delimiter
    else if (rawLine.includes(':')) {
      const parts = rawLine.split(':');
      source = parts[0].trim();
      targetsStr = parts.slice(1).join(':').trim();
    }
    // Check for "=" delimiter
    else if (rawLine.includes('=')) {
      const parts = rawLine.split('=');
      source = parts[0].trim();
      targetsStr = parts.slice(1).join('=').trim();
    }
    // Default to whitespace/space separated
    else {
      // Split by whitespace
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        source = words[0];
        targetsStr = words.slice(1).join(' ');
      }
    }

    if (!source) {
      return {
        elements: [],
        error: `Line ${i + 1}: Could not determine the source node.`,
        info: null
      };
    }

    nodes.add(source);

    // Parse targets
    if (targetsStr) {
      // split by commas or spaces
      const targets = targetsStr
        .split(/[, \t]+/)
        .map(parseTargetToken)
        .filter(Boolean);

      for (const targetEntry of targets) {
        const { target, weight } = targetEntry;
        nodes.add(target);
        const edgeId = `${source}-${target}`;
        if (!edgeTracker.has(edgeId)) {
          edgeTracker.add(edgeId);
          edges.push({
            data: createEdgeData(source, target, weight)
          });
        }
      }
    }
  }

  const elements = [
    ...Array.from(nodes).map(node => ({ data: { id: node, label: node } })),
    ...edges
  ];

  return {
    elements,
    error: null,
    info: `Successfully parsed adjacency list with ${nodes.size} nodes and ${edges.length} edges.`
  };
}

/**
 * Converts elements back to an adjacency list string format.
 */
export function stringifyGraph(elements, format = 'colon') {
  const adj = {};
  const allNodes = new Set();

  // Initialize adjacency list
  elements.forEach(el => {
    if (!el.data.source && el.data.id) {
      adj[el.data.id] = [];
      allNodes.add(el.data.id);
    }
  });

  // Populate edges
  elements.forEach(el => {
    if (el.data.source && el.data.target) {
      const src = el.data.source;
      const tgt = el.data.target;
      if (!adj[src]) adj[src] = [];
      adj[src].push(el.data.weight !== undefined ? `${tgt}(${el.data.weight})` : tgt);
      allNodes.add(src);
      allNodes.add(tgt);
    }
  });

  if (format === 'json') {
    return JSON.stringify(adj, null, 2);
  }

  let result = '';
  for (const node of Array.from(allNodes).sort()) {
    const targets = adj[node] || [];
    if (format === 'arrow') {
      result += `${node} -> ${targets.join(', ')}\n`;
    } else {
      result += `${node}: ${targets.join(' ')}\n`;
    }
  }
  return result.trim();
}
