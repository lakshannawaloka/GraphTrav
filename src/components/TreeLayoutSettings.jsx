import { Select } from './Ui/Select';
import { RangeField } from './Ui/RangeField';

const TREE_DIRECTIONS = [
  { value: 'top-to-bottom', label: 'Top to Bottom' },
  { value: 'left-to-right', label: 'Left to Right' },
];

const TREE_SORT_MODES = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'input', label: 'Input Order' },
];

export function TreeLayoutSettings({
  nodeOptions = [],
  value,
  onChange,
}) {
  const rootOptions = [
    { value: 'auto', label: 'Auto Detect Root' },
    ...nodeOptions,
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 font-heading">
          Tree Layout
        </h4>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Tune root placement and sibling spacing for cleaner hierarchy rendering.
        </p>
      </div>

      <Select
        label="Root Node"
        options={rootOptions}
        value={value.rootNode}
        onChange={(event) => onChange({ rootNode: event.target.value })}
        className="mb-0"
      />

      <Select
        label="Direction"
        options={TREE_DIRECTIONS}
        value={value.direction}
        onChange={(event) => onChange({ direction: event.target.value })}
        className="mb-0"
      />

      <Select
        label="Sibling Ordering"
        options={TREE_SORT_MODES}
        value={value.sortMode}
        onChange={(event) => onChange({ sortMode: event.target.value })}
        className="mb-0"
      />

      <RangeField
        label="Spacing"
        min="0.8"
        max="2.4"
        step="0.1"
        value={value.spacingFactor}
        onChange={(event) => onChange({ spacingFactor: Number(event.target.value) })}
        formatValue={(nextValue) => `${Number(nextValue).toFixed(1)}x`}
        hint="Increase spacing to reduce overlaps and the zig-zag feel on wide levels."
      />

      <RangeField
        label="Minimum Zoom"
        min="0.5"
        max="1.2"
        step="0.05"
        value={value.minZoom}
        onChange={(event) => onChange({ minZoom: Number(event.target.value) })}
        formatValue={(nextValue) => `${Number(nextValue).toFixed(2)}x`}
        hint="Keeps the tree from zooming out so far that nodes become too small."
      />

      <RangeField
        label="Fit Padding"
        min="10"
        max="60"
        step="2"
        value={value.fitPadding}
        onChange={(event) => onChange({ fitPadding: Number(event.target.value) })}
        formatValue={(nextValue) => `${Math.round(Number(nextValue))}px`}
        hint="Lower padding leaves more room for the tree before the viewport scales it down."
      />
    </div>
  );
}
