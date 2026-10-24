import clsx from 'clsx'

export default function Card({ 
  children, 
  padding = 'md', 
  hover = false,
  className = '' 
}) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: 'p-0'
  }

  return (
    <div className={clsx(
      'card',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  )
}