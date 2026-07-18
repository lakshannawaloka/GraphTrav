import { useId } from 'react';

export function Select({
  label,
  options = [],
  value,
  onChange,
  className = '',
  id,
  ...props
}) {
  const defaultId = useId();
  const selectId = id || defaultId;


  return (
    <div className={`flex flex-col gap-1.5 mb-4 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className="appearance-none bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-3 pr-8 text-xs text-slate-900 dark:text-slate-100 w-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition duration-200 cursor-pointer font-sans"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none opacity-50 text-slate-500 dark:text-slate-400">
          ▼
        </span>
      </div>
    </div>
  );
}
