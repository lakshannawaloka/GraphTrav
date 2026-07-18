import { Card } from './Ui/Card';

const PRESETS = [
  {
    name: 'Binary Tree',
    icon: '🌳',
    description: 'A simple hierarchical tree structure',
    value: 'A: B C\nB: D E\nC: F G\nD:\nE:\nF:\nG:'
  },
  {
    name: '5-Cycle',
    icon: '🔁',
    description: 'A directed cyclic graph of length 5',
    value: 'A -> B\nB -> C\nC -> D\nD -> E\nE -> A'
  },
  {
    name: 'Complete Graph (K5)',
    icon: '🕸️',
    description: 'Every node is connected to every other node',
    value: '1: 2 3 4 5\n2: 1 3 4 5\n3: 1 2 4 5\n4: 1 2 3 5\n5: 1 2 3 4'
  },
  {
    name: '2x3 Grid Graph',
    icon: '🏁',
    description: 'Nodes connected in a grid grid layout',
    value: '1: 2 4\n2: 1 3 5\n3: 2 6\n4: 1 5\n5: 2 4 6\n6: 3 5'
  },
  {
    name: 'DAG (Workflow)',
    icon: '⚡',
    description: 'Directed Acyclic Graph with multiple paths',
    value: 'Start: TaskA TaskB\nTaskA: Subtask1 Subtask2\nTaskB: Subtask2 Subtask3\nSubtask1: Merge\nSubtask2: Merge\nSubtask3: Merge\nMerge: End'
  },
  {
    name: 'JSON Format Graph',
    icon: '{}',
    description: 'Graph defined using raw JSON syntax',
    value: '{\n  "Hub": ["Node1", "Node2", "Node3", "Node4"],\n  "Node1": ["Hub", "Subnode1"],\n  "Node2": ["Hub"],\n  "Node3": ["Hub"],\n  "Node4": ["Hub"]\n}'
  }
];

export function PresetSelector({ onSelect, selectedPresetName }) {
  return (
    <Card 
      title="Preset Graphs" 
      subtitle="Click to load a pre-built example" 
      className="mb-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESETS.map((preset) => {
          const isActive = selectedPresetName === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              className={`flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border rounded-xl p-3 cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                isActive 
                  ? 'border-violet-500 dark:border-violet-400 bg-violet-500/5 dark:bg-violet-400/5 ring-1 ring-violet-500/30 dark:ring-violet-400/30' 
                  : 'border-slate-200 dark:border-slate-800/80 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-white dark:hover:bg-slate-900'
              }`}
              onClick={() => onSelect(preset.value, preset.name)}
            >
              <span className="text-xl shrink-0 select-none">{preset.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate font-heading">{preset.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 opacity-90">{preset.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

