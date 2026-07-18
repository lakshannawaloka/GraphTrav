export function Alert({
  children,
  type = 'info', // 'info', 'success', 'warning', 'error'
  title,
  className = '',
  ...props
}) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const alertClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/60',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/60',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/60',
    error: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/60'
  }[type] || '';

  return (
    <div 
      className={`flex gap-3 p-4 rounded-xl text-xs border mb-4 font-sans ${alertClasses} ${className}`} 
      role="alert" 
      {...props}
    >
      <span className="font-semibold text-sm mt-0.5 shrink-0">{getIcon()}</span>
      <div className="flex flex-col">
        {title && <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">{title}</h4>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
}
