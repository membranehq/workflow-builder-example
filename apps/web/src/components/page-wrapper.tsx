import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`max-w-7xl mx-auto px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
