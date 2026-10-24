import { forwardRef } from 'react'
import clsx from 'clsx'

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-[var(--apple-blue)] text-white hover:bg-[var(--apple-blue-hover)] shadow-md hover:shadow-lg active:scale-95',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95',
    ghost: 'bg-transparent text-[var(--apple-blue)] hover:bg-blue-50 active:scale-95 shadow-none',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
    success: 'bg-green-500 text-white hover:bg-green-600 active:scale-95',
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button