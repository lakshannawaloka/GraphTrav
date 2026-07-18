export function Card({ children, className = '', contentClassName = '', title, subtitle, extraHeader, ...props }) {
  const hasPadding = /\bp-([0-9]|px|y-|x-)/.test(className);
  return (
    <div 
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm text-left dark:border-slate-800 dark:bg-slate-900 ${hasPadding ? '' : 'p-6'} ${className}`} 
      {...props}
    >
      {(title || subtitle || extraHeader) && (
        <div className={`border-b border-slate-200 pb-4 mb-5 flex justify-between items-start dark:border-slate-800 ${hasPadding ? 'pt-6 px-6' : ''}`}>

          <div>
            {title && <h3 className="text-lg font-semibold text-slate-950 dark:text-white font-heading tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">{subtitle}</p>}
          </div>
          {extraHeader && <div className="shrink-0 ml-4">{extraHeader}</div>}
        </div>
      )}
      <div className={`w-full ${contentClassName}`}>{children}</div>
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
