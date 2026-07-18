import { useEffect, useMemo, useRef, useState } from 'react';
import { parseAdjacencyList } from './utils/graphParser';
import { Card } from './components/Ui/Card';
import { TextArea } from './components/Ui/TextArea';
import { Button } from './components/Ui/Button';
import { Alert } from './components/Ui/Alert';
import { Select } from './components/Ui/Select';
import { ControlPanel, LAYOUTS, SHAPES, EDGE_TYPES, NODE_COLORS, EDGE_COLORS } from './components/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { createSearchSimulation, getNodeIds, SEARCH_ALGORITHMS } from './utils/searchSimulation';

const DEFAULT_PRESET = 'A: B C\nB: D E\nC: F G\nD:\nE:\nF:\nG:';

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

function formatTargetToken(target, weight) {
  const normalizedWeight = weight === undefined || weight === null || String(weight).trim() === ''
    ? undefined
    : String(weight).trim();

  return normalizedWeight === undefined ? target : `${target}(${normalizedWeight})`;
}

function getJsonTargetName(entry) {
  if (Array.isArray(entry)) {
    return String(entry[0] ?? '').trim();
  }

  if (entry && typeof entry === 'object') {
    return String(entry.target ?? entry.node ?? entry.id ?? '').trim();
  }

  return parseTargetToken(entry)?.target || '';
}

function createJsonTargetEntry(target, weight) {
  const normalizedWeight = weight === undefined || weight === null || String(weight).trim() === ''
    ? undefined
    : String(weight).trim();

  return normalizedWeight === undefined ? target : { target, weight: normalizedWeight };
}

