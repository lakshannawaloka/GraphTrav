export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  icon,
  className = '', 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-colors duration-200 gap-2 select-none rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-sans border';
  
  const sizeClasses = size === 'sm' 
    ? 'px-3 py-2 text-xs' 
    : 'px-4 py-2.5 text-sm';
    
  const variantClasses = {
    primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:hover:border-white',
    secondary: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    outline: 'border-slate-300 bg-transparent text-slate-700 hover:bg-white hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600'
  }[variant] || '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading && (
        <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full shrink-0"></span>
      )}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
