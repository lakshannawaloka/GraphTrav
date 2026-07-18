import { useState } from 'react';
import { Card } from './Ui/Card';
import { Button } from './Ui/Button';
import { Select } from './Ui/Select';

export const LAYOUTS = [
  { value: 'cose', label: 'CoSE (Force-Directed)' },
  { value: 'grid', label: 'Grid Layout' },
  { value: 'circle', label: 'Circle Layout' },
  { value: 'concentric', label: 'Concentric Circles' },
  { value: 'breadthfirst', label: 'Breadth-First Tree' },
  { value: 'random', label: 'Random Placement' }
];

export const SHAPES = [
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'round-rectangle', label: 'Rounded Rectangle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'diamond', label: 'Diamond' }
];

export const EDGE_TYPES = [
  { value: 'bezier', label: 'Bezier Curve' },
  { value: 'straight', label: 'Straight Line' },
  { value: 'taxi', label: 'Taxi (Orthogonal)' },
  { value: 'segments', label: 'Segmented Line' }
];

export const NODE_COLORS = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#475569', label: 'Slate' },
  { value: '#b45309', label: 'Amber' },
  { value: '#be123c', label: 'Rose' },
  { value: '#7c3aed', label: 'Indigo' }
];

export const EDGE_COLORS = [
  { value: '#64748b', label: 'Slate' },
  { value: '#334155', label: 'Dark Slate' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#94a3b8', label: 'Light Slate' }
];

export function ControlPanel({
  onAddNode,
  onAddEdge,
  searchAlgorithms = [],
  selectedAlgorithm,
  onAlgorithmChange,
  startNode,
  onStartNodeChange,
  simulationSpeed,
  onSimulationSpeedChange,
  onStartSimulation,
  onStopSimulation,
  simulationRunning = false,
  simulationDisabled = false,
  simulationSummary,
  simulationError,
  traversalOrder = [],
}) {
  const [newNodeName, setNewNodeName] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('');
  const [addNodeError, setAddNodeError] = useState('');
  const [addEdgeError, setAddEdgeError] = useState('');

  const handleAddNodeSubmit = (e) => {
    e.preventDefault();
    const trimmed = newNodeName.trim();
    if (!trimmed) {
      setAddNodeError('Node name cannot be empty');
      return;
    }
    if (trimmed.includes(':') || trimmed.includes('->') || trimmed.includes(',') || /\s/.test(trimmed)) {
      setAddNodeError('Node name cannot contain spaces, colons, arrows or commas');
      return;
    }
    setAddNodeError('');
    onAddNode(trimmed);
    setNewNodeName('');
  };

  const handleAddEdgeSubmit = (e) => {
    e.preventDefault();
    const src = edgeSource.trim();
    const tgt = edgeTarget.trim();

    if (!src || !tgt) {
      setAddEdgeError('Both source and target are required');
      return;
    }

    if (/\s/.test(src) || /\s/.test(tgt)) {
      setAddEdgeError('Names cannot contain spaces');
      return;
    }

    const trimmedWeight = edgeWeight.trim();
    if (trimmedWeight && Number.isNaN(Number(trimmedWeight))) {
      setAddEdgeError('Weight must be a valid number');
      return;
    }

    setAddEdgeError('');
    onAddEdge(src, tgt, trimmedWeight || undefined);
    setEdgeSource('');
    setEdgeTarget('');
    setEdgeWeight('');
  };

  return (
    <Card title="Interactive Editor" subtitle="Quickly extend your adjacency list" className="mb-6">
      <div className="flex flex-col gap-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 last:border-b-0 last:pb-0">
          <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 font-heading uppercase tracking-[0.18em]">Search Simulation</h5>

          <Select
            label="Algorithm"
            options={searchAlgorithms}
            value={selectedAlgorithm}
            onChange={(e) => onAlgorithmChange?.(e.target.value)}
            className="mb-3"
          />

          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">
              Starting Node
            </label>
            <input
              type="text"
              value={startNode}
              onChange={(e) => onStartNodeChange?.(e.target.value)}
              placeholder="e.g. A"
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">
                Speed
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {Number(simulationSpeed).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={simulationSpeed}
              onChange={(e) => onSimulationSpeedChange?.(Number(e.target.value))}
              className="w-full accent-slate-900 dark:accent-slate-100 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Higher speed advances the traversal faster.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onStartSimulation}
              disabled={simulationDisabled || simulationRunning}
              className="flex-1"
            >
              Start
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStopSimulation}
              disabled={!simulationRunning && !simulationSummary}
              className="flex-1"
            >
              Stop
            </Button>
          </div>

          {simulationError && (
            <p className="text-xs text-rose-500 mt-2 font-medium font-sans">{simulationError}</p>
          )}

          {simulationSummary && !simulationError && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
              {simulationSummary}
            </p>
          )}

          {traversalOrder.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {selectedAlgorithm === 'bfs' ? 'FIFO Visit Order' : 'LIFO Visit Order'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {traversalOrder.length} visited
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {traversalOrder.map((nodeId, index) => (
                  <span
                    key={`${nodeId}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="font-mono opacity-60">{index + 1}</span>
                    <span className="font-mono">{nodeId}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Node Form */}
        <form onSubmit={handleAddNodeSubmit} className="border-b border-slate-200 dark:border-slate-800 pb-5 last:border-b-0 last:pb-0">
          <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-2 font-heading uppercase tracking-[0.18em]">Add Node</h5>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="e.g. NodeX"
              className={`bg-white dark:bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 grow outline-none min-w-0 transition ${
                addNodeError 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
              }`}
            />
            <Button type="submit" variant="primary" size="sm">Add</Button>
          </div>
          {addNodeError && <p className="text-xs text-rose-500 mt-1 font-medium font-sans">{addNodeError}</p>}
        </form>

        {/* Add Edge Form */}
        <form onSubmit={handleAddEdgeSubmit} className="border-b border-slate-200 dark:border-slate-800 pb-5 last:border-b-0 last:pb-0">
          <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-2 font-heading uppercase tracking-[0.18em]">Add Connection</h5>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_120px_auto] sm:items-center">
            <input
              type="text"
              value={edgeSource}
              onChange={(e) => setEdgeSource(e.target.value)}
              placeholder="From"
              className={`bg-white dark:bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 grow outline-none min-w-0 transition ${
                addEdgeError 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
              }`}
            />
            <span className="font-medium text-slate-400 shrink-0 text-sm select-none text-center">to</span>
            <input
              type="text"
              value={edgeTarget}
              onChange={(e) => setEdgeTarget(e.target.value)}
              placeholder="To"
              className={`bg-white dark:bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 grow outline-none min-w-0 transition ${
                addEdgeError 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
              }`}
            />
            <input
              type="text"
              value={edgeWeight}
              onChange={(e) => setEdgeWeight(e.target.value)}
              placeholder="Weight"
              className={`bg-white dark:bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none min-w-0 transition ${
                addEdgeError
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
              }`}
            />
            <Button type="submit" variant="primary" size="sm">Connect</Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Leave weight empty for an unweighted edge.
          </p>
          {addEdgeError && <p className="text-xs text-rose-500 mt-1 font-medium font-sans">{addEdgeError}</p>}
        </form>
      </div>
    </Card>
  );
}