function App() {
  const [adjacencyList, setAdjacencyList] = useState(DEFAULT_PRESET);
  const [isStylingOpen, setIsStylingOpen] = useState(false);
  const simulationTimerRef = useRef(null);

  // Styling and visualization state
  const [layoutName, setLayoutName] = useState('cose');
  const [nodeShape, setNodeShape] = useState('ellipse');
  const [nodeColor, setNodeColor] = useState('#2563eb');
  const [edgeColor, setEdgeColor] = useState('#64748b');
  const [edgeType, setEdgeType] = useState('bezier');
  const [directed, setDirected] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [searchAlgorithm, setSearchAlgorithm] = useState('bfs');
  const [startNode, setStartNode] = useState('A');
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationError, setSimulationError] = useState('');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState([]);
  const [simulationStepIndex, setSimulationStepIndex] = useState(-1);

  // Parse adjacency list in real-time
  const parseResult = useMemo(() => {
    return parseAdjacencyList(adjacencyList);
  }, [adjacencyList]);

  const nodeIds = useMemo(() => getNodeIds(parseResult.elements), [parseResult.elements]);

  const currentSimulationStep = useMemo(() => {
    if (simulationStepIndex < 0 || simulationStepIndex >= simulationSteps.length) {
      return null;
    }
    return simulationSteps[simulationStepIndex];
  }, [simulationStepIndex, simulationSteps]);

  const simulationSummary = useMemo(() => {
    if (simulationRunning && currentSimulationStep) {
      return `${searchAlgorithm.toUpperCase()} visiting ${currentSimulationStep.node}. Step ${simulationStepIndex + 1} of ${simulationSteps.length}.`;
    }

    if (simulationStepIndex >= 0 && simulationSteps.length > 0) {
      return `${searchAlgorithm.toUpperCase()} explored ${simulationSteps.length} node${simulationSteps.length === 1 ? '' : 's'} from ${startNode.trim()}.`;
    }

    if (nodeIds.length > 0) {
      return `Available starting nodes: ${nodeIds.join(', ')}.`;
    }

    return '';
  }, [currentSimulationStep, nodeIds, searchAlgorithm, simulationRunning, simulationStepIndex, simulationSteps, startNode]);

  const traversalOrder = useMemo(() => {
    if (!currentSimulationStep?.visited) {
      return [];
    }
    return currentSimulationStep.visited;
  }, [currentSimulationStep]);

  const clearSimulationTimer = () => {
    if (simulationTimerRef.current) {
      window.clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  };

  const stopSimulation = () => {
    clearSimulationTimer();
    setSimulationRunning(false);
  };

  useEffect(() => {
    return () => clearSimulationTimer();
  }, []);

  useEffect(() => {
    if (parseResult.error) {
      stopSimulation();
      setSimulationSteps([]);
      setSimulationStepIndex(-1);
      return;
    }

    if (!startNode.trim() && nodeIds.length > 0) {
      setStartNode(nodeIds[0]);
    }
  }, [nodeIds, parseResult.error, startNode]);

  const handleAdjacencyChange = (e) => {
    stopSimulation();
    setSimulationSteps([]);
    setSimulationStepIndex(-1);
    setAdjacencyList(e.target.value);
    setSimulationError('');
  };

  const handleClear = () => {
    setAdjacencyList('');
    stopSimulation();
    setSimulationSteps([]);
    setSimulationStepIndex(-1);
    setSimulationError('');
  };

  const handleAddNode = (nodeName) => {
    stopSimulation();
    setSimulationSteps([]);
    setSimulationStepIndex(-1);
    setSimulationError('');
    const trimmed = adjacencyList.trim();

    // Check if JSON format
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed);
        if (!obj[nodeName]) {
          obj[nodeName] = [];
          setAdjacencyList(JSON.stringify(obj, null, 2));
        }
        return;
      } catch {
        // fall back to default string append
      }
    }

    // Line/Adjacency format
    const lines = adjacencyList.split('\n');
    const nodeExists = lines.some(line => {
      const parts = line.split(/[:=->]+/);
      return parts[0].trim() === nodeName;
    });

    if (!nodeExists) {
      const separator = adjacencyList.endsWith('\n') || !adjacencyList ? '' : '\n';
      setAdjacencyList(prev => prev + separator + `${nodeName}:`);
    }
  };

  const handleAddEdge = (src, tgt, weight) => {
    stopSimulation();
    setSimulationSteps([]);
    setSimulationStepIndex(-1);
    setSimulationError('');
    const trimmed = adjacencyList.trim();
    const normalizedWeight = weight === undefined || weight === null || String(weight).trim() === ''
      ? undefined
      : String(weight).trim();

    // Check if JSON format
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed);
        const sourceTargets = Array.isArray(obj[src])
          ? [...obj[src]]
          : obj[src] !== undefined
            ? [obj[src]]
            : [];
        const existingTargetIndex = sourceTargets.findIndex((entry) => getJsonTargetName(entry) === tgt);

        if (existingTargetIndex === -1) {
          sourceTargets.push(createJsonTargetEntry(tgt, normalizedWeight));
        } else if (normalizedWeight !== undefined) {
          sourceTargets[existingTargetIndex] = createJsonTargetEntry(tgt, normalizedWeight);
        }
        obj[src] = sourceTargets;
        if (!obj[tgt]) obj[tgt] = []; // make sure target node is also declared
        setAdjacencyList(JSON.stringify(obj, null, 2));
        return;
      } catch {
        // fall back
      }
    }

    // Line/Adjacency format
    const lines = adjacencyList.split('\n');
    let lineIndex = -1;
    let isArrow = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || line.startsWith('//')) continue;
      
      const colonIndex = line.indexOf(':');
      const arrowIndex = line.indexOf('->');
      
      if (arrowIndex !== -1 && line.substring(0, arrowIndex).trim() === src) {
        lineIndex = i;
        isArrow = true;
        break;
      } else if (colonIndex !== -1 && line.substring(0, colonIndex).trim() === src) {
        lineIndex = i;
        isArrow = false;
        break;
      }
    }

    if (lineIndex !== -1) {
      // Append target to existing line
      const line = lines[lineIndex];
      const separator = isArrow ? '->' : ':';
      const parts = line.split(separator);
      const sourcePart = parts[0];
      const targetsPart = parts.slice(1).join(separator).trim();
      
      const targets = targetsPart
        .split(/[, \t]+/)
        .map(parseTargetToken)
        .filter(Boolean);
      const existingTargetIndex = targets.findIndex((entry) => entry.target === tgt);

      if (existingTargetIndex === -1) {
        targets.push({ target: tgt, weight: normalizedWeight });
      } else if (normalizedWeight !== undefined) {
        targets[existingTargetIndex] = { target: tgt, weight: normalizedWeight };
      }

      const formattedTargets = isArrow
        ? targets.map((entry) => formatTargetToken(entry.target, entry.weight)).join(', ')
        : targets.map((entry) => formatTargetToken(entry.target, entry.weight)).join(' ');
      lines[lineIndex] = `${sourcePart}${separator} ${formattedTargets}`;
      setAdjacencyList(lines.join('\n'));
    } else {
      // Create new line for source and target
      const separator = adjacencyList.endsWith('\n') || !adjacencyList ? '' : '\n';
      const hasArrows = adjacencyList.includes('->');
      const targetToken = formatTargetToken(tgt, normalizedWeight);
      const newLine = hasArrows ? `${src} -> ${targetToken}` : `${src}: ${targetToken}`;
      setAdjacencyList(prev => prev + separator + newLine);
    }
  };

  const handleStartSimulation = () => {
    stopSimulation();

    if (parseResult.error || parseResult.elements.length === 0) {
      setSimulationError('Enter a valid graph before starting a simulation.');
      setSimulationSteps([]);
      setSimulationStepIndex(-1);
      return;
    }

    const normalizedStartNode = startNode.trim();
    if (!normalizedStartNode) {
      setSimulationError('Provide a starting node to begin the traversal.');
      return;
    }

    const result = createSearchSimulation(parseResult.elements, searchAlgorithm, normalizedStartNode);
    if (result.error) {
      setSimulationError(result.error);
      setSimulationSteps([]);
      setSimulationStepIndex(-1);
      return;
    }

    if (result.steps.length === 0) {
      setSimulationError('No traversal steps were generated for this graph.');
      setSimulationSteps([]);
      setSimulationStepIndex(-1);
      return;
    }

    setSimulationError('');
    setSimulationSteps(result.steps);
    setSimulationStepIndex(0);

    if (result.steps.length === 1) {
      setSimulationRunning(false);
      return;
    }

    setSimulationRunning(true);
  };

  const handleStopSimulation = () => {
    stopSimulation();
  };

  useEffect(() => {
    if (!simulationRunning || simulationSteps.length === 0) {
      clearSimulationTimer();
      return undefined;
    }

    const intervalMs = Math.max(150, Math.round(900 / simulationSpeed));
    simulationTimerRef.current = window.setInterval(() => {
      setSimulationStepIndex((currentIndex) => {
        if (currentIndex >= simulationSteps.length - 1) {
          clearSimulationTimer();
          setSimulationRunning(false);
          return currentIndex;
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= simulationSteps.length - 1) {
          clearSimulationTimer();
          setSimulationRunning(false);
        }
        return nextIndex;
      });
    }, intervalMs);

    return () => clearSimulationTimer();
  }, [simulationRunning, simulationSpeed, simulationSteps]);

  return (
    <div className="h-screen w-screen p-4 md:p-6 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex flex-col overflow-hidden">
      {/* Title Header */}
      <header className="mb-6 w-full shrink-0">
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Graph Workspace
            </p>
            <h1 className="text-2xl font-semibold font-heading text-slate-950 dark:text-white py-0.5">
            graphtrav
            </h1>
            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              Real-time graph visualization and traversal from adjacency-list input.
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsStylingOpen(true)}
            className="py-2 px-3 text-xs"
          >
            Styling & Layout
          </Button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 w-full flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Input & Editing Tools */}
        <div className="flex flex-col gap-6 h-full min-h-0 overflow-y-auto pr-1">
          {/* Adjacency List Input Card */}
          <Card 
            title="Adjacency List Input" 
            subtitle="Type your graph structure below"
            extraHeader={
              adjacencyList && (
                <Button size="sm" variant="outline" onClick={handleClear} className="py-1 px-2.5 text-xs font-semibold">
                  Clear
                </Button>
              )
            }
          >
            <TextArea
              label="Graph Representation"
              value={adjacencyList}
              onChange={handleAdjacencyChange}
              placeholder="e.g.&#10;A: B(4) C(2)&#10;B: D(7)&#10;C:&#10;D: A(3)"
              error={parseResult.error}
              rows={8}
            />

            {parseResult.error ? (
              <Alert type="error" title="Parsing Error">
                {parseResult.error}
              </Alert>
            ) : null}
          </Card>

          <ControlPanel
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            searchAlgorithms={SEARCH_ALGORITHMS}
            selectedAlgorithm={searchAlgorithm}
            onAlgorithmChange={(value) => {
              setSearchAlgorithm(value);
              setSimulationError('');
            }}
            startNode={startNode}
            onStartNodeChange={(value) => {
              setStartNode(value);
              setSimulationError('');
            }}
            simulationSpeed={simulationSpeed}
            onSimulationSpeedChange={setSimulationSpeed}
            onStartSimulation={handleStartSimulation}
            onStopSimulation={handleStopSimulation}
            simulationRunning={simulationRunning}
            simulationDisabled={parseResult.elements.length === 0}
            simulationSummary={simulationSummary}
            simulationError={simulationError}
            traversalOrder={traversalOrder}
          />

          {/* Quick Syntax Info Card */}
          <Card title="Supported Formats">
            <div className="flex flex-col gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Colon format:</strong>
                <div>
                  Links nodes using a colon: <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">NodeA: NodeB NodeC</code>
                </div>
              </div>
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Arrow format:</strong>
                <div>
                  Links nodes using arrows: <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">NodeA {"->"} NodeB, NodeC</code>
                </div>
              </div>
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Weighted format:</strong>
                <div>
                  Add weights with parentheses: <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">NodeA: NodeB(4) NodeC(2.5)</code>
                </div>
              </div>
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">JSON format:</strong>
                <div>
                  Declare structures as a dictionary of node keys and target arrays. Weighted entries can use <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">["NodeB", 4]</code> or <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">{`{"target":"NodeB","weight":4}`}</code>.
                </div>
              </div>
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Single nodes:</strong>
                <div>
                  Declare standalone nodes like <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">NodeA:</code> or just <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">NodeA</code> on a line.
                </div>
              </div>
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Comments:</strong>
                <div>
                  Lines beginning with <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">#</code> or <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono font-semibold">//</code> are ignored.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Visualization */}
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {/* Visualization Graph Canvas */}
          <GraphCanvas
            elements={parseResult.elements}
            layoutName={layoutName}
            nodeColor={nodeColor}
            nodeShape={nodeShape}
            edgeColor={edgeColor}
            edgeType={edgeType}
            directed={directed}
            showLabels={showLabels}
            className="flex-1 min-h-0"
            simulationState={currentSimulationStep}
          />
        </div>

      </main>

      {/* Slide-out Drawer for Styling & Layout Settings */}
      {isStylingOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsStylingOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-50 border-l border-slate-200 dark:border-slate-800 animate-[slideLeft_0.25s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">
                Styling & Layout Settings
              </h3>
              <Button size="sm" variant="outline" onClick={() => setIsStylingOpen(false)} className="py-0.5 px-2 text-xs">
                Close
              </Button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <Select
                label="Layout Engine"
                options={LAYOUTS}
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
              />

              <Select
                label="Node Shape"
                options={SHAPES}
                value={nodeShape}
                onChange={(e) => setNodeShape(e.target.value)}
              />

              <Select
                label="Node Color"
                options={NODE_COLORS}
                value={nodeColor}
                onChange={(e) => setNodeColor(e.target.value)}
              />

              <Select
                label="Edge Style"
                options={EDGE_TYPES}
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value)}
              />

              <Select
                label="Edge Color"
                options={EDGE_COLORS}
                value={edgeColor}
                onChange={(e) => setEdgeColor(e.target.value)}
              />

              <div className="flex flex-col gap-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={directed}
                    onChange={(e) => setDirected(e.target.checked)}
                    className="cursor-pointer accent-slate-900 dark:accent-slate-100 w-4 h-4 rounded"
                  />
                  <span className="font-semibold font-heading">Directed Edges</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="cursor-pointer accent-slate-900 dark:accent-slate-100 w-4 h-4 rounded"
                  />
                  <span className="font-semibold font-heading">Show Labels</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
