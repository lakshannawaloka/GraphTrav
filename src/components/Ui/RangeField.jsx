import { useId } from 'react';

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue = (nextValue) => nextValue,
  hint,
  id,
}) {
  const defaultId = useId();
  const inputId = id || defaultId;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">
          {label}
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {formatValue(value)}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full accent-slate-900 dark:accent-slate-100 cursor-pointer"
      />
      {hint ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

