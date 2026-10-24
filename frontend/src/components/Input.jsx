import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 bg-gray-100 border-0 rounded-apple-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all duration-200',
          error && 'ring-2 ring-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input