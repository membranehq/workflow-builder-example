import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`w-full py-10 mx-auto container lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
