import { useId } from 'react';

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  error,
  info,
  className = '',
  id,
  rows = 8,
  ...props
}) {
  const defaultId = useId();
  const areaId = id || defaultId;


  return (
    <div className={`flex flex-col gap-1.5 mb-4 w-full ${className}`}>
      {label && (
        <label htmlFor={areaId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-heading">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`bg-white dark:bg-slate-950 border rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 font-mono resize-y w-full focus:outline-none transition duration-200 ${
          error 
            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
            : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-sans mt-1 font-medium">{error}</p>}
      {!error && info && <p className="text-xs text-emerald-500 font-sans mt-1 font-medium">{info}</p>}
    </div>
  );
}
